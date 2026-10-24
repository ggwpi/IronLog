import crypto from 'node:crypto'
import { isDue } from '../coach/core/cadence.js'
import { localClock as clockFor, enqueuePush } from './jobs.js'
import { CONSENT_VERSION } from '../coach/core/categories.js'
import { account, one, rows } from './db.js'
import { readProfile } from './profiles.js'
import { requireUser, throttle } from './session.js'
import { answer, fail } from './http.js'
import {
  ADAPTERS,
  cfgOf,
  envOf,
  settingsOf,
  sealKey,
  openKey,
  providerFetch,
  encryptionKey,
} from './coach-transport.js'
import { HTTP_PROVIDERS } from '../coach/core/providers.js'
import * as payloadLib from '../coach/core/payload.js'
import { hashPlan } from '../coach/core/plan-hash.js'
import { runPipeline } from '../coach/core/pipeline.js'
export const DAILY_CAP = 10
const today = () => new Date().toISOString().slice(0, 10)
const enabled = () => {
  if (/^(1|true|yes|on)$/i.test(process.env.COACH_DISABLED || '')) return false
  try {
    encryptionKey()
    return true
  } catch {
    return false
  }
}
const get = (db, uid) =>
  one(db, 'select * from ironlog.coach where user_id=$1 for update', [uid])
