import pg from 'pg'
import fs from 'node:fs'
const url = process.env.IRONLOG_TEST_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname))
  throw new Error('Test schema requires an explicit local test database')
const db = new pg.Client({ connectionString: url })
await db.connect()
try {
  await db.query(
    fs.readFileSync(
      new URL(
        '../../../supabase/migrations/20261023121250_ironlog_cloud_backend.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  )
} finally {
  await db.end()
}
