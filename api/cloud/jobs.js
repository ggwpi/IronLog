import crypto from 'node:crypto'
import { account, one, rows, putAccount } from './db.js'
import { readProfile } from './profiles.js'
import { sendPush } from './push.js'
import { effectiveRoutineId } from '../queue.js'
import { dayReminderPush, nudgePush } from '../push-messages.js'
import { nudgeFor, nudgeWindowOpen, toneOf } from '../nudge.js'
import { referencedHashes, mediaLimits } from '../media.js'
export function localClock(tz, now = new Date()) {
  try {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(now)
    const get = (t) => p.find((x) => x.type === t)?.value,
      date = `${get('year')}-${get('month')}-${get('day')}`
    return {
      date,
      hhmm: `${get('hour')}:${get('minute')}`,
      weekday: new Date(date + 'T12:00:00Z').getUTCDay(),
    }
  } catch {
    return null
  }
}
const minute = (v) =>
  /^\d{2}:\d{2}$/.test(v || '') ? Number(v.slice(0, 2)) * 60 + Number(v.slice(3)) : NaN
export async function enqueuePush(db, id, payload, due = new Date()) {
  await db.query(
    "insert into ironlog.jobs(id,kind,payload,due_at) values($1,'push',$2,$3) on conflict(id) do nothing",
    [id, payload, due],
  )
}
async function reminders(db) {
  // Summaries are selected in SQL; large histories are loaded only for due users.
  const candidates = await rows(
    db,
    `select a.id,p.state->'reminder' as reminder from ironlog.accounts a join ironlog.profiles p on p.user_id=a.id
    where coalesce((a.data->>'disabled')::boolean,false)=false and p.state->'reminder'->>'on'='true'
    and exists(select 1 from ironlog.subscriptions s where s.user_id=a.id)`,
  )
  for (const r of candidates) {
    const clock = localClock(r.reminder.tz || 'UTC')
    if (!clock) continue
    const late = minute(clock.hhmm) - minute(r.reminder.time)
    if (
      !(late >= 0 && late <= 15) &&
      !(r.reminder.nudge && nudgeWindowOpen(r.reminder.time, clock.hhmm))
    )
      continue
    const u = await account(db, r.id),
      s = await readProfile(db, r.id)
    if (!u || u.disabled || !s?.reminder?.on) continue
    if (
      await one(db, 'select user_id from ironlog.presence where user_id=$1 and expires>now()', [
        u.id,
      ])
    )
      continue
    const rid = effectiveRoutineId(s, clock.date),
      routine = (s.routines || []).find((x) => x?.id === rid)
    if (late >= 0 && late <= 15 && u.lastReminder !== clock.date) {
      const done =
        (s.workouts || []).some((w) => w?.d === clock.date) ||
        (!!s.dayNotes?.[clock.date] &&
          (!!s.dayNotes[clock.date].tag || !!s.dayNotes[clock.date].text))
      if (routine && !done)
        await enqueuePush(db, `reminder:${u.id}:${clock.date}`, {
          userId: u.id,
          push: dayReminderPush(s.lang, routine),
        })
      u.lastReminder = clock.date
      await putAccount(db, u)
    }
    if (
      s.reminder.nudge &&
      nudgeWindowOpen(s.reminder.time, clock.hhmm) &&
      u.lastNudge !== clock.date
    ) {
      const n = nudgeFor(s, clock.date)
      if (n)
        await enqueuePush(db, `nudge:${u.id}:${clock.date}`, {
          userId: u.id,
          push: nudgePush(
            s.lang,
            toneOf(s.reminder),
            (s.routines || []).find((r) => r?.id === n),
            clock.date,
          ),
        })
      u.lastNudge = clock.date
      await putAccount(db, u)
    }
  }
}
async function garbageCollect(db, storage, uid) {
  const s = await readProfile(db, uid, true)
  if (!s) return // Unknown profile state never authorizes deleting files.
  const refs = referencedHashes(s),
    grace = mediaLimits().gcGraceDays
  const candidates = await rows(
    db,
    "select hash,path from ironlog.media where user_id=$1 and unreferenced_since<now()-$2*interval '1 day' limit 100",
    [uid, grace],
  )
  for (const m of candidates)
    if (!refs.has(m.hash)) {
      await storage.remove([m.path])
      await db.query('delete from ironlog.media where user_id=$1 and hash=$2', [uid, m.hash])
    }
}
async function maintenance(db, storage) {
  await db.query('delete from ironlog.tokens where expires<now()')
  await db.query('delete from ironlog.limits where expires<now()')
  await db.query('delete from ironlog.presence where expires<now()')
  await db.query(
    "delete from ironlog.audit where at<now()-interval '30 days' or id in(select id from ironlog.audit order by id desc offset 10000)",
  )
  const old = await rows(db, 'select id,path from ironlog.transfers where expires<now() limit 25')
  for (const r of old) {
    await storage.remove([r.path])
    await db.query('delete from ironlog.transfers where id=$1', [r.id])
  }
  const all = await rows(db, 'select id from ironlog.accounts order by id')
  const day = new Date().toISOString().slice(0, 10)
  for (const { id } of all)
    await db.query(
      "insert into ironlog.jobs(id,kind,payload,due_at) values($1,'media-gc',$2,now()) on conflict(id) do nothing",
      [`gc:${id}:${day}`, { userId: id }],
    )
  await db.query("delete from ironlog.jobs where done_at<now()-interval '7 days'")
}
async function processWork(database, storage, { max = 10 } = {}) {
  const started = Date.now()
  let processed = 0
  // A short due-list read, followed by per-user locks in the same order as requests.
  const due = await database.transaction((db) =>
    rows(
      db,
      "select id,payload from ironlog.jobs where kind <> 'coach' and done_at is null and due_at<=now() order by due_at limit $1",
      [max],
    ),
  )
  for (const candidate of due) {
    if (Date.now() - started > 40000) break
    try {
      const did = await database.transaction(async (db) => {
        const u = candidate.payload.userId ? await account(db, candidate.payload.userId) : null
        const job = await one(
          db,
          'select * from ironlog.jobs where id=$1 and done_at is null and due_at<=now() for update skip locked',
          [candidate.id],
        )
        if (!job) return false
        if (job.kind === 'push' && u && !u.disabled) {
          // A crash can replay an acknowledged send; upstream notification tags let
          // browsers replace it. Never promise exactly-once delivery over Web Push.
          await sendPush(db, u.id, job.payload.push, job.payload.deviceId)
        } else if (job.kind === 'delete-user-media') {
          for (const prefix of ['media', 'staging', 'snapshots'])
            await storage.removePrefix(prefix + '/' + job.payload.userId)
        } else if (job.kind === 'media-gc' && u) await garbageCollect(db, storage, u.id)
        else if (job.kind === 'reminders') await reminders(db)
        else if (job.kind === 'maintenance') await maintenance(db, storage)
        if (['reminders', 'maintenance'].includes(job.kind))
          await db.query(
            "update ironlog.jobs set due_at=now()+$2*interval '1 second',attempts=0 where id=$1",
            [job.id, job.kind === 'reminders' ? 10 : 3600],
          )
        else
          await db.query('update ironlog.jobs set done_at=now(),last_error=null where id=$1', [
            job.id,
          ])
        return true
      })
      if (did) processed++
    } catch (e) {
      // No payload, endpoint, credentials or personal state in logs.
      console.error('IronLog background job failed', {
        kind: 'job',
        code: e.code || 'operation-failed',
      })
      await database.transaction((db) =>
        db.query(
          "update ironlog.jobs set attempts=attempts+1,due_at=now()+least(3600,power(2,least(attempts+1,10))) * interval '1 second',last_error='operation-failed' where id=$1 and done_at is null",
          [candidate.id],
        ),
      )
    }
  }
  return { processed }
}

export async function work(database, storage, options) {
  // One scanner at a time across instances. Transaction-scoped locks work with
  // Supabase's transaction pooler; no process-local lease or lock is required.
  return database.transaction(async (guard) => {
    const lock = await one(
      guard,
      "select pg_try_advisory_xact_lock(hashtextextended('ironlog-worker',0)) as acquired",
    )
    return lock.acquired ? processWork(database, storage, options) : { processed: 0 }
  })
}
