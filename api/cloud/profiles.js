import crypto from 'node:crypto'
import { stampPut } from '../sync-stamps.js'
import { excusedOn, nudgeFor } from '../nudge.js'
import { referencedHashes } from '../media.js'
import { one } from './db.js'
import { requireUser } from './session.js'
import { answer, fail, records } from './http.js'
export const MAX_PROFILE_BYTES = 5 * 1024 * 1024
export function forClient(s) {
  if (!s) return null
  const { _unstamped, _prior, ...out } = s
  return out
}
export async function readProfile(db, id, lock = false) {
  return (
    (
      await one(
        db,
        `select state from ironlog.profiles where user_id=$1 ${lock ? 'for update' : ''}`,
        [id],
      )
    )?.state || null
  )
}
export function prepareState(cur, body) {
  const input = body.state
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    !Object.keys(input).some((k) => !['_rev', '_ts'].includes(k))
  )
    fail(400, 'state required')
  if (['routines', 'workouts'].some((k) => input[k] != null && !Array.isArray(input[k])))
    fail(400, 'invalid state')
  const rev = cur?._rev || 0
  if (
    (body.baseRev != null && body.baseRev !== rev) ||
    (body.baseRev != null &&
      typeof body.baseWid === 'string' &&
      cur?._wid &&
      body.baseWid !== cur._wid)
  )
    fail(409, 'conflict', undefined, { rev, state: forClient(cur) })
  const next = structuredClone(input)
  delete next.active
  for (const k of ['routines', 'workouts']) if (Array.isArray(next[k])) next[k] = records(next[k])
  if ((Number(cur?.resetAt) || 0) > (Number(next.resetAt) || 0)) {
    next.resetAt = cur.resetAt
    if (cur.resetIds && typeof cur.resetIds === 'object') next.resetIds = cur.resetIds
    else delete next.resetIds
  }
  const report = {}
  try {
    stampPut(cur, next, {
      overRead: body.baseRev != null && body.baseRev === rev,
      stamped: body.stamped === true,
      report,
    })
  } catch (e) {
    if (e instanceof RangeError) fail(400, 'invalid state')
    throw e
  }
  next._rev = rev + (report.changed ? 2 : 1)
  next._wids = [...(Array.isArray(cur?._wids) ? cur._wids : []), ...(cur?._wid ? [cur._wid] : [])]
    .filter((x) => typeof x === 'string')
    .slice(-32)
  next._wid = crypto.randomBytes(8).toString('hex')
  if (Buffer.byteLength(JSON.stringify(next)) > MAX_PROFILE_BYTES)
    fail(413, 'profile is too large', 'state-too-large')
  return { next, reply: { ok: true, ts: next._ts || null, rev: rev + 1, wid: next._wid } }
}
export async function writeProfile(db, u, body) {
  const cur = await readProfile(db, u.id, true),
    { next, reply } = prepareState(cur, body)
  await db.query(
    `insert into ironlog.profiles(user_id,state,revision,write_id) values($1,$2,$3,$4)
    on conflict(user_id) do update set state=excluded.state,revision=excluded.revision,write_id=excluded.write_id,updated_at=now()`,
    [u.id, next, next._rev, next._wid],
  )
  const hashes = [...referencedHashes(next)]
  await db.query(
    `update ironlog.media set unreferenced_since=case when hash=any($2::text[]) then null else coalesce(unreferenced_since,now()) end where user_id=$1`,
    [u.id, hashes],
  )
  u.lastSync = new Date().toISOString()
  await db.query(
    "update ironlog.accounts set data=jsonb_set(data,'{lastSync}',to_jsonb($2::text)) where id=$1",
    [u.id, u.lastSync],
  )
  return reply
}
export const profileRoutes = {
  'GET /api/data': async (ctx) => {
    const u = requireUser(ctx),
      state = await readProfile(ctx.db, u.id)
    return answer({ state: forClient(state), rev: state?._rev || 0 })
  },
  'GET /api/data/rev': async (ctx) => {
    const u = requireUser(ctx),
      r = await one(ctx.db, 'select revision,write_id from ironlog.profiles where user_id=$1', [
        u.id,
      ])
    return answer({ rev: r?.revision || 0, ...(r?.write_id ? { wid: r.write_id } : {}) })
  },
  'PUT /api/data': async (ctx) => answer(await writeProfile(ctx.db, requireUser(ctx), ctx.body)),
  'GET /api/nudge-check': async (ctx) => {
    const u = requireUser(ctx),
      date = ctx.url.searchParams.get('date') || ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z')))
      fail(400, 'date must be YYYY-MM-DD', 'date-invalid')
    const s = (await readProfile(ctx.db, u.id)) || {},
      done = records(s.workouts).some((w) => w.d === date) || excusedOn(s, date)
    return answer({ date, done, nudge: !done && !!nudgeFor(s, date), rev: s._rev || 0 })
  },
}
