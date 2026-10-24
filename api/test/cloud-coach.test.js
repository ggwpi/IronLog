import { test, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { Database, one } from '../cloud/db.js'
import { createApp } from '../cloud/app.js'
import { configuration, generation } from '../cloud/http.js'
import { token } from '../cloud/session.js'
import { CONSENT_VERSION } from '../coach/core/categories.js'
import { runCoachWork, scanCoachCadence } from '../cloud/coach.js'
import {
  sealKey,
  openKey,
  settingsOf,
  providerFetch,
} from '../cloud/coach-transport.js'
const cfg = configuration({
  ORIGIN: 'https://ironlog.example',
  IRONLOG_SESSION_SECRET: 'test-session-secret-long-enough-for-coach-tests',
})
const KEY = crypto.randomBytes(32)
const old = process.env.IRONLOG_COACH_KEY
before(() => {
  process.env.IRONLOG_COACH_KEY = KEY.toString('hex')
})
after(() => {
  if (old === undefined) delete process.env.IRONLOG_COACH_KEY
  else process.env.IRONLOG_COACH_KEY = old
})
test('credentials are authenticated ciphertext bound to one user and provider', () => {
  const encrypted = sealKey('alice', 'openai', 'not-a-real-provider-key', KEY)
  assert.equal(
    openKey('alice', 'openai', encrypted, KEY),
    'not-a-real-provider-key'
  )
  assert.ok(!encrypted.includes('not-a-real'))
  assert.notEqual(
    sealKey('alice', 'openai', 'not-a-real-provider-key', KEY),
    encrypted
  )
  for (const args of [
    ['bob', 'openai', encrypted, KEY],
    ['alice', 'gemini', encrypted, KEY],
    ['alice', 'openai', encrypted, crypto.randomBytes(32)],
  ])
    assert.throws(() => openKey(...args))
  const parts = encrypted.split('.')
  parts[1] = Buffer.alloc(16).toString('base64url')
  assert.throws(() => openKey('alice', 'openai', parts.join('.'), KEY))
})
test('cloud endpoints reject LAN, metadata, credentials, HTTP and unsupported providers', async () => {
  for (const baseUrl of [
    'http://api.example.com',
    'https://127.0.0.1',
    'https://169.254.169.254',
    'https://[::1]',
    'https://user:pass@api.example.com',
    'https://api.example.com:8443',
  ])
    assert.throws(() => settingsOf({ provider: 'compatible', baseUrl }))
  assert.throws(() => settingsOf({ provider: 'codex' }))
  assert.throws(() => settingsOf({ provider: '__proto__' }))
  await assert.rejects(providerFetch('https://127.0.0.1'))
  assert.equal(
    settingsOf({ provider: 'openai', baseUrl: 'https://attacker.example' })
      .baseUrl,
    'https://api.openai.com'
  )
})
const suite = process.env.IRONLOG_TEST_DATABASE_URL ? test : test.skip
let db, app, calls
const A = { id: 'coach-alice', name: 'Alice', sv: 0 },
  B = { id: 'coach-bob', name: 'Bob', sv: 0 }
const training = () => ({
  routines: [
    {
      id: 'r1',
      name: 'Push',
      prog: 'double',
      ex: [{ id: '0025', sets: 3, reps: 8, weight: 20 }],
    },
  ],
  week: { 1: ['r1'] },
  workouts: [],
  bodyweight: [],
  unit: 'kg',
  coach: {
    consent: { version: CONSENT_VERSION, agreedAt: new Date().toISOString() },
    profile: {
      goal: 'strength',
      daysPerWeek: 1,
      sessionMin: 60,
      equipment: [],
    },
  },
})
const review = () => ({
  coach_contract: 1,
  summary: 'Adjust volume.',
  changes: [
    {
      id: 'c1',
      type: 'sets',
      target: { routineId: 'r1', exId: '0025' },
      before: 3,
      after: 4,
      why: 'A measured increase.',
    },
  ],
  notes: [],
})
const fetch = async (url, init) => {
  calls.push({ url, init })
  return new Response(
    JSON.stringify(
      init.method === 'GET'
        ? { data: [{ id: 'test-model' }] }
        : {
            choices: [
              {
                finish_reason: 'stop',
                message: { content: JSON.stringify(review()) },
              },
            ],
          }
    ),
    { status: 200 }
  )
}
const call = (method, url, body, u = A, headers = {}) =>
  app.handle({
    method,
    url,
    body: body ?? (['GET', 'HEAD'].includes(method) ? undefined : {}),
    headers: {
      origin: cfg.origin,
      'x-ironlog-generation': generation,
      ...(u ? { authorization: 'Bearer ' + token(u, cfg) } : {}),
      ...headers,
    },
  })
if (process.env.IRONLOG_TEST_DATABASE_URL) {
  before(() => {
    db = new Database(process.env.IRONLOG_TEST_DATABASE_URL)
  })
  beforeEach(async () => {
    calls = []
    await db.pool.query("delete from ironlog.settings where key='coach-cadence-scan'")
    await db.pool.query(
      'truncate ironlog.accounts,ironlog.jobs,ironlog.limits cascade'
    )
    await db.transaction(async (c) => {
      for (const u of [A, B]) {
        await c.query('insert into ironlog.accounts(id,data) values($1,$2)', [
          u.id,
          { ...u, loginKey: u.id },
        ])
        await c.query(
          'insert into ironlog.profiles(user_id,state) values($1,$2)',
          [u.id, training()]
        )
      }
    })
    app = createApp({ database: db, cfg, storage: {}, coachFetch: fetch })
  })
  after(async () => {
    await db.close()
  })
}
async function connect(u = A, provider = 'openai') {
  const r = await call(
    'POST',
    '/api/coach/settings',
    { provider, model: 'test-model', apiKey: 'test-key-' + u.id },
    u
  )
  assert.equal(r.status, 200, JSON.stringify(r.body))
  return r
}
suite(
  'signed-in owners configure isolated keys; exports/config/status never expose secrets',
  async () => {
    assert.equal(
      (await call('POST', '/api/coach/settings', {}, null)).status,
      401
    )
    await connect()
    const stored = await db.transaction((c) =>
      one(c, 'select * from ironlog.coach where user_id=$1', [A.id])
    )
    assert.notEqual(stored.secret, 'test-key-' + A.id)
    assert.equal(openKey(A.id, 'openai', stored.secret), 'test-key-' + A.id)
    assert.equal(
      (await call('GET', '/api/coach/settings', undefined, B)).body.hasKey,
      false
    )
    for (const route of [
      '/api/config',
      '/api/coach/settings',
      '/api/coach/status',
      '/api/data',
    ]) {
      const r = await call('GET', route)
      assert.ok(!JSON.stringify(r.body).includes('test-key-'))
      assert.ok(!JSON.stringify(r.body).includes(stored.secret))
    }
    assert.equal(
      (await call('POST', '/api/coach/models', { provider: 'openai' })).body.ok,
      true
    )
    assert.equal(
      calls.at(-1).init.headers.authorization,
      'Bearer test-key-' + A.id
    )
    assert.equal(
      (
        await call('POST', '/api/coach/models', {
          provider: 'compatible',
          baseUrl: 'https://attacker.example',
        })
      ).body.ok,
      true
    )
    assert.equal(calls.at(-1).init.headers.authorization, undefined)
  }
)
suite(
  'the original provider pipeline yields a pending proposal; applying stays in the client',
  async () => {
    await connect()
    const before = (await call('GET', '/api/data')).body
    assert.equal(
      (await call('POST', '/api/coach/review', { note: 'Review my block' }))
        .status,
      202
    )
    assert.equal((await call('POST', '/api/coach/review', {})).status, 409)
    assert.deepEqual(await runCoachWork(db, { fetch }), { processed: 1 })
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.job, null)
    assert.equal(status.pending.changes[0].type, 'sets')
    assert.equal(status.pending.changes[0].after, 4)
    assert.equal(status.cap.used, 1)
    assert.deepEqual((await call('GET', '/api/data')).body, before)
    assert.equal(
      (await call('GET', '/api/coach/status', undefined, B)).body.pending,
      null
    )
    assert.equal(
      (
        await call('POST', '/api/coach/pending/resolve', {
          id: 'old-tab',
          dismissed: true,
        })
      ).status,
      409
    )
    assert.equal(
      (
        await call('POST', '/api/coach/pending/resolve', {
          id: status.pending.id,
          dismissed: true,
        })
      ).status,
      200
    )
    assert.equal((await call('GET', '/api/coach/status')).body.pending, null)
  }
)
suite(
  'consent, daily caps and credential disconnect are enforced at the server',
  async () => {
    await connect()
    await db.transaction((c) =>
      c.query(
        "update ironlog.profiles set state=state #- '{coach,consent}' where user_id=$1",
        [A.id]
      )
    )
    assert.equal((await call('POST', '/api/coach/review', {})).status, 403)
    await db.transaction((c) =>
      c.query('update ironlog.profiles set state=$2 where user_id=$1', [
        A.id,
        training(),
      ])
    )
    await db.transaction((c) =>
      c.query('update ironlog.coach set state=$2 where user_id=$1', [
        A.id,
        { daily: { date: new Date().toISOString().slice(0, 10), count: 10 } },
      ])
    )
    assert.equal((await call('POST', '/api/coach/review', {})).status, 429)
    await call('DELETE', '/api/coach/settings')
    await connect()
    assert.equal((await call('POST', '/api/coach/review', {})).status, 429)
  }
)
suite(
  'disconnect during a provider call cannot restore a key or a proposal',
  async () => {
    await connect()
    await call('POST', '/api/coach/review', {})
    let release, started
    const waiting = new Promise((r) => {
      started = r
    })
    const run = runCoachWork(db, {
      pipeline: async () => {
        started()
        await new Promise((r) => {
          release = r
        })
        return { ok: true, result: { changes: [] } }
      },
    })
    await waiting
    assert.equal((await call('DELETE', '/api/coach/settings')).status, 200)
    release()
    await run
    const r = await db.transaction((c) =>
      one(c, 'select * from ironlog.coach where user_id=$1', [A.id])
    )
    assert.equal(r.secret, null)
    assert.equal(r.state.pending, undefined)
    assert.equal(r.state.current, undefined)
  }
)
suite(
  'a crashed running task is failed without sending another paid request',
  async () => {
    await connect()
    const enqueued = await call('POST', '/api/coach/review', {})
    await db.transaction(async (c) => {
      await c.query(
        "update ironlog.coach set state=jsonb_set(state,'{current,state}','\"running\"') where user_id=$1",
        [A.id]
      )
      await c.query(
        "update ironlog.jobs set lease_until=now()-interval '1 second' where id=$1",
        [enqueued.body.job.id]
      )
    })
    await runCoachWork(db, { fetch })
    assert.equal(calls.length, 0)
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.job, null)
    assert.equal(status.last.errorClass, 'timeout')
  }
)
suite(
  'account deletion cascades encrypted credentials and provider configuration',
  async () => {
    await connect()
    await db.transaction((c) =>
      c.query('delete from ironlog.accounts where id=$1', [A.id])
    )
    assert.equal(
      await db.transaction((c) =>
        one(c, 'select user_id from ironlog.coach where user_id=$1', [A.id])
      ),
      undefined
    )
  }
)