async function ensure(db, uid) {
  await db.query(
    'insert into ironlog.coach(user_id) values($1) on conflict do nothing',
    [uid]
  )
  return get(db, uid)
}
async function statePut(db, uid, state) {
  await db.query(
    'update ironlog.coach set state=$2,updated_at=now() where user_id=$1',
    [uid, state]
  )
}
const consentFor = (config) => config.provider + '|' + config.baseUrl
const capOf = (s) => ({
  used: s.daily?.date === today() ? s.daily.count : 0,
  limit: DAILY_CAP,
})
function connected(r) {
  return !!(
    r?.config?.provider &&
    (r.secret || r.config.provider === 'compatible')
  )
}
export async function coachConfig(db, uid) {
  if (!enabled()) return null
  const r = await get(db, uid)
  return {
    cloud: true,
    enabled: connected(r),
    connected: connected(r),
    authMode: 'profile',
    provider: r?.config?.provider || null,
    community: false,
  }
}
const publicSettings = (r) => ({
  ...r?.config,
  connected: connected(r),
  hasKey: !!r?.secret,
})
function credential(body, r, settings, uid) {
  const key = body.apiKey
  if (
    key !== undefined &&
    (typeof key !== 'string' || key.length > 4096 || /[\r\n\0]/.test(key))
  )
    fail(400, 'invalid API key')
  if (key?.trim()) return key.trim()
  // A saved key is never forwarded to a different provider or endpoint.
  if (
    r?.secret &&
    r.config.provider === settings.provider &&
    r.config.baseUrl === settings.baseUrl
  )
    return openKey(uid, settings.provider, r.secret)
  if (settings.provider === 'compatible') return ''
  fail(400, 'API key required')
}
function checkedSettings(body) {
  try {
    return settingsOf(body)
  } catch {
    fail(400, 'invalid provider or HTTPS endpoint')
  }
}
function guard(ctx) {
  const u = requireUser(ctx)
  // Cookies can change when another tab signs into a different account. A form with a
  // typed key must still belong to the account that opened it, rather than silently
  // attaching that key to the newly signed-in profile.
  if (
    ctx.req.method !== 'GET' &&
    ['/api/coach/settings', '/api/coach/models'].includes(ctx.url.pathname) &&
    ctx.body.accountId !== u.id
  )
    fail(409, 'Your account changed. Reload IronLog.', 'account-changed')
  if (!enabled()) fail(503, 'Coach is not configured', 'off')
  return u
}
async function cancel(db, uid, r, removeKey = false) {
  await db.query(
    "update ironlog.jobs set done_at=now(),last_error=null where kind='coach' and payload->>'userId'=$1 and done_at is null",
    [uid]
  )
  const state = {
    daily: r.state.daily,
    history: [],
    reviewedAt: r.state.reviewedAt || 0,
  }
  await db.query(
    'update ironlog.coach set state=$2,version=version+1,config=$3,secret=$4,updated_at=now() where user_id=$1',
    [uid, state, removeKey ? {} : r.config, removeKey ? null : r.secret]
  )
}
export async function enqueueCoach(db, uid, kind, body = {}) {
  const r = await ensure(db, uid),
    S = await readProfile(db, uid)
  if (!connected(r)) fail(503, 'Connect your own AI provider first', 'off')
  if (
    !S?.coach?.consent?.agreedAt ||
    S.coach.consent.version !== CONSENT_VERSION
  )
    fail(403, 'Coach consent required', 'consent')
  if (r.state.current) fail(409, 'Coach is already running', 'busy')
  if (capOf(r.state).used >= DAILY_CAP)
    fail(429, 'Daily Coach limit reached', 'cap', { retryAfter: 3600 })
  for (const key of ['note', 'refine'])
    if (
      body[key] != null &&
      (typeof body[key] !== 'string' || body[key].length > 4000)
    )
      fail(400, 'message too long')
  if (body.refine && r.state.pending?.kind !== 'create')
    fail(409, 'No plan to refine', 'stale')
  if (kind === 'debrief' && !payloadLib.findWorkout(S, body.workoutId))
    fail(400, 'workout not found')
  const job = {
    id: crypto.randomUUID(),
    kind,
    state: 'queued',
    startedAt: Date.now(),
  }
  const input = {
    intake: kind === 'create' ? body.intake || null : null,
    note: body.note || null,
    refine: body.refine || null,
    lang: payloadLib.langTag(body.lang),
    workoutId:
      typeof body.workoutId === 'string' ? body.workoutId.slice(0, 40) : null,
  }
  // Bound intake and free text before persisting a queued request.
  if (JSON.stringify(input).length > 12000) fail(400, 'request too large')
  const state = {
    ...r.state,
    providerConsent: consentFor(r.config),
    current: { ...job, input, version: r.version },
    lastError: null,
    daily: { date: today(), count: capOf(r.state).used + 1 },
  }
  await statePut(db, uid, state)
  await db.query(
    "insert into ironlog.jobs(id,kind,payload,due_at) values($1,'coach',$2,now())",
    [job.id, { userId: uid }]
  )
  return { job }
}
export const coachRoutes = {
  'GET /api/coach/settings': async (ctx) => {
    const u = guard(ctx)
    return answer(publicSettings(await get(ctx.db, u.id)))
  },
  'POST /api/coach/models': async (ctx) => {
    const u = guard(ctx)
    await throttle(ctx.db, 'coach-models:' + u.id, 5, 60)
    const s = checkedSettings(ctx.body),
      r = await get(ctx.db, u.id),
      key = credential(ctx.body, r, s, u.id)
    // Network I/O happens after the request transaction commits, without user/DB locks.
    return {
      outside: async () => {
        const result = await ADAPTERS[s.provider].models(
          cfgOf(s),
          envOf(s, key),
          { fetch: ctx.coachFetch || providerFetch, timeoutMs: 20000 }
        )
        return answer(
          result.ok
            ? { ok: true, models: result.models.slice(0, 2000) }
            : {
                ok: false,
                code: /401|403|API key/i.test(result.error)
                  ? 'auth'
                  : 'provider',
                error: /401|403|API key/i.test(result.error)
                  ? 'API key rejected'
                  : 'Could not reach provider',
                models: [],
              }
        )
      },
    }
  },
  'POST /api/coach/settings': async (ctx) => {
    const u = guard(ctx)
    await throttle(ctx.db, 'coach-settings:' + u.id, 5, 60)
    const s = checkedSettings(ctx.body)
    if (!s.model) fail(400, 'model required')
    const r = await ensure(ctx.db, u.id),
      key = credential(ctx.body, r, s, u.id)
    await cancel(ctx.db, u.id, r)
    await ctx.db.query(
      'update ironlog.coach set config=$2,secret=$3,updated_at=now() where user_id=$1',
      [u.id, s, key ? sealKey(u.id, s.provider, key) : null]
    )
    return answer({ ok: true, ...s, connected: true, hasKey: !!key })
  },
  'DELETE /api/coach/settings': async (ctx) => {
    const u = guard(ctx),
      r = await ensure(ctx.db, u.id)
    await cancel(ctx.db, u.id, r, true)
    return answer({ ok: true })
  },
  'GET /api/coach/account': async (ctx) => {
    const u = guard(ctx),
      r = await get(ctx.db, u.id)
    return answer({
      mode: 'profile',
      provider: r?.config?.provider || null,
      providerLabel: HTTP_PROVIDERS[r?.config?.provider]?.label || null,
      account: null,
      connected: connected(r),
      reason: connected(r) ? null : 'no-credential',
    })
  },
  'GET /api/coach/disclosure': async (ctx) => {
    const u = guard(ctx),
      r = await get(ctx.db, u.id)
    return answer({
      provider: r?.config?.provider || null,
      providerLabel: HTTP_PROVIDERS[r?.config?.provider]?.label || null,
      host: r?.config?.baseUrl ? new URL(r.config.baseUrl).host : null,
      categories: payloadLib.DATA_CATEGORIES,
      version: 1,
      payer: 'you',
      cloud: true,
    })
  },
  'GET /api/coach/status': async (ctx) => {
    const u = guard(ctx),
      r = await get(ctx.db, u.id),
      state = r?.state || {}
    if (state.pending?.expiresAt < Date.now()) {
      state.pending = null
      await statePut(ctx.db, u.id, state)
    }
    const current = state.current
    return answer({
      job: current
        ? {
            id: current.id,
            kind: current.kind,
            state: current.state,
            startedAt: current.startedAt,
          }
        : null,
      pending: state.pending || null,
      cap: capOf(state),
      last: state.last || null,
      lastError: state.lastError || null,
      maxMessageLen: 4000,
    })
  },
  'POST /api/coach/plan': async (ctx) => {
    const u = guard(ctx)
    return answer(await enqueueCoach(ctx.db, u.id, 'create', ctx.body), 202)
  },
  'POST /api/coach/review': async (ctx) => {
    const u = guard(ctx)
    return answer(await enqueueCoach(ctx.db, u.id, 'review', ctx.body), 202)
  },
  'POST /api/coach/debrief': async (ctx) => {
    const u = guard(ctx)
    return answer(await enqueueCoach(ctx.db, u.id, 'debrief', ctx.body), 202)
  },
  'POST /api/coach/pending/resolve': async (ctx) => {
    const u = guard(ctx),
      r = await get(ctx.db, u.id)
    if (r?.state.pending && ctx.body.id !== r.state.pending.id)
      fail(409, 'Proposal changed', 'stale')
    if (r?.state.pending) {
      const state = r.state
      state.history = [
        ...(state.history || []),
        {
          id: state.pending.id,
          kind: state.pending.kind,
          outcome: ctx.body.dismissed ? 'dismissed' : 'applied',
          at: Date.now(),
        },
      ].slice(-50)
      state.pending = null
      await statePut(ctx.db, u.id, state)
    }
    return answer({ ok: true })
  },
  'POST /api/coach/forget': async (ctx) => {
    const u = guard(ctx),
      r = await get(ctx.db, u.id)
    if (r) await cancel(ctx.db, u.id, r)
    return answer({ ok: true })
  },
  'GET /api/coach/cohort': async (ctx) => {
    guard(ctx)
    return answer({ ok: false, enabled: false })
  },
  'POST /api/coach/cohort/share': async (ctx) => {
    guard(ctx)
    return answer({ ok: true, sharing: false })
  },
}

