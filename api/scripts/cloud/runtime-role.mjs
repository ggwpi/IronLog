import pg from 'pg'
import { connectionOptions } from '../../cloud/db.js'
import crypto from 'node:crypto'
import fs from 'node:fs'
const output = process.argv[2]
if (!output) throw new Error('Provide a private output file for the runtime database URL')
const admin = process.env.SUPABASE_ADMIN_DATABASE_URL || process.env.IRONLOG_DATABASE_URL
const url = new URL(admin),
  password = crypto.randomBytes(36).toString('base64url')
const db = new pg.Client(connectionOptions(admin))
await db.connect()
try {
  await db.query('begin')
  const exists = await db.query("select 1 from pg_roles where rolname='ironlog_api'")
  if (!exists.rowCount)
    await db.query(
      'create role ironlog_api login noinherit nosuperuser nocreatedb nocreaterole nobypassrls',
    )
  // Parameters cannot stand in for a role password; an unpredictable base64url value
  // has no SQL metacharacters, and the server still quotes it with format(%L).
  await db.query(
    `do $body$ begin execute format('alter role ironlog_api password %L', '${password}'); end $body$`,
  )
  await db.query('grant ironlog_backend to ironlog_api')
  const oldUser = decodeURIComponent(url.username),
    ref = oldUser.includes('.') ? '.' + oldUser.split('.').slice(1).join('.') : ''
  url.username = 'ironlog_api' + ref
  url.password = password
  url.searchParams.set('sslmode', 'verify-full')
  fs.writeFileSync(output, url.href + '\n', { mode: 0o600, flag: 'wx' })
  await db.query('commit')
  console.log('Restricted runtime connection saved to the requested private file.')
} catch (e) {
  await db.query('rollback')
  throw e
} finally {
  await db.end()
}
