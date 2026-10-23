import crypto from 'node:crypto'
import { account, one } from './db.js'
import { fail } from './http.js'
const mac = (p, cfg) => crypto.createHmac('sha256', cfg.secret).update(p).digest('base64url')
export const cookieName = (cfg) =>
  cfg.origin.startsWith('https:') ? '__Host-ironlogsid' : 'ironlogsid'
export function token(u, cfg, kind = 'b', now = Date.now()) {
  const p = `${u.id}:${now + cfg.sessionDays * 86400000}:${u.sv || 0}:${kind}:${cfg.generation}`
  return p + '.' + mac(p, cfg)
}
export function decode(value, cfg, now = Date.now()) {
  if (typeof value !== 'string') return null
  const i = value.lastIndexOf('.'),
    p = value.slice(0, i),
    signature = value.slice(i + 1)
  const a = Buffer.from(signature),
    b = Buffer.from(mac(p, cfg))
  if (i < 0 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  const [id, exp, sv, kind, gen, ...rest] = p.split(':')
  if (
    rest.length ||
    gen !== cfg.generation ||
    !['b', 'c'].includes(kind) ||
    !Number.isSafeInteger(+exp) ||
    +exp <= now ||
    !Number.isSafeInteger(+sv)
  )
    return null
  return { id, exp: +exp, sv: +sv, kind }
}
export function cookie(u, cfg) {
  return `${cookieName(cfg)}=${token(u, cfg, 'c')}; Path=/; Max-Age=${cfg.sessionDays * 86400}; HttpOnly; SameSite=Lax${cfg.origin.startsWith('https:') ? '; Secure' : ''}`
}
export const clearCookie = (cfg) =>
  `${cookieName(cfg)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${cfg.origin.startsWith('https:') ? '; Secure' : ''}`
export async function session(req, db, cfg) {
  const cookies = (req.headers.cookie || '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.startsWith(cookieName(cfg) + '='))
  if (cookies.length > 1) return null
  const raw = cookies.length
    ? cookies[0].slice(cookieName(cfg).length + 1)
    : req.headers.authorization?.replace(/^Bearer /, '')
  const s = decode(raw, cfg)
  if (!s) return null
  const u = await account(db, s.id)
  if (!u || u.disabled || (u.sv || 0) !== s.sv) return null
  return { ...s, user: u, bearer: !cookies.length }
}
export const publicUser = (u) => ({ id: u.id, name: u.name, admin: !!u.admin, owner: !!u.owner })
export function requireUser(ctx) {
  if (!ctx.s) fail(401, 'not signed in')
  return ctx.s.user
}
export function requireAdmin(ctx, owner = false) {
  const u = requireUser(ctx)
  if (!u.admin || (owner && !u.owner)) fail(403, 'forbidden')
  return u
}
export async function throttle(db, key, max = 20, seconds = 600) {
  const r = await one(
    db,
    `insert into ironlog.limits(key,hits,expires) values($1,1,now()+$2 * interval '1 second')
    on conflict(key) do update set hits=case when ironlog.limits.expires < now() then 1 else ironlog.limits.hits+1 end,
    expires=case when ironlog.limits.expires < now() then excluded.expires else ironlog.limits.expires end returning hits,expires`,
    [key, seconds],
  )
  if (r.hits > max)
    fail(429, 'too many attempts, try again later', 'rate-limit', {
      retryAfter: Math.max(1, Math.ceil((new Date(r.expires) - Date.now()) / 1000)),
    })
}
export const digest = (value) => crypto.createHash('sha256').update(value).digest('hex')
export async function issue(db, purpose, data, ttl = 300000, uid = null) {
  const code = crypto.randomBytes(24).toString('base64url')
  await db.query(
    'insert into ironlog.tokens(hash,purpose,user_id,data,expires) values($1,$2,$3,$4,$5)',
    [digest(code), purpose, uid, data, new Date(Date.now() + ttl)],
  )
  return code
}
export async function consume(db, code, purpose) {
  if (typeof code !== 'string' || code.length > 300) return null
  return (
    (await one(
      db,
      'delete from ironlog.tokens where hash=$1 and purpose=$2 and expires>now() returning data,user_id',
      [digest(code), purpose],
    )) || null
  )
}

// Follow the same account -> token lock order as authenticated requests.
export async function consumeOwned(db, code, purpose) {
  if (typeof code !== 'string' || code.length > 300) return null
  const peek = await one(
    db,
    'select user_id from ironlog.tokens where hash=$1 and purpose=$2 and expires>now()',
    [digest(code), purpose],
  )
  if (!peek?.user_id) return null
  const user = await account(db, peek.user_id)
  const taken = await consume(db, code, purpose)
  return taken ? { ...taken, user } : null
}