// A leased task never holds a transaction open during the provider call. An expired running
// task fails visibly rather than blindly resending a potentially charged request.
export async function runCoachWork(
  database,
  { fetch = providerFetch, pipeline = runPipeline } = {}
) {
  if (!enabled()) return { processed: 0 }
  const candidates = await database.transaction((db) =>
    rows(
      db,
      "select id,payload from ironlog.jobs where kind='coach' and done_at is null and due_at<=now() and (lease_until is null or lease_until<now()) order by due_at limit 4"
    )
  )
  for (const candidate of candidates) {
    const claim = await database.transaction(async (db) => {
      const uid = candidate.payload.userId,
        u = await account(db, uid)
      const r = await get(db, uid),
        job = await one(
          db,
          'select * from ironlog.jobs where id=$1 and done_at is null and (lease_until is null or lease_until<now()) for update skip locked',
          [candidate.id]
        )
      if (!job) return null
      const current = r?.state.current,
        S = u && !u.disabled ? await readProfile(db, uid) : null
      if (
        !S ||
        !current ||
        current.id !== job.id ||
        !connected(r) ||
        !S.coach?.consent?.agreedAt ||
        S.coach.consent.version !== CONSENT_VERSION ||
        current.state === 'running'
      ) {
        if (r && current?.id === job.id) {
          if (current.kind === 'review') r.state.reviewedAt = Date.now()
          r.state.current = null
          r.state.last = {
            id: job.id,
            kind: current.kind,
            outcome: 'failed',
            errorClass: 'timeout',
            at: Date.now(),
          }
          r.state.lastError = { errorClass: 'timeout' }
          await statePut(db, uid, r.state)
        }
        await db.query('update ironlog.jobs set done_at=now() where id=$1', [
          job.id,
        ])
        return null
      }
      current.state = 'running'
      await statePut(db, uid, r.state)
      await db.query(
        "update ironlog.jobs set lease_until=now()+interval '240 seconds',attempts=attempts+1 where id=$1",
        [job.id]
      )
      return {
        uid,
        job: { ...current },
        version: r.version,
        config: r.config,
        secret: r.secret,
        S,
        previous: current.input.refine ? r.state.pending : null,
      }
    })
    if (!claim) continue
    let attempt, payload
    try {
      const { uid, job, config, S } = claim,
        opts = job.input
      payload = payloadLib.build(S, {
        ...opts,
        kind: job.kind,
        previous: claim.previous?.bundle || null,
        handle: crypto
          .createHmac('sha256', encryptionKey())
          .update('handle:' + uid)
          .digest('hex')
          .slice(0, 16),
      })
      if (JSON.stringify(payload).length > payloadLib.MAX_PAYLOAD_CHARS)
        throw new Error('payload too large')
      const key = claim.secret
        ? openKey(uid, config.provider, claim.secret)
        : ''
      attempt = await pipeline({
        adapter: ADAPTERS[config.provider],
        cfg: cfgOf(config),
        kind: job.kind,
        payload,
        model: config.model,
        timeoutMs: 100000,
        invokeOpts: {
          env: envOf(config, key),
          fetch,
          signal: AbortSignal.timeout(200000),
          maxTokens: 16000,
        },
      })
    } catch {
      attempt = { ok: false, errorClass: 'internal' }
    }
    await database.transaction(async (db) => {
      const u = await account(db, claim.uid),
        r = await get(db, claim.uid)
      if (
        !u ||
        u.disabled ||
        !r ||
        r.version !== claim.version ||
        r.state.current?.id !== claim.job.id
      )
        return
      const S = await readProfile(db, claim.uid)
      if (
        !S?.coach?.consent?.agreedAt ||
        S.coach.consent.version !== CONSENT_VERSION
      )
        attempt = { ok: false, errorClass: 'forgotten' }
      const state = r.state,
        at = Date.now(),
        kind = claim.job.kind
      state.current = null
      state.last = {
        id: claim.job.id,
        kind,
        outcome: !attempt.ok
          ? 'failed'
          : attempt.nochange
            ? 'nochange'
            : 'ready',
        errorClass: attempt.ok ? null : attempt.errorClass,
        at,
        ...(attempt.reading ? { reading: attempt.reading } : {}),
      }
      state.lastError = attempt.ok ? null : { errorClass: attempt.errorClass }
      if (attempt.ok)
        state.pending = attempt.nochange
          ? null
          : {
              id: claim.job.id,
              kind,
              createdAt: at,
              expiresAt: at + 14 * 86400000,
              planHash: hashPlan(payloadLib.canonicalPlan(claim.S)),
              iteration: claim.previous
                ? (claim.previous.iteration || 1) + 1
                : 1,
              ...(kind === 'debrief'
                ? {
                    workout: payloadLib.workoutMeta(
                      claim.S,
                      claim.job.input.workoutId
                    ),
                  }
                : {}),
              ...attempt.result,
            }
      if (kind === 'review') state.reviewedAt = at
      state.history = [...(state.history || []), state.last].slice(-50)
      await statePut(db, claim.uid, state)
      const suggestions =
        attempt.ok && !attempt.nochange
          ? state.pending?.changes?.length || 0
          : 0
      if (suggestions)
        await enqueuePush(db, 'coach-proposal:' + claim.job.id, {
          userId: claim.uid,
          push: {
            title:
              S.lang === 'he'
                ? 'המאמן סיים לבדוק את האימונים שלך'
                : 'Your Coach has been reading',
            body:
              S.lang === 'he'
                ? suggestions === 1
                  ? 'הצעה אחת לעדכון התוכנית שלך'
                  : `${suggestions} הצעות לעדכון התוכנית שלך`
                : suggestions === 1
                  ? '1 suggestion after this week'
                  : `${suggestions} suggestions after this week`,
            tag: 'coach-proposal',
            url: '#/coach',
          },
        })
      await db.query(
        'update ironlog.jobs set done_at=now(),last_error=$2 where id=$1',
        [claim.job.id, attempt.ok ? null : 'coach-failed']
      )
    })
    return { processed: 1 }
  }
  return { processed: 0 }
}

