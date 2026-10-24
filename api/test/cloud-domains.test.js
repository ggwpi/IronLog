import { test } from 'node:test'
import assert from 'node:assert/strict'
import { configuration, requestConfiguration, generation } from '../cloud/http.js'
import { createApp } from '../cloud/app.js'
import { cookie } from '../cloud/session.js'

const primary = 'https://new.example'
const previous = 'https://old.example'
const env = {
  ORIGIN: primary,
  RP_ID: 'new.example',
  IRONLOG_ADDITIONAL_ORIGINS: previous,
  IRONLOG_SESSION_SECRET: 'test-only-domain-secret-32-characters',
}
const cfg = configuration(env)
const req = (host, origin = 'https://' + host, extra = {}) => ({
  method: 'POST',
  url: '/api/login/options',
  body: {},
  headers: { host, origin, 'x-ironlog-generation': generation, ...extra },
})

// Exercise real route dispatch, CSRF, CORS and WebAuthn options without production data.
const database = {
  transaction: async (run) => run({
    query: async (sql) => {
      if (sql.includes('ironlog.settings')) return { rows: [{ value: generation }] }
      if (sql.includes('ironlog.limits'))
        return { rows: [{ hits: 1, expires: new Date(Date.now() + 60000) }] }
      if (sql.includes('insert into ironlog.tokens')) return { rows: [] }
      throw new Error('Unexpected test query: ' + sql)
    },
  }),
}

test('primary and legacy domains each advertise their own WebAuthn RP and CORS origin', async () => {
  const app = createApp({ database, storage: {}, cfg })
  for (const [host, origin] of [['new.example', primary], ['old.example', previous]]) {
    const r = await app.handle(req(host))
    assert.equal(r.status, 200)
    assert.equal(r.body.options.rpId, host)
    assert.equal(r.headers['Access-Control-Allow-Origin'], origin)
    assert.ok(r.body.cid)
  }
  assert.equal(cfg.origin, primary, 'request selection must not mutate shared configuration')
  assert.equal(cfg.rpId, 'new.example')
})

test('Origin, forwarded hosts, suffix matches and unknown hosts cannot choose a legacy RP', async () => {
  for (const headers of [
    { host: 'new.example', origin: previous },
    { host: 'unknown.example', origin: previous },
    { host: 'old.example.attacker.test' },
    { host: 'old.example:444' },
    { host: 'new.example', 'x-forwarded-host': 'old.example' },
    { host: 'new.example', forwarded: 'host=old.example' },
    {},
  ]) {
    assert.equal(requestConfiguration({ headers }, cfg).origin, primary)
  }
  const app = createApp({ database, storage: {}, cfg })
  const denied = await app.handle(req('new.example', previous))
  assert.equal(denied.status, 403)
  assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined)
  const legacyDenied = await app.handle(req('old.example', primary))
  assert.equal(legacyDenied.status, 403)
})

test('migration keeps session cookies secure and host-only on both domains', () => {
  const old = requestConfiguration(req('old.example'), cfg)
  for (const c of [cfg, old]) {
    const value = cookie({ id: 'test-user', sv: 0 }, c)
    assert.match(value, /^__Host-ironlogsid=/)
    assert.match(value, /; Secure$/)
    assert.match(value, /; HttpOnly;/)
    assert.doesNotMatch(value, /Domain=/i)
  }
})

test('legacy origins require exact HTTPS origins; one-domain installs remain unchanged', () => {
  for (const value of ['http://old.example', 'https://old.example/path', 'https://old.example/',
    'https://user:pass@old.example', 'https://old.example?x=1', 'https://old.example#x']) {
    assert.throws(() => configuration({ ...env, IRONLOG_ADDITIONAL_ORIGINS: value }))
  }
  const single = configuration({ ...env, IRONLOG_ADDITIONAL_ORIGINS: '' })
  assert.equal(requestConfiguration(req('old.example'), single), single)
  assert.throws(() => configuration({ ...env, RP_ID: 'mismatch.example' }))
})