suite(
  'concurrent workers claim a paid task once and do not hold the user lock during inference',
  async () => {
    await connect()
    await call('POST', '/api/coach/review', {})
    let release, ready
    const started = new Promise((r) => {
      ready = r
    })
    let count = 0
    const pipeline = async () => {
      count++
      ready()
      await new Promise((r) => {
        release = r
      })
      return { ok: true, nochange: true, reading: 'Keep training.' }
    }
    const first = runCoachWork(db, { pipeline })
    await started
    assert.deepEqual(await runCoachWork(db, { pipeline }), { processed: 0 })
    assert.equal((await call('GET', '/api/coach/settings')).status, 200)
    release()
    await first
    assert.equal(count, 1)
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.last.outcome, 'nochange')
    assert.equal(status.pending, null)
  }
)
suite(
  'unusable provider answers are checked twice and cannot touch training data',
  async () => {
    await connect()
    const before = (await call('GET', '/api/data')).body
    await call('POST', '/api/coach/review', {})
    let sent = 0
    const invalid = async () => {
      sent++
      return new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: 'stop',
              message: {
                content: JSON.stringify({
                  coach_contract: 1,
                  summary: 'Invalid',
                  changes: [
                    {
                      id: 'bad',
                      type: 'delete-account',
                      target: {},
                      after: null,
                    },
                  ],
                }),
              },
            },
          ],
        })
      )
    }
    await runCoachWork(db, { fetch: invalid })
    assert.equal(sent, 2)
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.pending, null)
    assert.equal(status.last.errorClass, 'unusable')
    assert.deepEqual((await call('GET', '/api/data')).body, before)
  }
)
suite(
  'browser database roles cannot read the encrypted key table',
  async () => {
    await connect()
    await db.pool.query(
      "do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; end $$"
    )
    const result = await db.pool.query(
      "select relrowsecurity,has_table_privilege('anon','ironlog.coach','select') as anon from pg_class where oid='ironlog.coach'::regclass"
    )
    assert.equal(result.rows[0].relrowsecurity, true)
    assert.equal(result.rows[0].anon, false)
  }
)

