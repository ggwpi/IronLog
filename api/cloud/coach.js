import crypto from 'node:crypto'
import { isDue } from '../coach/core/due.js'
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
  safeProviderDetail,
} from './coach-transport.js'
import { HTTP_PROVIDERS } from '../coach/core/providers.js'
import * as payloadLib from '../coach/core/payload.js'
import { hashPlan } from '../coach/core/plan-hash.js'
import { waitingProposal } from '../coach/core/pending.js'
import { runPipeline } from '../coach/core/pipeline.js'
import {
  coachRecord,
  connection,
  connectionList,
  connectionKey,
  saveConnection,
  selectConnection,
  deleteConnection,
} from './coach-connections.js'
// Upstream allows five minutes per provider attempt. The serverless invocation has a
// five-minute ceiling including DB work, so reserve time to persist its final outcome.
export const COACH_ATTEMPT_TIMEOUT_MS = 300000
export const COACH_RUN_BUDGET_MS = 280000
export const AUTO_DAILY_CAP = 10
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
const get = coachRecord
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
const consentFor = (config) =>
  (config.connectionId ? config.connectionId + '|' : '') +
  config.provider +
  '|' +
  config.baseUrl
const capOf = (s) => ({
  used: s.daily?.date === today() ? s.daily.count : 0,
  limit: 0, // Manual requests use the user’s own key; there is no daily app quota.
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
    connectionId: r?.config?.connectionId || null,
    model: r?.config?.model || null,
    community: false,
  }
}
const publicSettings = (r) => ({
  ...r?.config,
  connected: connected(r),
  hasKey: !!r?.secret,
})
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
    [
      '/api/coach/settings',
      '/api/coach/models',
      '/api/coach/connections',
      '/api/coach/selection',
    ].includes(ctx.url.pathname) &&
    ctx.body.accountId !== u.id
  )
    fail(409, 'Your account changed. Reload IronLog.', 'account-changed')
  if (ctx.body.accountId !== undefined && ctx.body.accountId !== u.id)
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
    autoDaily: r.state.autoDaily,
    history: [],
    reviewedAt: r.state.reviewedAt || 0,
  }
  await db.query(
    'update ironlog.coach set state=$2,version=version+1,config=$3,secret=$4,updated_at=now() where user_id=$1',
    [uid, state, removeKey ? {} : r.config, removeKey ? null : r.secret]
  )
}
export async function enqueueCoach(
  db,
  uid,
  kind,
  body = {},
  { automatic = false } = {}
) {
  const r = await ensure(db, uid),
    S = await readProfile(db, uid)
  const selected = await connection(
    db,
    uid,
    body.connectionId || r.config.connectionId
  )
  if (!selected) fail(503, 'Connect your own AI provider first', 'off')
  if (
    body.model !== undefined &&
    (typeof body.model !== 'string' ||
      !body.model.trim() ||
      body.model.length > 150)
  )
    fail(400, 'invalid model')
  const requestConfig = {
    ...selected.config,
    connectionId: selected.id,
    name: selected.name,
    model: body.model || selected.config.model,
  }
  if (!connected(r)) fail(503, 'Connect your own AI provider first', 'off')
  if (
    !S?.coach?.consent?.agreedAt ||
    S.coach.consent.version !== CONSENT_VERSION
  )
    fail(403, 'Coach consent required', 'consent')
  if (r.state.current) fail(409, 'Coach is already running', 'busy')
  const automaticUsed =
    r.state.autoDaily?.date === today() ? r.state.autoDaily.count : 0
  if (automatic && automaticUsed >= AUTO_DAILY_CAP)
    fail(429, 'Automatic Coach limit reached', 'cap', { retryAfter: 3600 })
  if (!automatic) await throttle(db, 'coach-request:' + uid, 6, 60)
  for (const key of ['note', 'refine', 'text'])
    if (
      body[key] != null &&
      (typeof body[key] !== 'string' || body[key].length > 4000)
    )
      fail(400, 'message too long')
  if (kind === 'ask' && (typeof body.text !== 'string' || !body.text.trim()))
    fail(400, 'question required')
  if (kind === 'debrief' && !payloadLib.findWorkout(S, body.workoutId))
    fail(400, 'workout not found')
  const job = {
    id: crypto.randomUUID(),
    kind,
    state: 'queued',
    ...(automatic ? { trigger: 'scheduled' } : {}),
    startedAt: Date.now(),
  }
  const input = {
    intake: kind === 'create' ? body.intake || null : null,
    note: (kind === 'ask' ? body.text.trim() : body.note) || null,
    today: kind === 'ask'
      ? payloadLib.build(S, { handle: 'queued', kind: 'ask', today: body.today }).today || null
      : null,
    refine: body.refine || null,
    lang: payloadLib.langTag(body.lang),
    workoutId:
      typeof body.workoutId === 'string' ? body.workoutId.slice(0, 40) : null,
  }
  // Bound intake and free text before persisting a queued request.
  const inputLimit = kind === 'ask' ? payloadLib.MAX_PAYLOAD_CHARS : 12000
  if (JSON.stringify(input).length > inputLimit) fail(400, 'request too large')
  const state = {
    ...r.state,
    providerConsent: consentFor(requestConfig),
    current: {
      ...job,
      input,
      version: r.version,
      connectionId: selected.id,
      connectionVersion: selected.revision,
      model: requestConfig.model,
      connection: {
        id: selected.id,
        name: selected.name,
        provider: selected.config.provider,
        model: requestConfig.model,
      },
    },
    lastError: null,
    daily: { date: today(), count: capOf(r.state).used + 1 },
    ...(automatic
      ? { autoDaily: { date: today(), count: automaticUsed + 1 } }
      : {}),
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
    await throttle(ctx.db, 'coach-models:' + u.id, 20, 60)
    const s = checkedSettings(ctx.body),
      r = await get(ctx.db, u.id)
    const explicitId = ctx.body.connectionId || ctx.body.id
    const c = await connection(
      ctx.db,
      u.id,
      explicitId || r?.config?.connectionId
    )
    if (explicitId && !c) fail(404, 'AI connection not found')
    const key = connectionKey(ctx.body, c, s, u.id)
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
    const r = await ensure(ctx.db, u.id)
    const saved = await saveConnection(
      ctx.db,
      u.id,
      r,
      {
        ...ctx.body,
        id: r.config.connectionId,
        name: r.config.name || HTTP_PROVIDERS[s.provider].label,
      },
      s
    )
    return answer({ ok: true, ...saved })
  },
  'DELETE /api/coach/settings': async (ctx) => {
    const u = guard(ctx),
      r = await ensure(ctx.db, u.id)
    await cancel(ctx.db, u.id, r, true)
    await ctx.db.query(
      'delete from ironlog.coach_connections where user_id=$1',
      [u.id]
    )
    return answer({ ok: true })
  },
  'GET /api/coach/connections': async (ctx) => {
    const u = guard(ctx),
      r = await get(ctx.db, u.id)
    return answer(await connectionList(ctx.db, u.id, r))
  },
  'POST /api/coach/connections': async (ctx) => {
    const u = guard(ctx)
    await throttle(ctx.db, 'coach-settings:' + u.id, 10, 60)
    const r = await ensure(ctx.db, u.id)
    return answer({
      ok: true,
      ...(await saveConnection(
        ctx.db,
        u.id,
        r,
        ctx.body,
        checkedSettings(ctx.body)
      )),
    })
  },
  'DELETE /api/coach/connections': async (ctx) => {
    const u = guard(ctx),
      r = await ensure(ctx.db, u.id)
    return answer(await deleteConnection(ctx.db, u.id, r, ctx.body.id))
  },
  'POST /api/coach/selection': async (ctx) => {
    const u = guard(ctx),
      r = await ensure(ctx.db, u.id)
    return answer({
      ok: true,
      ...(await selectConnection(
        ctx.db,
        u.id,
        r,
        ctx.body.connectionId,
        ctx.body.model
      )),
    })
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
    const expectedAccount = ctx.url.searchParams.get('accountId')
    if (expectedAccount && expectedAccount !== u.id)
      fail(409, 'Your account changed. Reload IronLog.', 'account-changed')
    const selectedId = ctx.url.searchParams.get('connectionId')
    if (selectedId) {
      const c = await connection(ctx.db, u.id, selectedId)
      if (!c) fail(404, 'AI connection not found')
      r.config = { ...c.config, connectionId: c.id, name: c.name }
    }
    return answer({
      provider: r?.config?.provider || null,
      providerLabel: HTTP_PROVIDERS[r?.config?.provider]?.label || null,
      host: r?.config?.baseUrl ? new URL(r.config.baseUrl).host : null,
      connectionId: r?.config?.connectionId || null,
      connectionName: r?.config?.name || null,
      model: r?.config?.model || null,
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
            connection: current.connection,
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
  'POST /api/coach/ask': async (ctx) => {
    const u = guard(ctx)
    return answer(await enqueueCoach(ctx.db, u.id, 'ask', ctx.body), 202)
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
      state.pending = state.pending.kind === 'ask'
        ? waitingProposal(state.pending.prev)
        : null
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
      const current = r?.state.current
      const selected = current
        ? await connection(
            db,
            uid,
            current.connectionId || r.config.connectionId
          )
        : null
      const S = u && !u.disabled ? await readProfile(db, uid) : null
      if (
        !S ||
        !current ||
        current.id !== job.id ||
        !selected ||
        (current.connectionVersion != null &&
          String(current.connectionVersion) !== String(selected.revision)) ||
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
        "update ironlog.jobs set lease_until=now()+interval '330 seconds',attempts=attempts+1 where id=$1",
        [job.id]
      )
      return {
        uid,
        job: { ...current },
        version: r.version,
        config: {
          ...selected.config,
          connectionId: selected.id,
          name: selected.name,
          model: current.model || selected.config.model,
        },
        secret: selected.secret,
        connectionVersion: selected.revision,
        S,
        previous: current.input.refine ? r.state.pending : null,
      }
    })
    if (!claim) continue
    let attempt,
      payload,
      providerKey = '',
      providerModel = null
    const providerAttempts = []
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
      const key = (providerKey = claim.secret
        ? openKey(uid, config.provider, claim.secret)
        : '')
      attempt = await pipeline({
        adapter: {
          ...ADAPTERS[config.provider],
          invoke: async (opts) => {
            const result = await ADAPTERS[config.provider].invoke(opts)
            if (result.code === 0 && result.model) providerModel = result.model
            return result
          },
        },
        cfg: cfgOf(config),
        kind: job.kind,
        payload,
        model: config.model,
        timeoutMs: COACH_ATTEMPT_TIMEOUT_MS,
        invokeOpts: {
          env: envOf(config, key),
          fetch: async (url, init) => {
            const started = Date.now(), number = providerAttempts.length + 1
            const tags = { jobId: job.id, provider: config.provider, task: job.kind, attempt: number }
            console.info('Coach provider request started', tags)
            try {
              const response = await fetch(url, init)
              const diagnostic = { attempt: number, elapsedMs: Date.now() - started, status: response.status }
              providerAttempts.push(diagnostic)
              console.info('Coach provider request finished', { ...tags, ...diagnostic })
              return response
            } catch (e) {
              const diagnostic = { attempt: number, elapsedMs: Date.now() - started, outcome: e?.name === 'AbortError' ? 'timeout' : 'transport-error' }
              providerAttempts.push(diagnostic)
              // Never log the URL, headers, exception message, prompt or response body.
              console.info('Coach provider request finished', { ...tags, ...diagnostic })
              throw e
            }
          },
          signal: AbortSignal.timeout(COACH_RUN_BUDGET_MS),
          maxTokens: 16000,
        },
      })
    } catch {
      attempt = { ok: false, errorClass: 'internal' }
    }
    // Only the provider’s bounded error message is shown to its owner. Never store a key,
    // a raw response body, generated output, or internal exception details as diagnostics.
    const detail = ['provider', 'auth'].includes(attempt.errorClass)
      ? safeProviderDetail(attempt.detail, providerKey)
      : ''
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
      const selected = await connection(
        db,
        claim.uid,
        claim.config.connectionId
      )
      if (
        !selected ||
        String(selected.revision) !== String(claim.connectionVersion)
      )
        return
      // Keep an upstream-selected replacement only after it answered successfully, and
      // never overwrite a model the user selected while the job was running.
      if (attempt.ok && providerModel) {
        claim.job.connection = { ...claim.job.connection, model: providerModel }
        if (selected.config.model === claim.config.model) {
          selected.config = { ...selected.config, model: providerModel }
          await db.query('update ironlog.coach_connections set config=$3,updated_at=now() where user_id=$1 and id=$2', [claim.uid, selected.id, selected.config])
          if (r.config.connectionId === selected.id && r.config.model === claim.config.model) {
            r.config = { ...r.config, model: providerModel }
            await db.query('update ironlog.coach set config=$2 where user_id=$1', [claim.uid, r.config])
          }
        }
      }
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
        connection: claim.job.connection,
        outcome: !attempt.ok
          ? 'failed'
          : attempt.nochange
            ? 'nochange'
            : 'ready',
        errorClass: attempt.ok ? null : attempt.errorClass,
        providerAttempts: providerAttempts.slice(-12),
        at,
        ...(attempt.reading ? { reading: attempt.reading } : {}),
      }
      state.lastError = attempt.ok
        ? null
        : { errorClass: attempt.errorClass, ...(detail ? { detail } : {}) }
      if (attempt.ok)
        state.pending = attempt.nochange
          ? null
          : {
              id: claim.job.id,
              kind,
              connection: claim.job.connection,
              ...(claim.job.trigger === 'scheduled' ? { trigger: 'scheduled' } : {}),
              createdAt: at,
              expiresAt: at + 14 * 86400000,
              planHash: hashPlan(payloadLib.canonicalPlan(claim.S)),
              iteration: claim.previous
                ? (claim.previous.iteration || 1) + 1
                : 1,
              ...(kind === 'ask' ? { prev: waitingProposal(state.pending) } : {}),
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
      if (kind === 'review' && (attempt.ok || attempt.errorClass === 'unusable'))
        state.reviewedAt = at
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
        (r.state.autoDaily?.date === today() &&
          r.state.autoDaily.count >= AUTO_DAILY_CAP) ||
        !S?.coach?.consent?.agreedAt ||
        S.coach.consent.version !== CONSENT_VERSION
      )
        return
      const tz = S.reminder?.tz || 'UTC',
        now = clockFor(tz)
      if (isDue(S.coach, S, now, r.state.reviewedAt || 0, tz))
        await enqueueCoach(
          db,
          uid,
          'review',
          { lang: S.lang },
          { automatic: true }
        )
    })
  }
}
