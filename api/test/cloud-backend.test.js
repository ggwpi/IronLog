import { test, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { Database, one } from '../cloud/db.js'
import { configuration, generation } from '../cloud/http.js'
import { createApp } from '../cloud/app.js'
import { readProfile } from '../cloud/profiles.js'
import { work } from '../cloud/jobs.js'
import { digest } from '../cloud/session.js'
const url = process.env.IRONLOG_TEST_DATABASE_URL
const suite = url ? test : test.skip
const cfg = configuration({
  ORIGIN: 'https://ironlog.example',
  RP_ID: 'ironlog.example',
  IRONLOG_SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
})
let db, app
class TestStorage {
  files = new Map()
  exists = async (path) => this.files.has(path)
  uploadUrl = async (path) => ({
    signedUrl: 'https://test.supabase.co/storage/v1/object/upload/sign/' + path,
    path,
    token: 'test-only',
  })
  downloadUrl = async (path) => 'https://test.supabase.co/storage/v1/object/sign/' + path
  get = async (path, max) => {
    const b = this.files.get(path)
    if (!b || b.length > max) throw new Error('missing test object')
    return b
  }
  put = async (path, b) => {
    this.files.set(path, b)
  }
  remove = async (paths) => {
    for (const p of paths) this.files.delete(p)
  }
  removePrefix = async (prefix) => {
    for (const p of this.files.keys()) if (p.startsWith(prefix + '/')) this.files.delete(p)
  }
}
let storage
if (url) {
  before(async () => {
    db = new Database(url)
  })
  beforeEach(async () => {
    await db.pool.query(
      'truncate ironlog.accounts,ironlog.invites,ironlog.limits,ironlog.jobs,ironlog.audit cascade',
    )
    storage = new TestStorage()
    app = createApp({ database: db, storage, cfg, workerSecret: 'test-worker-secret' })
  })
  after(async () => {
    await db.close()
  })
}
const call = (method, path, body, cookie, headers = {}) =>
  app.handle({
    method,
    url: path,
    body,
    headers: {
      origin: cfg.origin,
      'x-ironlog-generation': generation,
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    socket: { remoteAddress: '127.0.0.1' },
  })
async function invite(code = 'TEST-INVITE', bootstrap = false) {
  await db.transaction((c) =>
    c.query('insert into ironlog.invites(code,data) values($1,$2)', [
      code,
      { code, bootstrap, created: new Date().toISOString() },
    ]),
  )
  return code
}
async function signup(name = 'Tester', code = 'TEST-INVITE') {
  const r = await call('POST', '/api/register/password', {
    name,
    password: 'correct horse battery staple',
    code,
  })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  return { user: r.body.user, cookie: r.headers['Set-Cookie'].split(';')[0] }
}
const state = (n = 'A') => ({
  routines: [{ id: n, name: n, ex: [] }],
  workouts: [],
  bodyweight: [],
  unit: 'kg',
  _ts: Date.now(),
})
suite('invite-only registration, explicit owner bootstrap, login and isolation', async () => {
  let r = await call('POST', '/api/register/password', {
    name: 'Blocked',
    password: 'correct horse battery staple',
    code: 'WRONG',
  })
  assert.equal(r.status, 403)
  await invite()
  const a = await signup()
  assert.equal(a.user.admin, false)
  await invite('OWNER', true)
  const owner = await signup('Owner', 'OWNER')
  assert.equal(owner.user.owner, true)
  assert.equal((await call('GET', '/api/admin/users', undefined, a.cookie)).status, 403)
  assert.equal(
    (await call('GET', '/api/admin/users', undefined, owner.cookie)).body.users.length,
    2,
  )
  assert.equal(
    (await call('POST', '/api/login/password', { name: 'Tester', password: 'incorrect' })).status,
    401,
  )
  assert.equal(
    (
      await call('POST', '/api/login/password', {
        name: 'Tester',
        password: 'correct horse battery staple',
      })
    ).status,
    200,
  )
  assert.equal(
    (
      await call('POST', '/api/register/password', {
        name: 'Again',
        password: 'correct horse battery staple',
        code: 'TEST-INVITE',
      })
    ).status,
    403,
  )
})
suite('two devices cannot overwrite a revision they never read; active stays local', async () => {
  await invite()
  const a = await signup()
  const input = state()
  input.active = { sets: ['private ongoing session'] }
  const results = await Promise.all([
    call('PUT', '/api/data', { state: input, baseRev: 0, stamped: true }, a.cookie),
    call('PUT', '/api/data', { state: state('B'), baseRev: 0, stamped: true }, a.cookie),
  ])
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409])
  const conflict = results.find((r) => r.status === 409)
  assert.equal(conflict.body.state.routines.length, 1)
  const get = await call('GET', '/api/data', undefined, a.cookie)
  assert.ok(get.body.rev >= 1)
  assert.equal(get.body.state.active, undefined)
  assert.equal(
    (await call('GET', '/api/data/rev', undefined, a.cookie)).body.wid,
    get.body.state._wid,
  )
  assert.equal(
    (
      await call(
        'PUT',
        '/api/data',
        { state: state(), baseRev: get.body.rev, baseWid: 'wrong' },
        a.cookie,
      )
    ).status,
    409,
  )
  await invite('SECOND')
  const b = await signup('Other', 'SECOND')
  assert.equal((await call('GET', '/api/data', undefined, b.cookie)).body.state, null)
})
suite('pairing is one-shot across independent app instances and revoked everywhere', async () => {
  await invite()
  const a = await signup()
  const pair = await call('POST', '/api/pair/create', {}, a.cookie)
  const app2 = createApp({ database: db, storage, cfg })
  const req = {
    method: 'POST',
    url: '/api/pair/redeem',
    body: { code: pair.body.code },
    headers: { origin: 'capacitor://localhost', 'x-ironlog-generation': generation },
    socket: { remoteAddress: '127.0.0.1' },
  }
  const rs = await Promise.all([app.handle(req), app2.handle(req)])
  assert.deepEqual(rs.map((r) => r.status).sort(), [200, 400])
  const bearer = rs.find((r) => r.status === 200).body.token
  assert.equal(
    (await call('GET', '/api/me', undefined, null, { authorization: 'Bearer ' + bearer })).status,
    200,
  )
  await call('POST', '/api/logout/all', {}, a.cookie)
  assert.equal(
    (await call('GET', '/api/me', undefined, null, { authorization: 'Bearer ' + bearer })).status,
    401,
  )
  assert.equal((await call('GET', '/api/me', undefined, a.cookie)).status, 401)
})
suite('origin, generation and duplicate-cookie checks reject unsafe requests', async () => {
  await invite()
  const a = await signup()
  assert.equal(
    (await call('POST', '/api/logout', {}, a.cookie, { origin: 'https://evil.example' })).status,
    403,
  )
  assert.equal(
    (
      await call('PUT', '/api/data', { state: state() }, a.cookie, {
        'x-ironlog-generation': 'old',
      })
    ).status,
    409,
  )
  assert.equal((await call('GET', '/api/me', undefined, a.cookie + '; ' + a.cookie)).status, 401)
  assert.equal((await call('GET', '/api/not-real', undefined, a.cookie)).status, 404)
  const unauth = await call('GET', '/api/config')
  assert.equal(unauth.body.invite_only, true)
  assert.equal(unauth.body.coach, undefined)
  assert.equal((await call('GET', '/api/config', undefined, a.cookie)).body.coach, null)
})
suite('failed attempts remain persisted and throttled instead of rolling back', async () => {
  for (let i = 0; i < 10; i++)
    assert.equal(
      (await call('POST', '/api/login/password', { name: 'Nobody', password: 'wrong' })).status,
      401,
    )
  assert.equal(
    (await call('POST', '/api/login/password', { name: 'Nobody', password: 'wrong' })).status,
    429,
  )
  const r = await db.transaction((c) =>
    one(c, 'select hits from ironlog.limits where key=$1', ['password:' + digest('nobody')]),
  )
  assert.equal(r.hits, 11)
})
suite('uploads are private, hash-validated and retained after validation failure', async () => {
  await invite()
  const a = await signup()
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3, 4]),
    hash = crypto.createHash('sha256').update(bytes).digest('hex')
  const start = await call(
    'POST',
    '/api/media/upload',
    { hash, mime: 'image/jpeg', size: bytes.length },
    a.cookie,
  )
  assert.equal(start.status, 200)
  storage.files.set(start.body.path, bytes)
  const done = await call('POST', '/api/media/complete', { id: start.body.id }, a.cookie)
  assert.equal(done.status, 200, JSON.stringify(done.body))
  assert.equal(done.body.usage.bytes, bytes.length)
  assert.equal(
    (await call('POST', '/api/media/missing', { hashes: [hash] }, a.cookie)).body.missing.length,
    0,
  )
  const get = await call('GET', '/api/media/' + hash, undefined, a.cookie)
  assert.equal(get.body.size, bytes.length)
  await invite('SECOND')
  const b = await signup('Other', 'SECOND')
  assert.equal((await call('GET', '/api/media/' + hash, undefined, b.cookie)).status, 404)
  assert.equal(
    (await call('POST', '/api/media/complete', { id: start.body.id }, b.cookie)).status,
    404,
  )
  const bad = await call(
    'POST',
    '/api/media/upload',
    { hash: 'a'.repeat(64), mime: 'image/jpeg', size: bytes.length },
    a.cookie,
  )
  storage.files.set(bad.body.path, bytes)
  assert.equal(
    (await call('POST', '/api/media/complete', { id: bad.body.id }, a.cookie)).body.code,
    'hash-mismatch',
  )
  assert.equal(
    (await call('POST', '/api/media/missing', { hashes: ['a'.repeat(64)] }, a.cookie)).body.missing
      .length,
    1,
  )
})
suite('large snapshots use the same sync validation and conflicts as normal writes', async () => {
  await invite()
  const a = await signup()
  const s = state()
  s.dayNotes = { '2026-10-23': { text: 'x'.repeat(3500000), at: Date.now() } }
  const bytes = Buffer.from(JSON.stringify({ state: s, baseRev: 0, stamped: true }))
  const start = await call('POST', '/api/data/upload', { size: bytes.length }, a.cookie)
  assert.equal(start.status, 200)
  storage.files.set(start.body.path, bytes)
  assert.equal(
    (await call('POST', '/api/data/commit', { id: start.body.id }, a.cookie)).status,
    200,
  )
  const get = await call('GET', '/api/data', undefined, a.cookie)
  assert.ok(get.body.snapshot)
  assert.ok(get.body.snapshot.size > 3000000)
  assert.equal(
    (await db.transaction((c) => readProfile(c, a.user.id))).dayNotes['2026-10-23'].text.length,
    3500000,
  )
})
suite(
  'account deletion cascades data and credentials, retains durable storage cleanup',
  async () => {
    await invite()
    const a = await signup()
    await call('PUT', '/api/data', { state: state(), baseRev: 0 }, a.cookie)
    storage.files.set('media/' + a.user.id + '/test.jpg', Buffer.from('test'))
    const r = await call(
      'POST',
      '/api/account/delete',
      { name: 'Tester', current: 'correct horse battery staple' },
      a.cookie,
    )
    assert.equal(r.status, 200, JSON.stringify(r.body))
    assert.equal((await call('GET', '/api/me', undefined, a.cookie)).status, 401)
    assert.equal(
      (await db.transaction((c) => one(c, 'select count(*)::int as n from ironlog.profiles'))).n,
      0,
    )
    await work(db, storage)
    assert.equal(storage.files.size, 0)
  },
)
suite('scheduled timers survive app instances and cancel by device', async () => {
  await invite()
  const a = await signup()
  for (const d of ['device-one', 'device-two'])
    assert.equal(
      (await call('POST', '/api/push/rest-timer', { seconds: 120, deviceId: d }, a.cookie)).status,
      200,
    )
  assert.equal(
    (
      await db.transaction((c) =>
        one(c, "select count(*)::int as n from ironlog.jobs where kind='push'"),
      )
    ).n,
    2,
  )
  await call('POST', '/api/push/rest-timer/cancel', { deviceId: 'device-one' }, a.cookie)
  assert.equal(
    (
      await db.transaction((c) =>
        one(c, "select count(*)::int as n from ironlog.jobs where kind='push'"),
      )
    ).n,
    1,
  )
})