suite('older consent versions cannot authorize sharing session notes', async () => {
  await connect()
  const S = training(); S.coach.consent.version = CONSENT_VERSION - 1
  await db.transaction(c => c.query('update ironlog.profiles set state=$2 where user_id=$1', [A.id, S]))
  assert.equal((await call('POST', '/api/coach/review', {})).status, 403)
})
suite('automatic reviews require explicit consent for the current provider and use upstream cadence rules', async () => {
  await connect()
  let S = training(); S.coach.cadence = { everyWorkouts: 1 }; S.workouts = [{ id: 'w1', d: new Date().toISOString().slice(0,10), end: Date.now() }]
  await db.transaction(c => c.query('update ironlog.profiles set state=$2 where user_id=$1', [A.id, S]))
  await scanCoachCadence(db)
  assert.equal((await call('GET', '/api/coach/status')).body.job, null)
  await call('POST', '/api/coach/review', {})
  await runCoachWork(db, { pipeline: async () => ({ ok: true, nochange: true, reading: 'Keep going.' }) })
  S.workouts.push({ id: 'w2', d: new Date().toISOString().slice(0,10), end: Date.now() + 1000 })
  await db.transaction(async c => { await c.query('update ironlog.profiles set state=$2 where user_id=$1', [A.id, S]); await c.query("delete from ironlog.settings where key='coach-cadence-scan'") })
  await scanCoachCadence(db)
  assert.equal((await call('GET', '/api/coach/status')).body.job.kind, 'review')
  await connect(A, 'gemini')
  await db.transaction(c => c.query("delete from ironlog.settings where key='coach-cadence-scan'"))
  await scanCoachCadence(db)
  assert.equal((await call('GET', '/api/coach/status')).body.job, null)
})
