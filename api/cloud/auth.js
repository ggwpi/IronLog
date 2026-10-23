import crypto from 'node:crypto'
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import {
  hashPassword,
  verifyPassword,
  passwordProblem,
  passwordLength,
  MAX_LENGTH,
  nameKey,
  normalizeEmail,
  makeResetCode,
  hashResetCode,
  resetCodeMatches,
  RESET_TTL_MS,
} from '../password.js'
import { MAX_PASSKEYS, listPasskeys, passkeyName, transportsOf } from '../passkeys-store.js'
import { makeLinkCode, hashLinkCode } from '../device-link.js'
import { account, putAccount, credentials, putCredential, one, rows, audit } from './db.js'
import {
  cookie,
  token,
  publicUser,
  requireUser,
  requireAdmin,
  clearCookie,
  issue,
  consume,
  consumeOwned,
  throttle,
  digest,
} from './session.js'
import { answer, fail, text } from './http.js'
const uid = () => crypto.randomBytes(12).toString('base64url')
const now = () => new Date().toISOString()
const normalizeCode = (v) => text(v).trim().toUpperCase()
const wayIn = (u) => !!u.pw?.h
export async function invalidate(db, u) {
  u.sv = (u.sv || 0) + 1
  await putAccount(db, u)
  await db.query('delete from ironlog.tokens where user_id=$1', [u.id])
  await db.query('delete from ironlog.presence where user_id=$1', [u.id])
}
async function identity(db, value) {
  const k = nameKey(value)
  return (
    await one(
      db,
      `select a.data from ironlog.accounts a join ironlog.identities i on i.user_id=a.id where i.key=$1 for update of a`,
      [k],
    )
  )?.data
}
async function nameAvailable(db, name, email, except = '') {
  // One namespace for usernames and sign-in email addresses.
  const keys = [nameKey(name), email].filter(Boolean)
  if (
    await one(
      db,
      `select id from ironlog.accounts where id<>$2 and (name_key=any($1::text[]) or email_key=any($1::text[]))`,
      [keys, except],
    )
  )
    fail(409, 'another profile already signs in with this name or email', 'name-taken')
}
async function invite(db, code, lock = false) {
  const r = await one(
    db,
    `select data from ironlog.invites where code=$1 ${lock ? 'for update' : ''}`,
    [normalizeCode(code)],
  )
  if (!r || r.data.usedBy || r.data.revoked) fail(403, 'a valid invite code is required', 'invite')
  return r.data
}
async function register(db, u, code, cred) {
  // Serialize identity claims, not all account traffic. Indexes still enforce collisions.
  await db.query("select pg_advisory_xact_lock(hashtextextended('ironlog-registration',0))")
  const inv = await invite(db, code, true)
  await nameAvailable(db, u.name, u.email)
  if (cred && (await one(db, 'select id from ironlog.credentials where id=$1', [cred.id])))
    fail(409, 'credential already registered', 'credential-exists')
  u.invitedBy = inv.code
  // Only the explicitly-created bootstrap invitation can appoint the initial owner.
  if (
    inv.bootstrap &&
    !(await one(db, "select id from ironlog.accounts where data->>'owner'='true'"))
  ) {
    u.owner = true
    u.admin = true
  }
  await putAccount(db, u)
  if (cred)
    await putCredential(db, { ...cred, userId: u.id, created: u.created, lastUsed: u.created })
  inv.usedBy = u.id
  inv.usedAt = u.created
  await db.query('update ironlog.invites set data=$2 where code=$1', [inv.code, inv])
  await audit(db, 'auth.register.ok', u)
}
const signedIn = (u, cfg, extra = {}) =>
  answer({ user: publicUser(u), ...extra }, 200, { 'Set-Cookie': cookie(u, cfg) })
