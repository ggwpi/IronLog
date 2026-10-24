import pg from 'pg'
import fs from 'node:fs'
const url = process.env.IRONLOG_TEST_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname))
  throw new Error('Test schema requires an explicit local test database')
const db = new pg.Client({ connectionString: url })
await db.connect()
try {
  const dir = new URL('../../../supabase/migrations/', import.meta.url)
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.sql')).sort()) {
    await db.query(fs.readFileSync(new URL(name, dir), 'utf8'))
  }
} finally {
  await db.end()
}