// Automatic reviews opt in through the existing Coach cadence settings. Selection reads
// only the cadence/config markers; training history is loaded for due, connected accounts.
export async function scanCoachCadence(database) {
  if (!enabled()) return
  const users = await database.transaction(async (db) => {
    const scan = await one(
      db,
      "select pg_try_advisory_xact_lock(hashtextextended('ironlog-coach-cadence',0)) as acquired"
    )
    if (!scan.acquired) return
    const last = await one(
      db,
      "select value from ironlog.settings where key='coach-cadence-scan'"
    )
    if (Number(last?.value) > Date.now() - 60000) return
    await db.query(
      "insert into ironlog.settings(key,value) values('coach-cadence-scan',$1) on conflict(key) do update set value=excluded.value",
      [Date.now()]
    )
    return rows(
      db,
      `select c.user_id from ironlog.coach c join ironlog.accounts a on a.id=c.user_id join ironlog.profiles p on p.user_id=c.user_id
      where c.config ? 'provider' and coalesce((a.data->>'disabled')::boolean,false)=false
      and p.state->'coach'->'cadence' is not null and p.state->'coach'->>'cadence'<>'off' order by coalesce((c.state->>'cadenceScannedAt')::bigint,0),c.user_id limit 20`
    )
  })
  for (const { user_id: uid } of users || []) {
    await database.transaction(async (db) => {
      const u = await account(db, uid)
      if (!u || u.disabled) return
      const r = await get(db, uid),
        S = await readProfile(db, uid)
      if (!r) return
      if (r.state.pending?.expiresAt < Date.now()) r.state.pending = null
      r.state.cadenceScannedAt = Date.now()
      await statePut(db, uid, r.state)
      if (
        r.state.providerConsent !== consentFor(r.config) ||
        !connected(r) ||
        r.state.current ||
        r.state.pending ||
        capOf(r.state).used >= DAILY_CAP ||
        !S?.coach?.consent?.agreedAt ||
        S.coach.consent.version !== CONSENT_VERSION
      )
        return
      const tz = S.reminder?.tz || 'UTC',
        now = clockFor(tz)
      if (isDue(S.coach, S, now, r.state.reviewedAt || 0, tz))
        await enqueueCoach(db, uid, 'review', { lang: S.lang })
    })
  }
}
