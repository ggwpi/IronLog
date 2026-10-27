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
  safeProviderDetail,
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
    body:
      body == null
        ? ['GET', 'HEAD'].includes(method)
          ? undefined
          : { accountId: u?.id }
        : {
            ...(method !== 'GET' &&
            /\/api\/coach\/(settings|models|connections|selection)$/.test(url)
              ? { accountId: u?.id }
              : {}),
            ...body,
          },
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
    await db.pool.query(
      "delete from ironlog.settings where key='coach-cadence-scan'"
    )
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
  'consent is required and manual BYOK requests have no daily quota, including after reconnect',
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
    assert.equal((await call('POST', '/api/coach/review', {})).status, 202)
    assert.equal((await call('GET', '/api/coach/status')).body.cap.limit, 0)
    await call('DELETE', '/api/coach/settings')
    await connect()
    assert.equal((await call('POST', '/api/coach/review', {})).status, 202)
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

suite(
  'older consent versions cannot authorize sharing session notes',
  async () => {
    await connect()
    const S = training()
    S.coach.consent.version = CONSENT_VERSION - 1
    await db.transaction((c) =>
      c.query('update ironlog.profiles set state=$2 where user_id=$1', [
        A.id,
        S,
      ])
    )
    assert.equal((await call('POST', '/api/coach/review', {})).status, 403)
  }
)
suite(
  'automatic reviews require explicit consent for the current provider and use upstream cadence rules',
  async () => {
    await connect()
    let S = training()
    S.coach.cadence = { everyWorkouts: 1 }
    S.workouts = [
      { id: 'w1', d: new Date().toISOString().slice(0, 10), end: Date.now() },
    ]
    await db.transaction((c) =>
      c.query('update ironlog.profiles set state=$2 where user_id=$1', [
        A.id,
        S,
      ])
    )
    await scanCoachCadence(db)
    assert.equal((await call('GET', '/api/coach/status')).body.job, null)
    await call('POST', '/api/coach/review', {})
    await runCoachWork(db, {
      pipeline: async () => ({
        ok: true,
        nochange: true,
        reading: 'Keep going.',
      }),
    })
    S.workouts.push({
      id: 'w2',
      d: new Date().toISOString().slice(0, 10),
      end: Date.now() + 1000,
    })
    await db.transaction(async (c) => {
      await c.query('update ironlog.profiles set state=$2 where user_id=$1', [
        A.id,
        S,
      ])
      await c.query(
        "delete from ironlog.settings where key='coach-cadence-scan'"
      )
    })
    // Manual volume cannot exhaust the separate automatic spending guard.
    await db.transaction((c) =>
      c.query(
        'update ironlog.coach set state=state || $2::jsonb where user_id=$1',
        [
          A.id,
          {
            daily: { date: new Date().toISOString().slice(0, 10), count: 100 },
            autoDaily: {
              date: new Date().toISOString().slice(0, 10),
              count: 10,
            },
          },
        ]
      )
    )
    await scanCoachCadence(db)
    assert.equal((await call('GET', '/api/coach/status')).body.job, null)
    await db.transaction(async (c) => {
      await c.query(
        "update ironlog.coach set state=state - 'autoDaily' where user_id=$1",
        [A.id]
      )
      await c.query(
        "delete from ironlog.settings where key='coach-cadence-scan'"
      )
    })
    await scanCoachCadence(db)
    assert.equal(
      (await call('GET', '/api/coach/status')).body.job.kind,
      'review'
    )
    const automatic = await db.transaction((c) =>
      one(c, 'select state from ironlog.coach where user_id=$1', [A.id])
    )
    assert.equal(automatic.state.autoDaily.count, 1)
    await connect(A, 'gemini')
    await db.transaction((c) =>
      c.query("delete from ironlog.settings where key='coach-cadence-scan'")
    )
    await scanCoachCadence(db)
    assert.equal((await call('GET', '/api/coach/status')).body.job, null)
  }
)

