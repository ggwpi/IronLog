// Generate an owner-only signup invitation into a private local file, never stdout.
import pg from 'pg'
import crypto from 'node:crypto'
import fs from 'node:fs'
const filename = process.argv[2]
if (!filename) throw new Error('Provide a private output filename for the owner invitation')
const db = new pg.Client({
  connectionString: process.env.SUPABASE_ADMIN_DATABASE_URL || process.env.IRONLOG_DATABASE_URL,
})
await db.connect()
try {
  await db.query('begin')
  await db.query("select pg_advisory_xact_lock(hashtextextended('ironlog-registration',0))")
  const check = await db.query("select 1 from ironlog.accounts where data->>'owner'='true'")
  if (check.rowCount) throw new Error('An owner already exists')
  await db.query("delete from ironlog.invites where data->>'bootstrap'='true'")
  const code = crypto.randomBytes(16).toString('hex').toUpperCase()
  await db.query('insert into ironlog.invites(code,data) values($1,$2)', [
    code,
    { code, bootstrap: true, note: 'Initial owner', created: new Date().toISOString() },
  ])
  fs.writeFileSync(filename, code + '\n', { mode: 0o600, flag: 'wx' })
  await db.query('commit')
  console.log('Owner invitation saved to the requested private file.')
} catch (e) {
  await db.query('rollback')
  throw e
} finally {
  await db.end()
}
