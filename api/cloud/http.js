export class HttpError extends Error {
  constructor(status, error, code, extra = {}) {
    super(error)
    Object.assign(this, { status, code, extra })
  }
}
export const fail = (status, error, code, extra) => {
  throw new HttpError(status, error, code, extra)
}
export const answer = (body, status = 200, headers = {}) => ({ status, body, headers })
export const text = (v) => (typeof v === 'string' ? v : '')
export const records = (v) =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) : []
export const generation = 'ironlog-cloud-1'
export function configuration(env = process.env) {
  const origin = new URL(env.ORIGIN || 'http://localhost:8080').origin
  const rpId = env.RP_ID || new URL(origin).hostname
  if (rpId !== new URL(origin).hostname) throw new Error('RP_ID must match ORIGIN hostname')
  // Explicit migration hosts only. Never derive an RP from an arbitrary request origin.
  const additionalOrigins = (env.IRONLOG_ADDITIONAL_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const url = new URL(value)
      if (url.protocol !== 'https:' || value !== url.origin)
        throw new Error('IRONLOG_ADDITIONAL_ORIGINS must contain exact HTTPS origins')
      return url.origin
    })
  const secret = env.IRONLOG_SESSION_SECRET
  if (!secret || secret.length < 32)
    throw new Error('A stable IRONLOG_SESSION_SECRET of at least 32 characters is required')
  return {
    origin,
    rpId,
    additionalOrigins: [...new Set(additionalOrigins)],
    secret,
    rpName: 'IronLog',
    sessionDays: 90,
    inviteOnly: true,
    passwordLogin: env.PASSWORD_LOGIN !== '0',
    allowGuest: true,
    generation,
  }
}
export function requestConfiguration(req, cfg) {
  // Host is matched exactly to operator-configured origins. Ignore Origin and forwarded
  // host headers: neither may choose a different relying party or broaden CORS.
  const host = typeof req.headers.host === 'string' ? req.headers.host.toLowerCase() : ''
  const origin = cfg.additionalOrigins?.find((value) => new URL(value).host === host)
  return origin ? { ...cfg, origin, rpId: new URL(origin).hostname } : cfg
}
export function cors(req, cfg) {
  const origin = req.headers.origin
  // Native shells and browsers accessing this exact instance. No arbitrary reflect-all.
  const allowed = [cfg.origin, 'capacitor://localhost', 'https://localhost', 'http://localhost']
  const h = { Vary: 'Origin', 'Cache-Control': 'no-store' }
  if (origin && allowed.includes(origin))
    Object.assign(h, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-IronLog-Generation',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    })
  return h
}
export function checkOrigin(req, cfg, bearerValid = false) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || bearerValid) return
  if (req.headers['sec-fetch-site'] === 'same-origin') return
  const o = req.headers.origin
  if (o === cfg.origin) return
  // Code redemption authenticates the native shell; ordinary cookie operations do not.
  const p = new URL(req.url, cfg.origin).pathname
  if (
    ['/api/pair/redeem'].includes(p) &&
    ['capacitor://localhost', 'https://localhost', 'http://localhost'].includes(o)
  )
    return
  fail(403, 'request must come from this IronLog instance', 'origin')
}