suite(
  'provider model-list failures return a translated error code without echoing credentials',
  async () => {
    await connect()
    app = createApp({
      database: db,
      cfg,
      storage: {},
      coachFetch: async () =>
        new Response(
          JSON.stringify({
            error: { message: 'Rejected secret test-key-' + A.id },
          }),
          { status: 401 }
        ),
    })
    const r = await call('POST', '/api/coach/models', { provider: 'openai' })
    assert.equal(r.body.ok, false)
    assert.equal(r.body.code, 'auth')
    assert.ok(!JSON.stringify(r.body).includes('test-key-'))
  }
)

suite(
  'credential forms cannot attach a typed key after another tab changes accounts',
  async () => {
    const mismatch = {
      accountId: B.id,
      provider: 'openai',
      model: 'test-model',
      apiKey: 'key-from-another-account-form',
    }
    for (const path of ['/api/coach/settings', '/api/coach/models']) {
      const r = await call('POST', path, mismatch, A)
      assert.equal(r.status, 409)
      assert.equal(r.body.code, 'account-changed')
    }
    assert.equal((await call('GET', '/api/coach/settings')).body.hasKey, false)
    assert.equal(calls.length, 0)
  }
)

async function addConnection(name, apiKey, provider = 'openai', u = A) {
  const r = await call(
    'POST',
    '/api/coach/connections',
    { name, provider, model: 'test-model', apiKey },
    u
  )
  assert.equal(r.status, 200, JSON.stringify(r.body))
  return r.body
}
suite(
  'multiple named keys of the same type are stored independently and remain private',
  async () => {
    const a = await addConnection('API Alpha', 'alpha-key'),
      b = await addConnection('API Beta', 'beta-key')
    assert.notEqual(a.id, b.id)
    const list = (await call('GET', '/api/coach/connections')).body
    assert.deepEqual(
      list.connections.map((c) => c.name),
      ['API Alpha', 'API Beta']
    )
    assert.ok(!JSON.stringify(list).includes('alpha-key'))
    assert.ok(!JSON.stringify(list).includes('beta-key'))
    assert.deepEqual(
      (await call('GET', '/api/coach/connections', undefined, B)).body
        .connections,
      []
    )
    for (const path of ['/api/coach/selection', '/api/coach/models']) {
      const body = path.endsWith('/models')
        ? { connectionId: a.id, provider: 'openai' }
        : { connectionId: a.id }
      assert.equal((await call('POST', path, body, B)).status, 404)
    }
    assert.equal(
      (await call('DELETE', '/api/coach/connections', { id: a.id }, B)).status,
      404
    )
    await call('POST', '/api/coach/models', {
      connectionId: a.id,
      provider: 'openai',
    })
    assert.equal(calls.at(-1).init.headers.authorization, 'Bearer alpha-key')
    await call('POST', '/api/coach/models', {
      connectionId: b.id,
      provider: 'openai',
    })
    assert.equal(calls.at(-1).init.headers.authorization, 'Bearer beta-key')
  }
)
suite(
  'selection preserves pending proposals, training and usage; queued requests keep their original key/model',
  async () => {
    const a = await addConnection('First API', 'first-key'),
      b = await addConnection('Second API', 'second-key')
    await call('POST', '/api/coach/review', {
      connectionId: a.id,
      model: 'first-model',
    })
    await call('POST', '/api/coach/selection', {
      connectionId: b.id,
      model: 'second-model',
    })
    let used
    await runCoachWork(db, {
      pipeline: async (opts) => {
        used = opts
        return {
          ok: true,
          result: {
            summary: 'Test proposal',
            changes: [{ id: 'c1', type: 'sets' }],
          },
        }
      },
    })
    assert.equal(used.model, 'first-model')
    assert.equal(used.invokeOpts.env.OPENAI_API_KEY, 'first-key')
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.pending.connection.id, a.id)
    assert.equal(status.cap.used, 1)
    await call('POST', '/api/coach/selection', { connectionId: a.id })
    assert.deepEqual(
      (await call('GET', '/api/coach/status')).body.pending,
      status.pending
    )
    assert.equal((await call('GET', '/api/coach/status')).body.cap.used, 1)
    const data = (await call('GET', '/api/data')).body
    assert.equal((data.state || data).routines[0].ex[0].sets, 3)
  }
)
suite(
  'a legacy saved key upgrades in place without decryption or replacement',
  async () => {
    const secret = sealKey(A.id, 'openai', 'existing-key')
    await db.transaction((c) =>
      c.query(
        'insert into ironlog.coach(user_id,config,secret,state) values($1,$2,$3,$4)',
        [
          A.id,
          {
            provider: 'openai',
            baseUrl: 'https://api.openai.com',
            model: 'old-model',
          },
          secret,
          { daily: { date: new Date().toISOString().slice(0, 10), count: 3 } },
        ]
      )
    )
    const list = (await call('GET', '/api/coach/connections')).body
    assert.equal(list.connections.length, 1)
    assert.equal(list.connections[0].name, 'OpenAI API')
    const stored = await db.transaction((c) =>
      one(
        c,
        'select secret from ironlog.coach_connections where user_id=$1 and id=$2',
        [A.id, list.activeId]
      )
    )
    assert.equal(stored.secret, secret)
    assert.equal((await call('GET', '/api/coach/status')).body.cap.used, 3)
    await addConnection('Another key', 'another-key')
    assert.equal(
      (await call('GET', '/api/coach/connections')).body.connections.length,
      2
    )
  }
)
suite(
  'deleting one key preserves the other connections, chat and pending suggestions',
  async () => {
    const a = await addConnection('Delete this', 'a-key'),
      b = await addConnection('Keep this', 'b-key')
    await call('POST', '/api/coach/review', { connectionId: b.id })
    await runCoachWork(db, {
      pipeline: async () => ({ ok: true, result: { changes: [] } }),
    })
    const before = (await call('GET', '/api/coach/status')).body.pending
    assert.equal(
      (await call('DELETE', '/api/coach/connections', { id: a.id })).status,
      200
    )
    const list = (await call('GET', '/api/coach/connections')).body
    assert.deepEqual(
      list.connections.map((c) => c.id),
      [b.id]
    )
    assert.equal(list.activeId, b.id)
    assert.deepEqual(
      (await call('GET', '/api/coach/status')).body.pending,
      before
    )
  }
)
suite(
  'editing a connection in use discards late results while edits to other keys leave the run intact',
  async () => {
    const a = await addConnection('A', 'a-key'),
      b = await addConnection('B', 'b-key')
    await call('POST', '/api/coach/review', { connectionId: a.id })
    let ready, release
    const started = new Promise((r) => {
      ready = r
    })
    const run = runCoachWork(db, {
      pipeline: async () => {
        ready()
        await new Promise((r) => {
          release = r
        })
        return { ok: true, result: { changes: [] } }
      },
    })
    await started
    await call('POST', '/api/coach/connections', {
      id: b.id,
      name: 'Renamed B',
      provider: 'openai',
      model: 'test-model',
      apiKey: 'new-b-key',
    })
    assert.ok((await call('GET', '/api/coach/status')).body.job)
    await call('POST', '/api/coach/connections', {
      id: a.id,
      name: 'Updated A',
      provider: 'openai',
      model: 'test-model',
      apiKey: 'new-a-key',
    })
    release()
    await run
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.job, null)
    assert.equal(status.pending, null)
    assert.equal(status.last.errorClass, 'connection-changed')
  }
)