function validPassword(pw, name) {
  const p = passwordProblem(pw, name)
  if (p) fail(400, 'password does not meet the requirements', p)
}
async function registrationOptions(cfg, u, exclude = []) {
  return generateRegistrationOptions({
    rpName: cfg.rpName,
    rpID: cfg.rpId,
    userID: Buffer.from(u.id),
    userName: u.name,
    userDisplayName: u.name,
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
    excludeCredentials: exclude.map((c) => ({ id: c.id, transports: c.transports })),
  })
}
async function verifyNew(cfg, c, body) {
  let v
  try {
    v = await verifyRegistrationResponse({
      response: body.credential,
      expectedChallenge: c.challenge,
      expectedOrigin: cfg.origin,
      expectedRPID: cfg.rpId,
      requireUserVerification: false,
    })
  } catch {
    fail(400, 'passkey verification failed', 'passkey')
  }
  if (!v.verified) fail(400, 'not verified', 'passkey')
  const r = v.registrationInfo.credential
  return {
    id: r.id,
    publicKey: Buffer.from(r.publicKey).toString('base64url'),
    counter: r.counter || 0,
    transports: transportsOf(body.credential?.response?.transports),
    name: passkeyName(body.name),
  }
}
async function assertion(db, cfg, body, owner) {
  const id = text(body.credential?.id)
  const first = await one(db, 'select user_id from ironlog.credentials where id=$1', [id])
  if (!first)
    fail(
      owner ? 403 : 404,
      owner ? 'the passkey could not be verified' : 'unknown passkey, create a profile first',
      owner ? 'passkey' : 'unknown-credential',
    )
  if (owner && first.user_id !== owner.id) fail(403, 'the passkey could not be verified', 'passkey')
  const u = owner || (await account(db, first.user_id))
  if (!u || u.disabled) fail(403, 'account unavailable', 'disabled')
  const taken = await consume(db, body.cid, 'challenge'),
    c = taken?.data
  if (c?.kind !== 'login') fail(400, 'challenge expired, try again', 'challenge-expired')
  const r = await one(db, 'select data from ironlog.credentials where id=$1 and user_id=$2', [
    id,
    u.id,
  ])
  if (!r) fail(403, 'the passkey could not be verified', 'passkey')
  const cred = r.data
  let v
  try {
    v = await verifyAuthenticationResponse({
      response: body.credential,
      expectedChallenge: c.challenge,
      expectedOrigin: cfg.origin,
      expectedRPID: cfg.rpId,
      requireUserVerification: false,
      credential: {
        id: cred.id,
        publicKey: Buffer.from(cred.publicKey, 'base64url'),
        counter: cred.counter,
        transports: cred.transports,
      },
    })
  } catch {
    fail(403, 'the passkey could not be verified', 'passkey')
  }
  if (!v.verified) fail(403, 'not verified', 'passkey')
  cred.counter = v.authenticationInfo.newCounter
  cred.lastUsed = now()
  await putCredential(db, cred)
  return u
}
export async function prove(ctx, act) {
  const { db, cfg, body } = ctx,
    u = requireUser(ctx)
  if (body.credential) {
    await assertion(db, cfg, body, u)
    return 'passkey'
  }
  if (!cfg.passwordLogin || !wayIn(u))
    fail(403, 'confirm with your passkey first', 'passkey-required')
  if (!body.current) fail(403, 'enter your current password', 'current-required')
  await throttle(db, 'password:' + u.id, 10)
  if (!(await verifyPassword(body.current, u.pw.h))) {
    await audit(db, 'auth.proof.fail', u, { ok: false, act })
    fail(403, 'your current password is not right', 'current-wrong')
  }
  await db.query('delete from ironlog.limits where key=$1', ['password:' + u.id])
  return 'password'
}
async function keyState(db, u, cfg) {
  const cs = await credentials(db, u.id)
  return {
    passkeys: listPasskeys({ creds: cs }, u.id),
    password: cfg.passwordLogin && wayIn(u),
    lastWayIn: cs.length + (cfg.passwordLogin && wayIn(u) ? 1 : 0) <= 1,
  }
}
async function deleteAllowed(db, u, actor) {
  // A short global lock makes concurrent last-admin/owner operations safe.
  await db.query("select pg_advisory_xact_lock(hashtextextended('ironlog-roles',0))")
  const all = (await rows(db, 'select data from ironlog.accounts')).map((x) => x.data)
  if (actor && actor.id === u.id) fail(400, 'you cannot delete your own account')
  if (u.admin && all.filter((x) => x.admin).length <= 1 && all.length > 1)
    fail(409, 'the last admin cannot leave while other profiles remain', 'last-admin')
  if (actor && u.owner)
    fail(400, 'the owner cannot be deleted; hand the role to another admin first')
  if (actor && u.admin && !actor.owner) fail(403, 'only the owner can delete an admin')
}
export async function removeAccount(db, u) {
  // Storage removal is durable and retried even after the account row is gone.
  await db.query(
    "insert into ironlog.jobs(id,kind,payload,due_at) values($1,'delete-user-media',$2,now()) on conflict(id) do nothing",
    ['delete-user:' + u.id, { userId: u.id }],
  )
  await db.query('delete from ironlog.accounts where id=$1', [u.id])
}
export const authRoutes = {
  'GET /api/me': async (ctx) => {
    const u = requireUser(ctx),
      s = ctx.s
    return answer({
      user: publicUser(u),
      ...(s.bearer && s.kind !== 'c' && s.exp - Date.now() < (ctx.cfg.sessionDays * 86400000) / 2
        ? { token: token(u, ctx.cfg) }
        : {}),
    })
  },
  'POST /api/register/password': async ({ db, cfg, body }) => {
    const name = text(body.name).trim().slice(0, 40)
    if (!name) fail(400, 'name required', 'missing')
    await invite(db, body.code)
    validPassword(body.password, name)
    const email = body.email ? normalizeEmail(body.email) : null
    if (body.email && !email) fail(400, 'invalid email', 'email-invalid')
    const h = await hashPassword(body.password),
      created = now()
    const u = { id: uid(), name, created, pw: { h, set: created }, ...(email ? { email } : {}) }
    await register(db, u, body.code)
    return signedIn(u, cfg)
  },
  'POST /api/login/password': async ({ db, cfg, body }) => {
    const ident = text(body.identifier ?? body.name ?? body.email).slice(0, 300)
    const u = await identity(db, ident)
    const key = 'password:' + (u?.id || digest(nameKey(ident)))
    await throttle(db, key, 10)
    if (
      typeof body.password !== 'string' ||
      passwordLength(body.password) > MAX_LENGTH ||
      !(await verifyPassword(body.password, u?.pw?.h))
    )
      fail(401, 'name or password is not right', 'bad-credentials')
    if (u.disabled) fail(403, 'this account has been disabled', 'disabled')
    await db.query('delete from ironlog.limits where key=$1', [key])
    await audit(db, 'auth.password.ok', u)
    return signedIn(u, cfg)
  },
  'POST /api/register/options': async ({ db, cfg, body }) => {
    const name = text(body.name).trim().slice(0, 40)
    if (!name) fail(400, 'name required')
    await invite(db, body.code)
    const u = { id: uid(), name },
      options = await registrationOptions(cfg, u)
    return answer({
      cid: await issue(db, 'challenge', {
        kind: 'register',
        challenge: options.challenge,
        ...u,
        code: normalizeCode(body.code),
      }),
      options,
    })
  },
  'POST /api/register/verify': async ({ db, cfg, body }) => {
    const c = (await consume(db, body.cid, 'challenge'))?.data
    if (c?.kind !== 'register') fail(400, 'challenge expired, try again', 'challenge-expired')
    const cred = await verifyNew(cfg, c, body),
      u = { id: c.id, name: c.name, created: now() }
    await register(db, u, c.code, cred)
    return signedIn(u, cfg)
  },
  'POST /api/login/options': async ({ db, cfg }) => {
    const options = await generateAuthenticationOptions({
      rpID: cfg.rpId,
      userVerification: 'preferred',
      allowCredentials: [],
    })
    return answer({
      cid: await issue(db, 'challenge', { kind: 'login', challenge: options.challenge }),
      options,
    })
  },
  'POST /api/login/verify': async ({ db, cfg, body }) => {
    const u = await assertion(db, cfg, body)
    await audit(db, 'auth.login.ok', u)
    return signedIn(u, cfg)
  },
  'POST /api/logout': async ({ db, cfg, s }) => {
    if (s) await audit(db, 'auth.logout', s.user)
    return answer({ ok: true }, 200, { 'Set-Cookie': clearCookie(cfg) })
  },
  'POST /api/logout/all': async (ctx) => {
    const u = requireUser(ctx)
    await invalidate(ctx.db, u)
    await audit(ctx.db, 'auth.logout.all', u)
    return answer({ ok: true }, 200, { 'Set-Cookie': clearCookie(ctx.cfg) })
  },
  'GET /api/account/passkeys': async (ctx) => {
    const u = requireUser(ctx),
      state = await keyState(ctx.db, u, ctx.cfg)
    const all = (await rows(ctx.db, 'select data from ironlog.accounts')).map((r) => r.data)
    return answer({
      ...state,
      ...(u.admin && all.length > 1 && all.filter((x) => x.admin).length <= 1
        ? { deleteBlocked: 'last-admin' }
        : {}),
    })
  },
  'POST /api/account/passkeys/options': async (ctx) => {
    const u = requireUser(ctx),
      cs = await credentials(ctx.db, u.id)
    if (cs.length >= MAX_PASSKEYS) fail(409, 'passkey limit', 'passkey-limit')
    await prove(ctx, 'passkey-add')
    const options = await registrationOptions(ctx.cfg, u, cs)
    return answer({
      cid: await issue(
        ctx.db,
        'challenge',
        { kind: 'add', challenge: options.challenge, sv: u.sv || 0 },
        300000,
        u.id,
      ),
      options,
    })
  },
  'POST /api/account/passkeys/verify': async (ctx) => {
    const u = requireUser(ctx),
      taken = await consume(ctx.db, ctx.body.cid, 'challenge'),
      c = taken?.data
    if (c?.kind !== 'add' || taken.user_id !== u.id || c.sv !== (u.sv || 0))
      fail(400, 'challenge expired', 'challenge-expired')
    const cs = await credentials(ctx.db, u.id)
    if (cs.length >= MAX_PASSKEYS) fail(409, 'passkey limit', 'passkey-limit')
    const cred = await verifyNew(ctx.cfg, c, ctx.body)
    if (await one(ctx.db, 'select id from ironlog.credentials where id=$1', [cred.id]))
      fail(409, 'credential already registered', 'credential-exists')
    await putCredential(ctx.db, { ...cred, userId: u.id, created: now() })
    await audit(ctx.db, 'auth.passkey.add', u)
    return answer({ ok: true, ...(await keyState(ctx.db, u, ctx.cfg)) })
  },
  'POST /api/account/passkeys/rename': async (ctx) => {
    const u = requireUser(ctx),
      cs = await credentials(ctx.db, u.id),
      c = cs.find((c) => c.id === ctx.body.id)
    if (!c) fail(404, 'passkey not found', 'not-found')
    c.name = passkeyName(ctx.body.name)
    await putCredential(ctx.db, c)
    return answer({ ok: true, ...(await keyState(ctx.db, u, ctx.cfg)) })
  },
  'DELETE /api/account/passkeys': async (ctx) => {
    const u = requireUser(ctx),
      cs = await credentials(ctx.db, u.id)
    if (!cs.some((c) => c.id === ctx.body.id)) fail(404, 'passkey not found', 'not-found')
    if (cs.length + (ctx.cfg.passwordLogin && wayIn(u) ? 1 : 0) <= 1)
      fail(409, 'this passkey is the only way into this profile', 'last-way-in')
    await prove(ctx, 'passkey-remove')
    await ctx.db.query('delete from ironlog.credentials where id=$1 and user_id=$2', [
      ctx.body.id,
      u.id,
    ])
    await ctx.db.query("delete from ironlog.tokens where user_id=$1 and purpose='link'", [u.id])
    return answer({ ok: true, ...(await keyState(ctx.db, u, ctx.cfg)) })
  },
  'GET /api/account/password': async (ctx) => {
    const u = requireUser(ctx)
    return answer({
      set: wayIn(u),
      setAt: u.pw?.set || null,
      passkeys: (await credentials(ctx.db, u.id)).length,
      name: u.name,
      nameTaken: false,
      email: u.email || null,
    })
  },
  'POST /api/account/password': async (ctx) => {
    const u = requireUser(ctx)
    validPassword(ctx.body.next, u.name)
    await prove(ctx, 'password')
    u.pw = { h: await hashPassword(ctx.body.next), set: now() }
    delete u.pwReset
    await invalidate(ctx.db, u)
    return ctx.s.bearer
      ? answer({ ok: true, token: token(u, ctx.cfg) })
      : answer({ ok: true }, 200, { 'Set-Cookie': cookie(u, ctx.cfg) })
  },
  'DELETE /api/account/password': async (ctx) => {
    const u = requireUser(ctx)
    if (!wayIn(u)) return answer({ ok: true })
    if (!(await credentials(ctx.db, u.id)).length)
      fail(409, 'the password is the only way into this profile', 'last-way-in')
    await prove(ctx, 'password-remove')
    delete u.pw
    await putAccount(ctx.db, u)
    return answer({ ok: true })
  },
  'POST /api/account/email': async (ctx) => {
    const u = requireUser(ctx),
      email = ctx.body.email ? normalizeEmail(ctx.body.email) : null
    if (ctx.body.email && !email) fail(400, 'invalid email', 'email-invalid')
    await prove(ctx, 'email')
    await nameAvailable(ctx.db, u.name, email, u.id)
    if (email) u.email = email
    else delete u.email
    await putAccount(ctx.db, u)
    return answer({ ok: true, email })
  },
  'DELETE /api/account/email': async (ctx) => {
    ctx.body.email = null
    return authRoutes['POST /api/account/email'](ctx)
  },
  'POST /api/account/delete': async (ctx) => {
    const u = requireUser(ctx)
    if (text(ctx.body.name).trim() !== u.name)
      fail(400, 'type the account name to confirm', 'confirm-name')
    await deleteAllowed(ctx.db, u)
    if (!(ctx.s.bearer && ctx.s.kind === 'b' && (!ctx.cfg.passwordLogin || !wayIn(u))))
      await prove(ctx, 'account-delete')
    await removeAccount(ctx.db, u)
    await audit(ctx.db, 'auth.account.delete', u)
    return answer({ ok: true }, 200, { 'Set-Cookie': clearCookie(ctx.cfg) })
  },
  'POST /api/pair/create': async (ctx) => {
    const u = requireUser(ctx)
    await ctx.db.query("delete from ironlog.tokens where user_id=$1 and purpose='pair'", [u.id])
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from(crypto.randomBytes(8), (b) => alphabet[b % alphabet.length]).join('')
    await ctx.db.query(
      "insert into ironlog.tokens(hash,purpose,user_id,data,expires) values($1,'pair',$2,$3,now()+interval '5 minutes')",
      [digest(normalizeCode(code)), u.id, { sv: u.sv || 0 }],
    )
    return answer({ code })
  },
  'POST /api/pair/redeem': async (ctx) => {
    const p = await consumeOwned(ctx.db, normalizeCode(ctx.body.code), 'pair'),
      u = p?.user
    if (!u || u.disabled || (u.sv || 0) !== p.data.sv)
      fail(400, 'invalid or expired code', 'pair-invalid')
    return answer({ token: token(u, ctx.cfg), user: publicUser(u) })
  },
  'POST /api/account/device-link': async (ctx) => {
    const u = requireUser(ctx)
    await prove(ctx, 'device-link')
    await ctx.db.query("delete from ironlog.tokens where user_id=$1 and purpose='link'", [u.id])
    const code = makeLinkCode(),
      expires = Date.now() + 600000
    await ctx.db.query(
      "insert into ironlog.tokens(hash,purpose,user_id,data,expires) values($1,'link',$2,$3,$4)",
      [hashLinkCode(code), u.id, { sv: u.sv || 0 }, new Date(expires)],
    )
    return answer({ code, expires, name: u.name })
  },
  'POST /api/device-link/options': async (ctx) => {
    const link = await one(
      ctx.db,
      "select user_id,data from ironlog.tokens where hash=$1 and purpose='link' and expires>now()",
      [hashLinkCode(ctx.body.code)],
    )
    const u = link && (await account(ctx.db, link.user_id))
    if (!u || u.disabled || (u.sv || 0) !== link.data.sv)
      fail(400, 'that code is wrong, used or expired', 'link-invalid')
    const options = await registrationOptions(ctx.cfg, u, await credentials(ctx.db, u.id))
    return answer({
      cid: await issue(
        ctx.db,
        'challenge',
        {
          kind: 'link',
          challenge: options.challenge,
          linkHash: hashLinkCode(ctx.body.code),
          sv: u.sv || 0,
        },
        300000,
        u.id,
      ),
      options,
      id: u.id,
      name: u.name,
    })
  },
  'POST /api/device-link/verify': async (ctx) => {
    const taken = await consumeOwned(ctx.db, ctx.body.cid, 'challenge'),
      c = taken?.data,
      u = taken?.user
    if (
      c?.kind !== 'link' ||
      !u ||
      u.disabled ||
      c.sv !== (u.sv || 0) ||
      c.linkHash !== hashLinkCode(ctx.body.code)
    )
      fail(400, 'that code is wrong, used or expired', 'link-invalid')
    const link = await one(
      ctx.db,
      "select hash from ironlog.tokens where hash=$1 and purpose='link' and user_id=$2 and expires>now() for update",
      [c.linkHash, u.id],
    )
    if (!link) fail(400, 'that code is wrong, used or expired', 'link-invalid')
    if ((await credentials(ctx.db, u.id)).length >= MAX_PASSKEYS)
      fail(409, 'passkey limit', 'passkey-limit')
    const cred = await verifyNew(ctx.cfg, c, ctx.body)
    if (await one(ctx.db, 'select id from ironlog.credentials where id=$1', [cred.id]))
      fail(409, 'credential already registered', 'credential-exists')
    await putCredential(ctx.db, { ...cred, userId: u.id, created: now() })
    await ctx.db.query("delete from ironlog.tokens where hash=$1 and purpose='link'", [c.linkHash])
    return signedIn(u, ctx.cfg)
  },
  'POST /api/admin/user/password-reset': async (ctx) => {
    const a = requireAdmin(ctx),
      u = await account(ctx.db, ctx.body.id)
    if (!u) fail(404, 'no such user')
    if (u.admin) fail(400, 'an admin sets their own password in Settings')
    const code = makeResetCode()
    delete u.pw
    u.pwReset = { h: hashResetCode(code), exp: Date.now() + RESET_TTL_MS, by: a.id }
    await invalidate(ctx.db, u)
    return answer({ ok: true, name: u.name, code, expires: u.pwReset.exp })
  },
  'POST /api/login/password-reset': async (ctx) => {
    const u = await identity(ctx.db, text(ctx.body.identifier ?? ctx.body.name ?? ctx.body.email))
    if (!u || u.disabled || !resetCodeMatches(ctx.body.code, u.pwReset))
      fail(400, 'that reset code is wrong or has expired', 'reset-invalid')
    validPassword(ctx.body.next, u.name)
    u.pw = { h: await hashPassword(ctx.body.next), set: now() }
    delete u.pwReset
    await invalidate(ctx.db, u)
    return signedIn(u, ctx.cfg)
  },
}
export { deleteAllowed }
