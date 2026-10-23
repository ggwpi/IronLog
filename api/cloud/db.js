import pg from 'pg'
import { nameKey } from '../password.js'

// A private SQL interface, not a client-side Data API. Supabase Auth is deliberately
// not involved: all identities and owner proofs are openGym's own.
export class Database {
  constructor(url = process.env.IRONLOG_DATABASE_URL) {
    if (!url) throw new Error('IRONLOG_DATABASE_URL is required')
    const parsed = new URL(url)
    if (
      !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) &&
      parsed.searchParams.get('sslmode') !== 'verify-full'
    )
      throw new Error('Remote database connections require sslmode=verify-full')
    this.pool = new pg.Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
      application_name: 'ironlog-cloud',
    })
  }
  async transaction(fn) {
    const c = await this.pool.connect()
    try {
      await c.query('begin')
      await c.query('set local statement_timeout = 15000')
      await c.query('set local lock_timeout = 5000')
      await c.query('set local role ironlog_backend')
      const result = await fn(c)
      await c.query('commit')
      return result
    } catch (e) {
      await c.query('rollback')
      throw e
    } finally {
      c.release()
    }
  }
  async close() {
    await this.pool.end()
  }
}
export const one = async (db, sql, args = []) => (await db.query(sql, args)).rows[0]
export const rows = async (db, sql, args = []) => (await db.query(sql, args)).rows
export const account = async (db, id, lock = true) =>
  (await one(db, `select data from ironlog.accounts where id=$1 ${lock ? 'for update' : ''}`, [id]))
    ?.data
export async function putAccount(db, u) {
  const keys = [...new Set([nameKey(u.name), u.email].filter(Boolean))].sort()
  await db.query(
    `insert into ironlog.accounts(id,data) values($1,$2) on conflict(id) do update set data=excluded.data`,
    [u.id, { ...u, loginKey: nameKey(u.name) }],
  )
  await db.query('delete from ironlog.identities where user_id=$1', [u.id])
  for (const key of keys)
    await db.query('insert into ironlog.identities(key,user_id) values($1,$2)', [key, u.id])
}
export const credentials = async (db, uid) =>
  (await rows(db, 'select data from ironlog.credentials where user_id=$1 order by id', [uid])).map(
    (r) => r.data,
  )
export async function putCredential(db, c) {
  const r = await db.query(
    `insert into ironlog.credentials(id,user_id,data) values($1,$2,$3)
    on conflict(id) do update set data=excluded.data where ironlog.credentials.user_id=excluded.user_id`,
    [c.id, c.userId, c],
  )
  if (!r.rowCount)
    throw Object.assign(new Error('credential already registered'), { code: '23505' })
}
export const audit = (db, ev, user, extra = {}) =>
  db.query('insert into ironlog.audit(event,user_id,data) values($1,$2,$3)', [
    ev,
    user?.id || null,
    { ok: true, ...(user ? { user: { id: user.id, name: user.name } } : {}), ...extra },
  ])