test('provider diagnostics redact full and truncated keys before storage', () => {
  const key = 'account.secret+with/regex$chars-1234567890'
  const detail = safeProviderDetail(
    '429 quota exceeded; key ' +
      key +
      ' or ' +
      key.slice(0, 20) +
      ' Bearer private-token-123',
    key
  )
  assert.match(detail, /429 quota exceeded/)
  assert.ok(!detail.includes(key))
  assert.ok(!detail.includes(key.slice(0, 12)))
  assert.ok(!detail.includes('private-token'))
  assert.ok(
    !safeProviderDetail('bad sk-proj-abcdefghijk AIza1234567890').includes(
      'abcdefghijk'
    )
  )
  assert.equal(safeProviderDetail(null), '')
  assert.equal(safeProviderDetail('x'.repeat(500)).length, 300)
})
suite(
  'provider failures reach only their owner with redacted actionable diagnostics',
  async () => {
    await connect()
    await call('POST', '/api/coach/review', {})
    await runCoachWork(db, {
      fetch: async () =>
        new Response(
          JSON.stringify({
            error: {
              code: 'insufficient_quota',
              message:
                'You exceeded your current quota. Check your billing. Rejected key test-key-coach-alice',
            },
          }),
          { status: 429 }
        ),
    })
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.last.errorClass, 'provider')
    assert.match(status.lastError.detail, /billing/)
    assert.ok(!JSON.stringify(status).includes('test-key-coach-alice'))
    assert.equal(status.cap.limit, 0)
    assert.equal(
      (await call('GET', '/api/coach/status', undefined, B)).body.lastError,
      null
    )
  }
)
suite(
  'duplicate and rapid manual requests remain bounded without a daily quota',
  async () => {
    await connect()
    for (let i = 0; i < 6; i++) {
      assert.equal((await call('POST', '/api/coach/review', {})).status, 202)
      assert.equal((await call('POST', '/api/coach/review', {})).status, 409)
      await runCoachWork(db, {
        pipeline: async () => ({ ok: true, nochange: true }),
      })
    }
    const refused = await call('POST', '/api/coach/review', {})
    assert.equal(refused.status, 429)
    assert.equal(refused.body.code, 'rate-limit')
  }
)

