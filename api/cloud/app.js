import crypto from 'node:crypto'
import { Database, audit, one } from './db.js'
import { Storage, storageRoutes, storageConfig, snapshotEnvelope } from './storage.js'
import { authRoutes } from './auth.js'
import { profileRoutes } from './profiles.js'
import { adminRoutes } from './admin.js'
import { pushRoutes } from './push.js'
import { session, throttle, digest } from './session.js'
import { configuration, requestConfiguration, HttpError, answer, fail, cors, checkOrigin, generation } from './http.js'
import { work } from './jobs.js'
import { coachRoutes, coachConfig, runCoachWork, scanCoachCadence } from './coach.js'
const bytes = 4 * 1024 * 1024
const address = (req) =>
  String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown').slice(0, 100)
async function bodyOf(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return {}
  if (req.body !== undefined) {
    const s = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    if (Buffer.byteLength(s) > bytes) fail(413, 'request too large')
    try {
      return JSON.parse(s)
    } catch {
      fail(400, 'invalid JSON')
    }
  }
  let n = 0
  const parts = []
  for await (const p of req) {
    n += p.length
    if (n > bytes) fail(413, 'request too large')
    parts.push(p)
  }
  try {
    return n ? JSON.parse(Buffer.concat(parts).toString('utf8')) : {}
  } catch {
    fail(400, 'invalid JSON')
  }
}
function errorAnswer(e) {
  if (e instanceof HttpError)
    return answer(
      { error: e.message, ...(e.code ? { code: e.code } : {}), ...e.extra },
      e.status,
      e.status === 429 ? { 'Retry-After': String(e.extra.retryAfter || 60) } : {},
    )
  if (e.code === '23505')
    return answer(
      { error: 'name, email or credential already registered', code: 'name-taken' },
      409,
    )
  if (e.code === '40P01' || e.code === '40001')
    return answer({ error: 'please retry this request', code: 'retry' }, 503)
  console.error('IronLog request failed', { code: e.code || 'operation-failed' })
  return answer({ error: 'service temporarily unavailable', code: 'unavailable' }, 503)
}
export function createApp({
  database,
  storage,
  cfg: baseCfg = configuration(),
  workerSecret = process.env.IRONLOG_WORKER_SECRET,
  coachFetch,
} = {}) {
  database ||= new Database()
  storage ||= new Storage()
  const routes = {
    ...authRoutes,
    ...profileRoutes,
    ...adminRoutes,
    ...storageRoutes,
    ...pushRoutes,
    ...coachRoutes,
  }
  async function handle(req) {
    const cfg = requestConfiguration(req, baseCfg)
    let url
    try {
      url = new URL(req.url, cfg.origin)
    } catch {
      return answer({ error: 'bad request' }, 400)
    }
    if (req.url.split('?')[0] !== url.pathname) return answer({ error: 'bad request' }, 400)
    if (req.method === 'OPTIONS') return answer(null, 204, cors(req, cfg))
    if (req.method === 'POST' && url.pathname === '/api/internal/worker') {
      const provided = Buffer.from(req.headers.authorization || ''),
        expected = Buffer.from('Bearer ' + workerSecret)
      if (
        !workerSecret ||
        provided.length !== expected.length ||
        !crypto.timingSafeEqual(provided, expected)
      )
        return answer({ error: 'forbidden' }, 403)
      try {
        return answer(await work(database, storage))
      } catch (e) {
        return errorAnswer(e)
      }
    }
    try {
      const body = await bodyOf(req)
      if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'invalid JSON object')
      let key = req.method + ' ' + url.pathname,
        params = {}
      const media = /^\/api\/media\/([0-9a-f]{64})$/.exec(url.pathname)
      if (media) {
        key = req.method + ' /api/media/{hash}'
        params.hash = media[1]
      }
      let result = await database.transaction(async (db) => {
        // Known failures are returned inside the transaction so attempts and spent
        // one-time codes COMMIT, instead of resetting the security limit on every failure.
        let ctx
        try {
          const stored = await one(db, "select value from ironlog.settings where key='generation'")
          if (stored?.value !== generation)
            fail(503, 'backend generation is not configured', 'generation')
          if (key === 'GET /api/health') return answer({ ok: true, writable: true })
          const s = await session(req, db, cfg)
          checkOrigin(req, cfg, !!s?.bearer)
          if (key === 'GET /api/config')
            return answer({
              invite_only: true,
              allow_guest: true,
              password_login: cfg.passwordLogin,
              default_lang: process.env.DEFAULT_LANG || 'en',
              generation,
              media: storageConfig(),
              transport: { snapshots: 'signed-v1' },
              ...(s ? { coach: await coachConfig(db, s.user.id) } : {}),
            })
          if (req.headers['x-ironlog-generation'] !== generation)
            fail(409, 'update IronLog before continuing', 'generation-mismatch')
          if (!s) await throttle(db, 'unauth:' + digest(address(req)), 60, 60)
          const handler = routes[key]
          if (!handler || (!cfg.passwordLogin && /password|account\/email/.test(key)))
            fail(404, 'not found')
          ctx = { req, url, body, s, db, cfg, storage, params, coachFetch }
          // Upstream DELETE passkey identifies the key through the query string.
          if (key === 'DELETE /api/account/passkeys')
            ctx.body = { ...body, id: url.searchParams.get('id') || body.id }
          const r = await handler(ctx)
          if (
            key === 'GET /api/data' &&
            Buffer.byteLength(JSON.stringify(r.body)) > 3 * 1024 * 1024
          )
            return answer({ snapshot: (await storageRoutes['GET /api/data/snapshot'](ctx)).body })
          return r
        } catch (e) {
          if (!(e instanceof HttpError)) throw e
          const r = errorAnswer(e)
          if (ctx?.s && Buffer.byteLength(JSON.stringify(r.body)) > 3 * 1024 * 1024) {
            const { state, ...rest } = r.body
            return answer(
              { ...rest, snapshot: await snapshotEnvelope(ctx, { state }) },
              r.status,
              r.headers,
            )
          }
          return r
        }
      })
      if (result.outside) result = await result.outside()
      return { ...result, headers: { ...cors(req, cfg), ...result.headers } }
    } catch (e) {
      return { ...errorAnswer(e), headers: cors(req, cfg) }
    }
  }
  return { handle, routes, database, runCoach: async () => { await scanCoachCadence(database); return runCoachWork(database) } }
}
export function nodeHandler(app) {
  return async (req, res) => {
    let r
    try {
      r = await app.handle(req)
    } catch (e) {
      r = errorAnswer(e)
    }
    res.writeHead(r.status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...r.headers,
    })
    res.end(r.body === null ? '' : JSON.stringify(r.body))
  }
}
