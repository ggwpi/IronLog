import webpush from 'web-push'
import crypto from 'node:crypto'
import { pushEndpointError, PUSH_AGENT } from './push-security.js'
import { rows, one } from './db.js'
import { requireUser, throttle, digest } from './session.js'
import { restTimerPush, testPush } from '../push-messages.js'
import { readProfile } from './profiles.js'
import { answer, fail, text } from './http.js'
const deviceId = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v) ? v : null)
export const vapid = () => ({
  publicKey: process.env.IRONLOG_VAPID_PUBLIC_KEY,
  privateKey: process.env.IRONLOG_VAPID_PRIVATE_KEY,
})
export async function sendPush(db, uid, payload, device) {
  const key = vapid()
  if (!key.publicKey || !key.privateKey) throw new Error('VAPID is not configured')
  const subs = await rows(
    db,
    'select endpoint_hash,data from ironlog.subscriptions where user_id=$1',
    [uid],
  )
  let next = 0
  const deliver = async () => {
    for (;;) {
      const row = subs[next++]
      if (!row) return
      const { endpoint_hash, data: s } = row
      if (device && s.deviceId && device !== s.deviceId) continue
      if (pushEndpointError(s.endpoint)) {
        await db.query('delete from ironlog.subscriptions where endpoint_hash=$1', [endpoint_hash])
        continue
      }
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          JSON.stringify(payload),
          {
            urgency: 'high',
            timeout: 5000,
            agent: PUSH_AGENT,
            vapidDetails: {
              subject: process.env.VAPID_SUBJECT || process.env.ORIGIN,
              publicKey: key.publicKey,
              privateKey: key.privateKey,
            },
          },
        )
      } catch (e) {
        if ([403, 404, 410].includes(e.statusCode))
          await db.query('delete from ironlog.subscriptions where endpoint_hash=$1', [
            endpoint_hash,
          ])
        else throw new Error('push-delivery-failed')
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, subs.length) }, deliver))
}
export const pushRoutes = {
  'GET /api/push/public-key': async () => {
    if (!vapid().publicKey) fail(503, 'notifications are not configured', 'push-unavailable')
    return answer({ key: vapid().publicKey })
  },
  'POST /api/push/subscribe': async (ctx) => {
    const u = requireUser(ctx),
      s = ctx.body.subscription
    if (
      !s?.endpoint ||
      !s.keys?.auth ||
      !s.keys?.p256dh ||
      s.endpoint.length > 4096 ||
      String(s.keys.auth).length > 256 ||
      String(s.keys.p256dh).length > 256
    )
      fail(400, 'invalid subscription')
    const bad = pushEndpointError(s.endpoint)
    if (bad) fail(400, bad)
    const hash = digest(s.endpoint),
      prev = await one(
        ctx.db,
        'select user_id,data from ironlog.subscriptions where endpoint_hash=$1 for update',
        [hash],
      )
    const keys = { p256dh: String(s.keys.p256dh), auth: String(s.keys.auth) }
    if (
      prev &&
      prev.user_id !== u.id &&
      digest(JSON.stringify(prev.data.keys)) !== digest(JSON.stringify(keys))
    )
      fail(409, 'this subscription belongs to another account')
    const data = {
      endpoint: s.endpoint,
      keys,
      deviceId: deviceId(ctx.body.deviceId) || prev?.data.deviceId || null,
      created: prev?.data.created || new Date().toISOString(),
    }
    await ctx.db.query(
      `insert into ironlog.subscriptions(endpoint_hash,user_id,data) values($1,$2,$3)
      on conflict(endpoint_hash) do update set user_id=excluded.user_id,data=excluded.data,updated_at=now()`,
      [hash, u.id, data],
    )
    await ctx.db.query(
      'delete from ironlog.subscriptions where endpoint_hash in(select endpoint_hash from ironlog.subscriptions where user_id=$1 order by updated_at desc offset 20)',
      [u.id],
    )
    return answer({ ok: true })
  },
  'GET /api/push/status': async (ctx) => {
    const u = requireUser(ctx),
      r = await one(
        ctx.db,
        'select data from ironlog.subscriptions where user_id=$1 and endpoint_hash=$2',
        [u.id, digest(ctx.url.searchParams.get('endpoint') || '')],
      )
    return answer(
      r ? { subscribed: true, deviceId: r.data.deviceId || null } : { subscribed: false },
    )
  },
  'POST /api/push/unsubscribe': async (ctx) => {
    const u = requireUser(ctx)
    await ctx.db.query('delete from ironlog.subscriptions where user_id=$1 and endpoint_hash=$2', [
      u.id,
      digest(text(ctx.body.endpoint)),
    ])
    return answer({ ok: true })
  },
  'POST /api/push/test': async (ctx) => {
    const u = requireUser(ctx)
    await throttle(ctx.db, 'push-test:' + u.id, 5, 60)
    const id = 'test:' + u.id + ':' + crypto.randomBytes(8).toString('hex')
    const s = await readProfile(ctx.db, u.id)
    await ctx.db.query(
      "insert into ironlog.jobs(id,kind,payload,due_at) values($1,'push',$2,now())",
      [id, { userId: u.id, push: testPush(s?.lang) }],
    )
    return answer({ ok: true })
  },
  'POST /api/push/rest-timer': async (ctx) => {
    const u = requireUser(ctx)
    await throttle(ctx.db, 'rest:' + u.id, 120, 60)
    const n = ['number', 'string'].includes(typeof ctx.body.seconds)
      ? Number(ctx.body.seconds)
      : NaN
    if (!Number.isFinite(n) || n < 1) fail(400, 'seconds required')
    const d = deviceId(ctx.body.deviceId),
      id = 'rest:' + u.id + ':' + (d || ''),
      s = await readProfile(ctx.db, u.id)
    await ctx.db.query(
      `insert into ironlog.jobs(id,kind,payload,due_at) values($1,'push',$2,$3)
      on conflict(id) do update set payload=excluded.payload,due_at=excluded.due_at,done_at=null,lease_until=null,attempts=0`,
      [
        id,
        { userId: u.id, deviceId: d, push: restTimerPush(s?.lang) },
        new Date(Date.now() + Math.min(3600, Math.round(n)) * 1000),
      ],
    )
    // Retain the upstream per-user timer bound.
    await ctx.db.query(
      'delete from ironlog.jobs where id in(select id from ironlog.jobs where id like $1 and done_at is null order by created_at desc offset 5)',
      ['rest:' + u.id + ':%'],
    )
    return answer({ ok: true })
  },
  'POST /api/push/rest-timer/cancel': async (ctx) => {
    const u = requireUser(ctx),
      d = deviceId(ctx.body.deviceId)
    if (d) await ctx.db.query('delete from ironlog.jobs where id=$1', ['rest:' + u.id + ':' + d])
    else await ctx.db.query('delete from ironlog.jobs where id like $1', ['rest:' + u.id + ':%'])
    return answer({ ok: true })
  },
  'POST /api/activity': async (ctx) => {
    const u = requireUser(ctx),
      b = ctx.body
    if (b.active) {
      const data = {
        name: text(b.name).slice(0, 60),
        exIdx: +b.exIdx || 0,
        exTotal: +b.exTotal || 0,
        setsDone: +b.setsDone || 0,
        setsTotal: +b.setsTotal || 0,
        startedAt: +b.startedAt || Date.now(),
        updatedAt: Date.now(),
      }
      await ctx.db.query(
        "insert into ironlog.presence(user_id,data,expires) values($1,$2,now()+interval '70 seconds') on conflict(user_id) do update set data=excluded.data,expires=excluded.expires",
        [u.id, data],
      )
    } else if (b.reason === 'hidden')
      await ctx.db.query(
        "update ironlog.presence set expires=least(expires,now()+interval '45 seconds'),data=data||jsonb_build_object('hiddenAt',floor(extract(epoch from now())*1000)) where user_id=$1 and not(data?'hiddenAt')",
        [u.id],
      )
    else await ctx.db.query('delete from ironlog.presence where user_id=$1', [u.id])
    return answer({ ok: true })
  },
}