suite(
  'software passkeys register, authenticate, step up, and enforce the last-way-in rule',
  async () => {
    const { softPasskey } = await import('./cloud-authenticator.mjs')
    await invite()
    const pk = softPasskey()
    const options = await call('POST', '/api/register/options', {
      name: 'Passkey Owner',
      code: 'TEST-INVITE',
    })
    const registered = await call('POST', '/api/register/verify', {
      cid: options.body.cid,
      credential: pk.attestation(options.body.options.challenge),
    })
    assert.equal(registered.status, 200, JSON.stringify(registered.body))
    const cookie = registered.headers['Set-Cookie'].split(';')[0]
    const login = await call('POST', '/api/login/options', {})
    const credential = pk.assertion(login.body.options.challenge)
    assert.equal(
      (await call('POST', '/api/login/verify', { cid: login.body.cid, credential })).status,
      200,
    )
    assert.equal(
      (await call('POST', '/api/login/verify', { cid: login.body.cid, credential })).status,
      400,
    )
    const list = await call('GET', '/api/account/passkeys', undefined, cookie)
    assert.equal(list.body.lastWayIn, true)
    assert.equal(
      (await call('DELETE', '/api/account/passkeys?id=' + encodeURIComponent(pk.id), {}, cookie))
        .body.code,
      'last-way-in',
    )
    const proof = await call('POST', '/api/login/options', {})
    const addOptions = await call(
      'POST',
      '/api/account/passkeys/options',
      { cid: proof.body.cid, credential: pk.assertion(proof.body.options.challenge) },
      cookie,
    )
    const second = softPasskey()
    const added = await call(
      'POST',
      '/api/account/passkeys/verify',
      {
        cid: addOptions.body.cid,
        credential: second.attestation(addOptions.body.options.challenge),
      },
      cookie,
    )
    assert.equal(added.status, 200, JSON.stringify(added.body))
    assert.equal(added.body.passkeys.length, 2)
    const proof2 = await call('POST', '/api/login/options', {})
    const removed = await call(
      'DELETE',
      '/api/account/passkeys?id=' + encodeURIComponent(pk.id),
      { cid: proof2.body.cid, credential: second.assertion(proof2.body.options.challenge) },
      cookie,
    )
    assert.equal(removed.status, 200, JSON.stringify(removed.body))
    assert.equal(removed.body.passkeys.length, 1)
  },
)
suite(
  'device-link ceremonies preserve identity and require the code at final verification',
  async () => {
    const { softPasskey } = await import('./cloud-authenticator.mjs')
    await invite()
    const a = await signup()
    const link = await call(
      'POST',
      '/api/account/device-link',
      { current: 'correct horse battery staple' },
      a.cookie,
    )
    const opts = await call('POST', '/api/device-link/options', { code: link.body.code })
    assert.equal(opts.body.id, a.user.id)
    assert.equal(opts.body.name, a.user.name)
    const pk = softPasskey()
    const verified = await call('POST', '/api/device-link/verify', {
      code: link.body.code,
      cid: opts.body.cid,
      credential: pk.attestation(opts.body.options.challenge),
    })
    assert.equal(verified.status, 200, JSON.stringify(verified.body))
    assert.equal(verified.body.user.id, a.user.id)
    assert.equal(
      (await call('POST', '/api/device-link/options', { code: link.body.code })).status,
      400,
    )
  },
)
suite(
  'username/email share a normalized identity namespace and password errors match the UI',
  async () => {
    await invite()
    const a = await signup('Ａｌｉｃｅ')
    assert.equal(
      (
        await call('POST', '/api/login/password', {
          name: 'alice',
          password: 'correct horse battery staple',
        })
      ).status,
      200,
    )
    await invite('SECOND')
    assert.equal(
      (
        await call('POST', '/api/register/password', {
          name: 'Other',
          email: 'alice@example.com',
          password: 'short',
          code: 'SECOND',
        })
      ).body.code,
      'too-short',
    )
    const email = await call(
      'POST',
      '/api/account/email',
      { email: 'alice@example.com', current: 'correct horse battery staple' },
      a.cookie,
    )
    assert.equal(email.status, 200)
    const clash = await call('POST', '/api/register/password', {
      name: 'alice@example.com',
      password: 'correct horse battery staple',
      code: 'SECOND',
    })
    assert.equal(clash.status, 409)
  },
)
suite(
  'large conflict responses use private snapshots instead of exceeding the function response cap',
  async () => {
    await invite()
    const a = await signup()
    const s = state()
    s.extra = 'x'.repeat(3500000)
    const buf = Buffer.from(JSON.stringify({ state: s, baseRev: 0, stamped: true })),
      start = await call('POST', '/api/data/upload', { size: buf.length }, a.cookie)
    storage.files.set(start.body.path, buf)
    assert.equal(
      (await call('POST', '/api/data/commit', { id: start.body.id }, a.cookie)).status,
      200,
    )
    const clash = await call('PUT', '/api/data', { state: state('conflict'), baseRev: 0 }, a.cookie)
    assert.equal(clash.status, 409)
    assert.ok(clash.body.snapshot)
    assert.equal(clash.body.state, undefined)
  },
)
suite('admin reset revokes sessions and resets can only be redeemed once', async () => {
  await invite('OWNER', true)
  const owner = await signup('Owner', 'OWNER')
  await invite()
  const a = await signup()
  const reset = await call(
    'POST',
    '/api/admin/user/password-reset',
    { id: a.user.id },
    owner.cookie,
  )
  assert.equal(reset.status, 200)
  assert.equal((await call('GET', '/api/me', undefined, a.cookie)).status, 401)
  const redeemed = await call('POST', '/api/login/password-reset', {
    name: 'Tester',
    code: reset.body.code,
    next: 'an entirely new password phrase',
  })
  assert.equal(redeemed.status, 200, JSON.stringify(redeemed.body))
  assert.equal(
    (
      await call('POST', '/api/login/password-reset', {
        name: 'Tester',
        code: reset.body.code,
        next: 'an entirely new password phrase',
      })
    ).status,
    400,
  )
})
suite(
  'reminder scheduling uses the upstream calendar rule and persists one daily job',
  async () => {
    await invite()
    const a = await signup()
    const now = new Date(),
      date = now.toISOString().slice(0, 10),
      weekday = new Date(date + 'T12:00:00Z').getUTCDay()
    const s = state('scheduled')
    s.week = { [weekday]: 'scheduled' }
    s.reminder = { on: true, time: now.toISOString().slice(11, 16), tz: 'UTC' }
    assert.equal(
      (await call('PUT', '/api/data', { state: s, baseRev: 0, stamped: true }, a.cookie)).status,
      200,
    )
    await db.transaction((c) =>
      c.query('insert into ironlog.subscriptions(endpoint_hash,user_id,data) values($1,$2,$3)', [
        'fake-for-scheduling-only',
        a.user.id,
        { endpoint: 'https://example.com/not-delivered', keys: { auth: 'test', p256dh: 'test' } },
      ]),
    )
    await db.transaction((c) =>
      c.query(
        "insert into ironlog.jobs(id,kind,payload,due_at) values('reminders','reminders','{}',now())",
      ),
    )
    await work(db, storage, { max: 1 })
    const push = await db.transaction((c) =>
      one(c, 'select payload from ironlog.jobs where id=$1', [`reminder:${a.user.id}:${date}`]),
    )
    assert.equal(push.payload.userId, a.user.id)
    assert.match(push.payload.push.title, /scheduled/)
    assert.equal(
      (
        await db.transaction((c) =>
          one(c, 'select data from ironlog.accounts where id=$1', [a.user.id]),
        )
      ).data.lastReminder,
      date,
    )
  },
)
suite('browser SQL roles cannot read the private account schema', async () => {
  // Stock-Postgres fixture of Supabase's public browser roles.
  await db.pool.query(
    "do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin;end if;end $$",
  )
  const c = await db.pool.connect()
  try {
    await c.query('begin')
    await c.query('set local role anon')
    await assert.rejects(c.query('select * from ironlog.accounts'), (e) => e.code === '42501')
  } finally {
    await c.query('rollback')
    c.release()
  }
})
suite(
  'inventoried route coverage includes every non-Coach upstream endpoint or an explicit negotiated replacement',
  async () => {
    const fs = await import('node:fs/promises'),
      s = await fs.readFile(new URL('../server.js', import.meta.url), 'utf8')
    const originals = [...s.matchAll(/'((?:GET|POST|PUT|DELETE) \/api\/[^']+)':/g)].map((m) => m[1])
    const central = new Set(['GET /api/config', 'GET /api/health'])
    const negotiated = {
      'PUT /api/media/{hash}': ['POST /api/media/upload', 'POST /api/media/complete'],
    }
    for (const route of originals)
      assert.ok(
        app.routes[route] || central.has(route) || negotiated[route]?.every((x) => app.routes[x]),
        route,
      )
  },
)

suite(
  'interrupted uploads resume the same reservation and already-completed hashes need no reupload',
  async () => {
    await invite()
    const a = await signup(),
      bytes = Buffer.from([0xff, 0xd8, 0xff, 1, 2]),
      hash = crypto.createHash('sha256').update(bytes).digest('hex')
    const request = { hash, mime: 'image/jpeg', size: bytes.length }
    const first = await call('POST', '/api/media/upload', request, a.cookie)
    const retry = await call('POST', '/api/media/upload', request, a.cookie)
    assert.equal(retry.body.id, first.body.id)
    storage.files.set(first.body.path, bytes)
    const uploaded = await call('POST', '/api/media/upload', request, a.cookie)
    assert.equal(uploaded.body.uploaded, true)
    assert.equal(uploaded.body.id, first.body.id)
    assert.equal(
      (await call('POST', '/api/media/complete', { id: first.body.id }, a.cookie)).status,
      200,
    )
    assert.equal((await call('POST', '/api/media/upload', request, a.cookie)).body.existed, true)
  },
)
