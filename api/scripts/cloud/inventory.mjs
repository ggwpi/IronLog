// Metadata only. No passwords, workout contents, tokens or upload contents.
import pg from 'pg'
import { connectionOptions } from '../../cloud/db.js'
import fs from 'node:fs'
import crypto from 'node:crypto'
const output = process.argv[2],
  project = process.env.IRONLOG_EXPECTED_PROJECT_REF
if (!output || !project || !process.env.SUPABASE_URL)
  throw new Error('Set project identity and provide an inventory output filename')
if (new URL(process.env.SUPABASE_URL).hostname !== project + '.supabase.co')
  throw new Error('Project identity mismatch')
const db = new pg.Client(connectionOptions(process.env.SUPABASE_ADMIN_DATABASE_URL || process.env.IRONLOG_DATABASE_URL))
await db.connect()
try {
  const tables = (
    await db.query(`select c.oid::regclass::text as name,c.relkind as kind from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','f','S') order by 1`)
  ).rows
  const functions = (
    await db.query(`select p.oid::regprocedure::text as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname in ('public','private') and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e') order by 1`)
  ).rows
  const policies = (
    await db.query(
      `select schemaname,tablename,policyname from pg_policies where schemaname in ('public','private','storage') order by 1,2,3`,
    )
  ).rows
  const buckets = (await db.query('select id,name,public from storage.buckets order by id')).rows
  const auth = (await db.query('select count(*)::int as users from auth.users')).rows[0]
  const triggers = (
    await db.query(`select n.nspname as schema,c.relname as table_name,t.tgname as name from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid join pg_namespace pn on pn.oid=p.pronamespace
   where (n.nspname in ('public','private') or pn.nspname in ('public','private')) and not t.tgisinternal and n.nspname in ('public','private','auth','storage') and not exists(select 1 from pg_depend d where d.objid=t.oid and d.deptype='e') order by 1,2,3`)
  ).rows
  const hasCron = (await db.query("select 1 from pg_extension where extname='pg_cron'")).rowCount
  const cron = hasCron
    ? (
        await db.query(
          'select jobid,jobname,schedule,md5(command) as command_hash from cron.job order by jobid',
        )
      ).rows
    : []
  const types = (
    await db.query(`select n.nspname as schema,t.typname as name,t.typtype as kind from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname in ('public','private') and t.typtype in ('e','d') and not exists(select 1 from pg_depend d where d.objid=t.oid and d.deptype='e') order by 1,2`)
  ).rows
  const contents = { project, tables, functions, policies, buckets, auth, triggers, cron, types }
  const sha = crypto.createHash('sha256').update(JSON.stringify(contents)).digest('hex')
  fs.writeFileSync(output, JSON.stringify({ ...contents, sha }, null, 2) + '\n', {
    mode: 0o600,
    flag: 'wx',
  })
  console.log('Metadata inventory saved. Review the exact legacy objects before cleanup.')
} finally {
  await db.end()
}