suite(
  'Gemini receives synced workout evidence and returns validated suggestions, not just text',
  async () => {
    await connect(A, 'gemini')
    const S = training()
    S.workouts = [14, 7, 0].map((offset, i) => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - offset)
      return {
        id: 'logged-' + i,
        d: d.toISOString().slice(0, 10),
        name: 'Push',
        routineId: 'r1',
        start: 1000,
        end: 3601000,
        entries: [
          {
            id: '0025',
            target: { sets: 3, reps: 8, weight: 20 },
            sets: [
              { w: 20, r: 6, rir: 0, done: true },
              { w: 20, r: 5, rir: 0, done: true },
              { w: 20, r: 4, rir: 0, done: true },
            ],
          },
        ],
      }
    })
    assert.equal((await call('PUT', '/api/data', { state: S })).status, 200)
    const before = (await call('GET', '/api/data')).body
    assert.equal(
      (
        await call('POST', '/api/coach/review', {
          note: 'Review the logged stalls',
          lang: 'he',
        })
      ).status,
      202
    )
    let payload
    await runCoachWork(db, {
      fetch: async (url, init) => {
        assert.match(url, /generativelanguage.*:generateContent$/)
        const request = JSON.parse(init.body)
        assert.equal(
          request.generationConfig.responseMimeType,
          'application/json'
        )
        payload = JSON.parse(
          request.contents[0].parts[0].text.match(/```json\n([\s\S]*?)\n```/)[1]
        )
        const answer = {
          coach_contract: 1,
          summary: 'Reduce volume after repeated misses.',
          changes: [
            {
              id: 'c1',
              type: 'sets',
              target: { routineId: 'r1', exId: '0025' },
              before: 3,
              after: 2,
              why: 'Three logged sessions missed their rep targets.',
            },
          ],
          notes: [],
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: 'STOP',
                content: { parts: [{ text: JSON.stringify(answer) }] },
              },
            ],
          })
        )
      },
    })
    assert.equal(payload.window.workouts.length, 3)
    assert.equal(
      payload.aggregates.exercises.find((e) => e.id === '0025').stalls,
      3
    )
    assert.equal(payload.window.workouts[2].entries[0].sets[0].rir, 0)
    assert.equal(payload.coachProfile.goal, 'strength')
    assert.equal(payload.meta.lang, 'he')
    const status = (await call('GET', '/api/coach/status')).body
    assert.equal(status.last.outcome, 'ready')
    assert.equal(status.pending.changes[0].type, 'sets')
    assert.equal(status.pending.changes[0].after, 2)
    assert.deepEqual(
      (await call('GET', '/api/data')).body,
      before,
      'a suggestion cannot modify the plan until user approval'
    )
  }
)

