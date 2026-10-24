// One private record per named connection. Public metadata never includes ciphertext or keys.
import crypto from 'node:crypto'
import { one, rows } from './db.js'
import { fail } from './http.js'
import { HTTP_PROVIDERS } from '../coach/core/providers.js'
import { sealKey, openKey } from './coach-transport.js'
export const connection = (db, uid, id) =>
  typeof id === 'string'
    ? one(
        db,
        'select * from ironlog.coach_connections where user_id=$1 and id=$2 for update',
        [uid, id]
      )
    : null
export const publicConnection = (c) => ({
  id: c.id,
  name: c.name,
  ...c.config,
  hasKey: !!c.secret,
  connected: !!(c.secret || c.config.provider === 'compatible'),
  revision: c.revision,
})
export async function coachRecord(db, uid) {
  const r = await one(
    db,
    'select * from ironlog.coach where user_id=$1 for update',
    [uid]
  )
  // Move an existing connection lazily, under the same account lock as all requests. No key
  // is decrypted, changed or lost during the upgrade, including from an older open client.
  if (r?.config?.provider && !r.config.connectionId) {
    const id = crypto.randomUUID(),
      config = {
        provider: r.config.provider,
        baseUrl: r.config.baseUrl,
        model: r.config.model,
      }
    const name = HTTP_PROVIDERS[config.provider]?.label || config.provider
    await db.query(
      'insert into ironlog.coach_connections(id,user_id,name,config,secret) values($1,$2,$3,$4,$5)',
      [id, uid, name, config, r.secret]
    )
    if (r.state.providerConsent === config.provider + '|' + config.baseUrl)
      r.state.providerConsent =
        id + '|' + config.provider + '|' + config.baseUrl
    r.config = { ...config, connectionId: id, name }
    await db.query(
      'update ironlog.coach set config=$2,state=$3 where user_id=$1',
      [uid, r.config, r.state]
    )
  }
  return r
}
export async function connectionList(db, uid, r) {
  const all = await rows(
    db,
    'select * from ironlog.coach_connections where user_id=$1 order by created_at,id',
    [uid]
  )
  return {
    connections: all.map(publicConnection),
    activeId: r?.config?.connectionId || null,
    model: r?.config?.model || null,
  }
}
export function connectionKey(body, c, settings, uid) {
  const key = body.apiKey
  if (
    key !== undefined &&
    (typeof key !== 'string' || key.length > 4096 || /[\r\n\0]/.test(key))
  )
    fail(400, 'invalid API key')
  if (key?.trim()) return key.trim()
  if (
    c?.secret &&
    c.config.provider === settings.provider &&
    c.config.baseUrl === settings.baseUrl
  )
    return openKey(uid, settings.provider, c.secret)
  if (settings.provider === 'compatible') return ''
  fail(400, 'API key required')
}
export async function selectConnection(db, uid, r, id, model) {
  const c = await connection(db, uid, id)
  if (!c) fail(404, 'AI connection not found')
  if (
    model !== undefined &&
    (typeof model !== 'string' || !model.trim() || model.length > 150)
  )
    fail(400, 'invalid model')
  const chosen = model?.trim() || c.config.model
  c.config = { ...c.config, model: chosen }
  await db.query(
    'update ironlog.coach_connections set config=$3,updated_at=now() where user_id=$1 and id=$2',
    [uid, id, c.config]
  )
  r.config = { ...c.config, connectionId: id, name: c.name }
  r.secret = c.secret
  await db.query(
    'update ironlog.coach set config=$2,secret=$3,updated_at=now() where user_id=$1',
    [uid, r.config, r.secret]
  )
  return { ...publicConnection(c), model: chosen }
}
async function stopConnectionJob(db, uid, r, id) {
  const current = r.state.current
  if (!current || (current.connectionId || r.config.connectionId) !== id) return
  await db.query(
    "update ironlog.jobs set done_at=now(),last_error=null where id=$1 and kind='coach' and payload->>'userId'=$2",
    [current.id, uid]
  )
  r.state.current = null
  r.state.last = {
    id: current.id,
    kind: current.kind,
    outcome: 'failed',
    errorClass: 'connection-changed',
    at: Date.now(),
  }
  r.state.lastError = { errorClass: 'connection-changed' }
  await db.query('update ironlog.coach set state=$2 where user_id=$1', [
    uid,
    r.state,
  ])
}
export async function saveConnection(db, uid, r, body, settings) {
  const id = body.id || crypto.randomUUID()
  if (typeof id !== 'string' || id.length > 80) fail(400, 'invalid connection')
  const existing = body.id ? await connection(db, uid, id) : null
  if (body.id && !existing) fail(404, 'AI connection not found')
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 80)
    fail(400, 'connection name required (1–80 characters)')
  if (!settings.model) fail(400, 'model required')
  if (!existing) {
    const count = await one(
      db,
      'select count(*)::integer as n from ironlog.coach_connections where user_id=$1',
      [uid]
    )
    if (count.n >= 50) fail(400, 'maximum 50 saved connections')
  }
  const key = connectionKey(body, existing, settings, uid)
  const changed =
    !!existing &&
    (!!body.apiKey?.trim() ||
      existing.config.provider !== settings.provider ||
      existing.config.baseUrl !== settings.baseUrl)
  if (changed) await stopConnectionJob(db, uid, r, id)
  const revision = existing ? Number(existing.revision) + (changed ? 1 : 0) : 0
  await db.query(
    `insert into ironlog.coach_connections(id,user_id,name,config,secret,revision) values($1,$2,$3,$4,$5,$6)
    on conflict(id) do update set name=excluded.name,config=excluded.config,secret=excluded.secret,revision=excluded.revision,updated_at=now() where ironlog.coach_connections.user_id=excluded.user_id`,
    [
      id,
      uid,
      name,
      settings,
      key ? sealKey(uid, settings.provider, key) : null,
      revision,
    ]
  )
  // Preserve a separate request's selection. The very first saved connection becomes default.
  if (!r.config.connectionId || r.config.connectionId === id)
    await selectConnection(db, uid, r, id, settings.model)
  return publicConnection(await connection(db, uid, id))
}
export async function deleteConnection(db, uid, r, id) {
  const c = await connection(db, uid, id)
  if (!c) fail(404, 'AI connection not found')
  await stopConnectionJob(db, uid, r, id)
  await db.query(
    'delete from ironlog.coach_connections where user_id=$1 and id=$2',
    [uid, id]
  )
  if (r.config.connectionId === id) {
    const next = await one(
      db,
      'select id from ironlog.coach_connections where user_id=$1 order by created_at,id limit 1',
      [uid]
    )
    if (next) await selectConnection(db, uid, r, next.id)
    else {
      r.config = {}
      r.secret = null
      await db.query(
        "update ironlog.coach set config='{}',secret=null where user_id=$1",
        [uid]
      )
    }
  }
  return { ok: true }
}
