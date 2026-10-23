// Destructive, explicitly authorized legacy IronLog cleanup. The reviewed metadata
// manifest is the boundary: no guessed schema names and no dropping managed schemas.
import pg from 'pg'
import { connectionOptions } from '../../cloud/db.js'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const { sha, ...contents } = manifest
if (crypto.createHash('sha256').update(JSON.stringify(contents)).digest('hex') !== sha)
  throw new Error('Inventory was modified; regenerate and review it')
if (
  !manifest.project ||
  manifest.project !== process.env.IRONLOG_EXPECTED_PROJECT_REF ||
  new URL(process.env.SUPABASE_URL).hostname !== manifest.project + '.supabase.co'
)
  throw new Error('Project identity mismatch')
const quote = (s) => '"' + s.replaceAll('"', '""') + '"'
const db = new pg.Client(connectionOptions(process.env.SUPABASE_ADMIN_DATABASE_URL || process.env.IRONLOG_DATABASE_URL))
await db.connect()
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
})
try {
  const existing = (
    await db.query(`select c.oid::regclass::text as name,c.relkind as kind from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','f','S') order by 1`)
  ).rows
  if (existing.some((t) => !manifest.tables.some((m) => m.name === t.name && m.kind === t.kind)))
    throw new Error('Legacy schema changed since inventory; inspect again')
  // Fail before touching anything if the replacement has already been installed.
  if ((await db.query("select to_regclass('ironlog.accounts') as present")).rows[0].present)
    throw new Error('Replacement schema exists; cleanup must precede migration')
  await db.query('begin')
  for (const job of manifest.cron || [])
    await db.query('select cron.unschedule($1::bigint)', [job.jobid])
  for (const t of manifest.triggers) {
    if (!['public', 'private', 'auth', 'storage'].includes(t.schema))
      throw new Error('Invalid trigger target')
    await db.query(
      `drop trigger if exists ${quote(t.name)} on ${quote(t.schema)}.${quote(t.table_name)} cascade`,
    )
  }
  for (const p of manifest.policies) {
    if (!['public', 'private', 'storage'].includes(p.schemaname))
      throw new Error('Invalid policy target')
    await db.query(
      `drop policy if exists ${quote(p.policyname)} on ${quote(p.schemaname)}.${quote(p.tablename)}`,
    )
  }
  // OIDs are resolved server-side from inventory names; only objects still in the
  // application schema can be dropped. Dependencies are reviewed in the inventory.
  for (const f of manifest.functions) {
    const r = await db.query(
      'select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.oid=to_regprocedure($1)',
      [f.signature],
    )
    if (!r.rowCount) continue
    const x = r.rows[0]
    if (!['public', 'private'].includes(x.nspname)) throw new Error('Invalid function target')
    await db.query(
      `drop function if exists ${quote(x.nspname)}.${quote(x.proname)}(${x.args}) cascade`,
    )
  }
  for (const t of manifest.tables) {
    const r = await db.query(
      'select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.oid=to_regclass($1)',
      [t.name],
    )
    if (!r.rowCount) continue
    const x = r.rows[0]
    if (!['public', 'private'].includes(x.nspname)) throw new Error('Invalid table target')
    const type = {
      r: 'table',
      p: 'table',
      v: 'view',
      m: 'materialized view',
      f: 'foreign table',
      S: 'sequence',
    }[t.kind]
    await db.query(`drop ${type} if exists ${quote(x.nspname)}.${quote(x.relname)} cascade`)
  }
  for (const type of manifest.types || []) {
    if (!['public', 'private'].includes(type.schema)) throw new Error('Invalid type target')
    await db.query(
      `drop ${type.kind === 'd' ? 'domain' : 'type'} if exists ${quote(type.schema)}.${quote(type.name)} cascade`,
    )
  }
  await db.query('commit')
  // All users and buckets in this dedicated project belong to the old IronLog.
  for (const b of manifest.buckets) {
    const current = await client.storage.getBucket(b.id)
    if (current.error && Number(current.error.statusCode ?? current.error.status) === 404) continue
    if (current.error) throw new Error('Could not inspect legacy bucket')
    const emptied = await client.storage.emptyBucket(b.id)
    if (emptied.error) throw new Error('Could not empty legacy bucket')
    const removed = await client.storage.deleteBucket(b.id)
    if (removed.error) throw new Error('Could not delete legacy bucket')
  }
  for (;;) {
    const r = await client.auth.admin.listUsers({ page: 1, perPage: 50 })
    if (r.error) throw new Error('Could not inspect legacy auth users')
    if (!r.data.users.length) break
    for (const u of r.data.users) {
      const removed = await client.auth.admin.deleteUser(u.id)
      if (removed.error) throw new Error('Could not remove legacy auth user')
    }
  }
  console.log(
    'Inventoried legacy database objects, files and Auth users removed. Managed schemas preserved.',
  )
} catch (e) {
  await db.query('rollback').catch(() => {})
  throw e
} finally {
  await db.end()
}