suite('cloud ask uses the upstream question pipeline and restores the proposal it was asked beside', async () => {
  await connect()
  await call('POST', '/api/coach/review', {})
  await runCoachWork(db, { fetch })
  const proposal = (await call('GET', '/api/coach/status')).body.pending
  const text = 'How long should I rest?'
  const queued = await call('POST', '/api/coach/ask', {
    text, lang: 'he',
    today: { name: 'Push', entries: [{ id: '0025', note: 'private-note', sets: [{ w: 20, r: 8, done: true, private: 'not-for-provider' }] }] },
  })
  assert.equal(queued.status, 202)
  await runCoachWork(db, { fetch: async (_url, init) => {
    const body = JSON.parse(init.body)
    assert.match(body.messages[0].content, /# Task: answer a question/)
    const prompt = body.messages[1].content
    assert.ok(prompt.includes(text))
    assert.ok(prompt.includes('"lang":"he"'))
    assert.ok(prompt.includes('"w":20'))
    assert.ok(!prompt.includes('private-note'))
    assert.ok(!prompt.includes('not-for-provider'))
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ coach_contract: 1, answer: 'Rest two minutes.' }) } }] }))
  } })
  const status = (await call('GET', '/api/coach/status')).body
  assert.equal(status.pending.kind, 'ask')
  assert.equal(status.pending.answer, 'Rest two minutes.')
  assert.equal(status.pending.prev.id, proposal.id)
  assert.equal((await call('POST', '/api/coach/pending/resolve', { id: 'old-answer', accepted: ['ask'] })).status, 409)
  assert.equal((await call('POST', '/api/coach/pending/resolve', { id: status.pending.id, accepted: ['ask'] })).status, 200)
  assert.equal((await call('GET', '/api/coach/status')).body.pending.id, proposal.id)
  assert.equal((await call('POST', '/api/coach/ask', { text: '   ' })).status, 400)
})

suite('cloud Gemini replaces a refused model with a listed Flash and remembers the model that answered', async () => {
  await call('POST', '/api/coach/settings', { provider: 'gemini', model: 'gemini-retired-cloud-test', apiKey: 'test-gemini-cloud-key' })
  const queued = await call('POST', '/api/coach/ask', { text: 'How was my training?' })
  assert.equal(queued.status, 202)
  const visited = []
  await runCoachWork(db, { fetch: async (url, init) => {
    visited.push(url)
    assert.equal(init.headers['x-goog-api-key'], 'test-gemini-cloud-key')
    if (url.includes(':generateContent') && url.includes('gemini-retired-cloud-test'))
      return new Response(JSON.stringify({ error: { message: 'model not found' } }), { status: 404 })
    if (!url.includes(':generateContent'))
      return new Response(JSON.stringify({ models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }] }))
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ coach_contract: 1, answer: 'Keep training steadily.' }) }] } }] }))
  } })
  const status = (await call('GET', '/api/coach/status')).body
  assert.equal(status.pending.answer, 'Keep training steadily.')
  assert.equal(status.pending.connection.model, 'gemini-3.8-flash')
  assert.equal((await call('GET', '/api/coach/settings')).body.model, 'gemini-3.8-flash')
  assert.equal(visited.length, 3)
})

suite('a failed question preserves the pending proposal; a first plan can start from a chat message', async () => {
  await connect()
  await call('POST', '/api/coach/review', {})
  await runCoachWork(db, { fetch })
  const proposal = (await call('GET', '/api/coach/status')).body.pending
  await call('POST', '/api/coach/ask', { text: 'Why this change?' })
  await runCoachWork(db, { pipeline: async (opts) => {
    assert.equal(opts.timeoutMs, 300000)
    assert.ok(opts.invokeOpts.signal instanceof AbortSignal)
    return { ok: false, errorClass: 'timeout' }
  } })
  assert.equal((await call('GET', '/api/coach/status')).body.pending.id, proposal.id)
  await call('POST', '/api/coach/pending/resolve', { id: proposal.id, dismissed: true })
  const queued = await call('POST', '/api/coach/plan', { refine: 'Build me a three-day plan' })
  assert.equal(queued.status, 202)
  await runCoachWork(db, { pipeline: async (opts) => {
    assert.equal(opts.kind, 'create')
    assert.equal(opts.payload.userNote, 'Build me a three-day plan')
    assert.equal(opts.payload.refine, undefined)
    return { ok: false, errorClass: 'timeout' }
  } })
})

