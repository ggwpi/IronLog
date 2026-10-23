import crypto from 'node:crypto'
import { rows, one, account, putAccount, audit } from './db.js'
import { readProfile } from './profiles.js'
import { requireAdmin } from './session.js'
import { removeAccount, deleteAllowed, invalidate } from './auth.js'
import { answer, fail, records, text } from './http.js'
const view = (u) => ({
  id: u.id,
  name: u.name,
  created: u.created || null,
  disabled: !!u.disabled,
  admin: !!u.admin,
  owner: !!u.owner,
  invitedBy: u.invitedBy || null,
  password: !!u.pw?.h,
  email: u.email || null,
})
export const adminRoutes = {
  'GET /api/admin/users': async (ctx) => {
    requireAdmin(ctx)
    const users = await rows(
      ctx.db,
      `select a.data,p.state,s.user_id as subscribed,v.data as live,v.expires from ironlog.accounts a
      left join ironlog.profiles p on p.user_id=a.id
      left join (select distinct user_id from ironlog.subscriptions) s on s.user_id=a.id
      left join ironlog.presence v on v.user_id=a.id order by a.created_at`,
    )
    return answer({
      users: users.map(({ data: u, state: s, subscribed, live, expires }) => {
        const ws = records(s?.workouts)
        return {
          ...view(u),
          workouts: ws.length,
          lastWorkout: ws.at(-1)?.d || null,
          lastSync: u.lastSync || null,
          hasPush: !!subscribed,
          live: expires && new Date(expires) > new Date() ? live : null,
        }
      }),
      invite_only: true,
      password_login: ctx.cfg.passwordLogin,
      now: Date.now(),
    })
  },
  'GET /api/admin/user': async (ctx) => {
    requireAdmin(ctx)
    const u = await account(ctx.db, ctx.url.searchParams.get('id'))
    if (!u) fail(404, 'no such user')
    const s = (await readProfile(ctx.db, u.id)) || {}
    return answer({
      user: { ...view(u), resetUntil: u.pwReset?.exp > Date.now() ? u.pwReset.exp : null },
      unit: s.unit || 'kg',
      lastSync: u.lastSync || null,
      routines: records(s.routines).map((r) => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        count: records(r.ex).length,
      })),
      bodyweight: records(s.bodyweight),
      workouts: records(s.workouts)
        .reverse()
        .map(({ media, ...w }) => w),
    })
  },
  'POST /api/admin/user/disable': async (ctx) => {
    const a = requireAdmin(ctx),
      u = await account(ctx.db, ctx.body.id)
    if (!u) fail(404, 'no such user')
    if (u.admin) fail(400, 'cannot disable an admin')
    u.disabled = !!ctx.body.disabled
    // Re-enabling must never resurrect tokens minted before the disable.
    if (u.disabled) await invalidate(ctx.db, u)
    else await putAccount(ctx.db, u)
    await audit(ctx.db, u.disabled ? 'admin.user.disable' : 'admin.user.enable', a, {
      target: { id: u.id, name: u.name },
    })
    return answer({ ok: true, id: u.id, disabled: u.disabled })
  },
  'POST /api/admin/user/delete': async (ctx) => {
    const a = requireAdmin(ctx),
      u = await account(ctx.db, ctx.body.id)
    if (!u) fail(404, 'no such user')
    await deleteAllowed(ctx.db, u, a)
    await removeAccount(ctx.db, u)
    await audit(ctx.db, 'admin.user.delete', a, { target: { id: u.id, name: u.name } })
    return answer({ ok: true, id: u.id })
  },
  'POST /api/admin/user/role': async (ctx) => {
    const a = requireAdmin(ctx, true)
    await ctx.db.query("select pg_advisory_xact_lock(hashtextextended('ironlog-roles',0))")
    const u = await account(ctx.db, ctx.body.id)
    if (!u) fail(404, 'no such user')
    if (u.id === a.id) fail(400, 'the owner stays an admin')
    if (typeof ctx.body.admin !== 'boolean') fail(400, 'admin must be true or false')
    if (u.disabled && ctx.body.admin) fail(400, 'enable the account first')
    u.admin = ctx.body.admin
    delete u.owner
    await putAccount(ctx.db, u)
    await audit(ctx.db, 'admin.role.change', a, { target: { id: u.id, name: u.name } })
    return answer({ ok: true, id: u.id, admin: !!u.admin })
  },
  'POST /api/admin/owner': async (ctx) => {
    const a = requireAdmin(ctx, true)
    await ctx.db.query("select pg_advisory_xact_lock(hashtextextended('ironlog-roles',0))")
    const u = await account(ctx.db, ctx.body.id)
    if (!u || !u.admin || u.disabled) fail(400, 'make them an admin first')
    a.owner = false
    u.owner = true
    await putAccount(ctx.db, a)
    await putAccount(ctx.db, u)
    await audit(ctx.db, 'admin.owner.transfer', a, { target: { id: u.id, name: u.name } })
    return answer({ ok: true, id: u.id })
  },
  'GET /api/admin/invites': async (ctx) => {
    requireAdmin(ctx)
    const invites = (
      await rows(
        ctx.db,
        `select i.data,a.data->>'name' as name from ironlog.invites i left join ironlog.accounts a on a.id=i.data->>'usedBy'`,
      )
    ).map((r) => ({ ...r.data, usedByName: r.name || null }))
    return answer({ invites, invite_only: true })
  },
  'POST /api/admin/invites/new': async (ctx) => {
    const a = requireAdmin(ctx),
      code = crypto.randomBytes(8).toString('hex').toUpperCase()
    const inv = {
      code,
      note: text(ctx.body.note).slice(0, 60),
      createdBy: a.id,
      created: new Date().toISOString(),
    }
    await ctx.db.query('insert into ironlog.invites(code,data) values($1,$2)', [code, inv])
    await audit(ctx.db, 'admin.invite.create', a)
    return answer({ invite: inv })
  },
  'POST /api/admin/invites/revoke': async (ctx) => {
    const a = requireAdmin(ctx),
      code = text(ctx.body.code).toUpperCase(),
      i = await one(ctx.db, 'select data from ironlog.invites where code=$1 for update', [code])
    if (!i) fail(404, 'no such code')
    if (i.data.usedBy) fail(400, 'already used, cannot revoke')
    await ctx.db.query('delete from ironlog.invites where code=$1', [code])
    await audit(ctx.db, 'admin.invite.revoke', a)
    return answer({ ok: true })
  },
  'GET /api/admin/audit': async (ctx) => {
    requireAdmin(ctx)
    const limit = Math.max(1, Math.min(200, +ctx.url.searchParams.get('limit') || 100)),
      before = ctx.url.searchParams.get('before') || '9223372036854775807',
      cat = ctx.url.searchParams.get('cat') || ''
    if (!/^\d{1,19}$/.test(before) || BigInt(before) > 9223372036854775807n)
      fail(400, 'invalid cursor')
    const events = await rows(
      ctx.db,
      `select id,event as ev,at,data from ironlog.audit where id<$1::bigint and at>now()-interval '30 days'
      and ($3='' or ($3='fail' and data->>'ok'='false') or ($3<>'fail' and event like $3||'.%')) order by id desc limit $2`,
      [before, limit, cat],
    )
    const total = await one(
      ctx.db,
      "select count(*)::int as n from ironlog.audit where at>now()-interval '30 days'",
    )
    return answer({
      events: events.map(({ data, ...r }) => ({
        ...r,
        ...data,
        id: Number(r.id),
        ts: new Date(r.at).getTime(),
      })),
      total: total.n,
      nextBefore: events.length === limit ? Number(events.at(-1).id) : null,
      enabled: true,
      ip_mode: 'off',
      retention: { max: 10000, days: 30 },
      now: Date.now(),
    })
  },
  'POST /api/admin/audit/clear': async (ctx) => {
    const a = requireAdmin(ctx, true)
    await ctx.db.query('delete from ironlog.audit')
    await audit(ctx.db, 'admin.audit.clear', a)
    return answer({ ok: true })
  },
}
