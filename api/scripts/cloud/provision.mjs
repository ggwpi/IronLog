// Run only after the dedicated project's legacy inventory/cleanup is complete.
// Credentials are read from the environment; never emitted in commands or logs.
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'
const required = [
  'IRONLOG_DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'ORIGIN',
  'IRONLOG_WORKER_SECRET',
]
for (const k of required) if (!process.env[k]) throw new Error(k + ' is required')
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
})
const { data: buckets, error } = await client.storage.listBuckets()
if (error) throw new Error('Cannot inspect buckets')
const spec = {
  public: false,
  fileSizeLimit: 50 * 1024 * 1024,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/json',
  ],
}
const result = buckets.some((b) => b.id === 'ironlog-private')
  ? await client.storage.updateBucket('ironlog-private', spec)
  : await client.storage.createBucket('ironlog-private', spec)
if (result.error) throw new Error('Cannot configure private bucket')
const db = new pg.Client({
  connectionString: process.env.SUPABASE_ADMIN_DATABASE_URL || process.env.IRONLOG_DATABASE_URL,
})
await db.connect()
try {
  await db.query('begin')
  await db.query('create extension if not exists pg_cron')
  await db.query('create extension if not exists pg_net with schema extensions')
  // Vault keeps the worker credential out of the cron command/history.
  const found = await db.query("select id from vault.secrets where name='ironlog_worker_secret'")
  if (found.rows.length)
    await db.query('select vault.update_secret($1,$2)', [
      found.rows[0].id,
      process.env.IRONLOG_WORKER_SECRET,
    ])
  else
    await db.query("select vault.create_secret($1,'ironlog_worker_secret')", [
      process.env.IRONLOG_WORKER_SECRET,
    ])
  await db.query(
    `insert into ironlog.settings(key,value) values('worker_url',$1) on conflict(key) do update set value=excluded.value`,
    [JSON.stringify(new URL('/api/internal/worker', process.env.ORIGIN).href)],
  )
  await db.query(
    `insert into ironlog.jobs(id,kind,payload,due_at) values('reminders','reminders','{}',now()),('maintenance','maintenance','{}',now()) on conflict(id) do nothing`,
  )
  const sql = `select net.http_post(
    url:=(select value #>> '{}' from ironlog.settings where key='worker_url'),
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='ironlog_worker_secret')),
    body:='{}'::jsonb,timeout_milliseconds:=60000)
    where exists(select 1 from ironlog.jobs where done_at is null and due_at<=now())`
  await db.query("select cron.schedule('ironlog-worker','5 seconds',$1)", [sql])
  await db.query('commit')
  console.log('Private bucket and durable scheduler configured. No account was created.')
} catch (e) {
  await db.query('rollback')
  throw e
} finally {
  await db.end()
}