suite('fallback preference survives saved connections and older clients; disabled runs never change models', async () => {
  assert.equal((await call('POST', '/api/coach/settings', { provider: 'gemini', model: 'gemini-choice-only', apiKey: 'choice-key', allowModelFallback: 'false' })).status, 400)
  const saved = await call('POST', '/api/coach/settings', { provider: 'gemini', model: 'gemini-choice-only', apiKey: 'choice-key', allowModelFallback: false })
  assert.equal(saved.status, 200)
  assert.equal(saved.body.allowModelFallback, false)
  assert.equal((await call('GET', '/api/coach/settings')).body.allowModelFallback, false)
  const edited = await call('POST', '/api/coach/settings', { provider: 'gemini', model: 'gemini-choice-only' })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.allowModelFallback, false, 'older clients must not re-enable fallback by omission')
  const queued = await call('POST', '/api/coach/ask', { text: 'How did I do?' })
  assert.equal(queued.status, 202)
  const seen = []
  await runCoachWork(db, { fetch: async (url) => {
    seen.push(url)
    return new Response(JSON.stringify({ error: { message: 'model not found' } }), { status: 404 })
  } })
  assert.equal(seen.length, 1)
  assert.ok(seen[0].includes('gemini-choice-only:generateContent'))
  assert.equal((await call('GET', '/api/coach/status')).body.last.errorClass, 'provider')
  assert.equal((await call('GET', '/api/coach/settings')).body.model, 'gemini-choice-only')
  const enabled = await call('POST', '/api/coach/settings', { provider: 'gemini', model: 'gemini-choice-only', allowModelFallback: true })
  assert.equal(enabled.body.allowModelFallback, true)
})

suite('disabling fallback during inference cancels the run and discards a late substituted result', async () => {
  await connect()
  await call('POST', '/api/coach/ask', { text: 'How was my training?' })
  let release, entered
  const ready = new Promise(resolve => { entered = resolve })
  const running = runCoachWork(db, { pipeline: async () => {
    entered()
    await new Promise(resolve => { release = resolve })
    return { ok: true, result: { answer: 'Late answer' } }
  } })
  await ready
  const saved = await call('POST', '/api/coach/settings', { provider: 'openai', model: 'test-model', allowModelFallback: false })
  assert.equal(saved.status, 200)
  release()
  await running
  const status = (await call('GET', '/api/coach/status')).body
  assert.equal(status.pending, null)
  assert.equal(status.last.errorClass, 'connection-changed')
  assert.equal((await call('GET', '/api/coach/settings')).body.allowModelFallback, false)
})

suite('Gemini short-answer settings and bounded transport timing reach the cloud job without logging secrets', async (t) => {
  const logged = []
  t.mock.method(console, 'info', (...args) => logged.push(args))
  await call('POST', '/api/coach/settings', { provider: 'gemini', model: 'gemini-3.8-flash', apiKey: 'latency-test-key' })
  await call('POST', '/api/coach/ask', { text: 'private-training-question' })
  await runCoachWork(db, { fetch: async (_url, init) => {
    const request = JSON.parse(init.body)
    assert.equal(request.generationConfig.maxOutputTokens, 4096)
    assert.equal(request.generationConfig.thinkingConfig.thinkingLevel, 'LOW')
    throw new DOMException('sensitive exception latency-test-key', 'AbortError')
  } })
  const status = (await call('GET', '/api/coach/status')).body
  assert.equal(status.last.errorClass, 'timeout')
  assert.equal(status.last.providerAttempts.length, 1)
  assert.equal(status.last.providerAttempts[0].outcome, 'timeout')
  assert.equal(typeof status.last.providerAttempts[0].elapsedMs, 'number')
  const diagnostics = JSON.stringify(logged)
  assert.ok(diagnostics.includes('Coach provider request started'))
  assert.ok(diagnostics.includes('Coach provider request finished'))
  assert.ok(!diagnostics.includes('latency-test-key'))
  assert.ok(!diagnostics.includes('private-training-question'))
  assert.ok(!diagnostics.includes('sensitive exception'))
})
