import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  mediaLimits,
  mediaConfig,
  HASH_RE,
  MEDIA_TYPES,
  sniffMedia,
  mp4Info,
  referencedHashes,
} from '../media.js'
import { one, rows } from './db.js'
import { requireUser, throttle } from './session.js'
import { readProfile, writeProfile, forClient, MAX_PROFILE_BYTES } from './profiles.js'
import { answer, fail } from './http.js'
const MB = 1024 * 1024
export class Storage {
  constructor(env = process.env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY)
      throw new Error('Supabase server Storage configuration is required')
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    this.bucket = 'ironlog-private'
  }
  async result(p) {
    const r = await p
    if (r.error) throw new Error('Storage operation failed')
    return r.data
  }
  async uploadUrl(p) {
    return this.result(
      this.client.storage.from(this.bucket).createSignedUploadUrl(p, { upsert: false }),
    )
  }
  async downloadUrl(p) {
    return (await this.result(this.client.storage.from(this.bucket).createSignedUrl(p, 60)))
      .signedUrl
  }
  async exists(p) {
    const r = await this.client.storage.from(this.bucket).exists(p)
    if (r.error && Number(r.error.statusCode ?? r.error.status) !== 404)
      throw new Error('Storage inspection failed')
    return r.data === true
  }
  async get(p, max) {
    // Bound the stream even when the uploaded object's metadata lies.
    const url = await this.downloadUrl(p),
      r = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!r.ok) throw new Error('Storage download failed')
    const reader = r.body.getReader(),
      parts = []
    let size = 0
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.length
        if (size > max) {
          await reader.cancel()
          fail(413, 'file too large', 'media-too-large')
        }
        parts.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    return Buffer.concat(
      parts.map((p) => Buffer.from(p)),
      size,
    )
  }
  async put(p, bytes, type) {
    await this.result(
      this.client.storage.from(this.bucket).upload(p, bytes, { contentType: type, upsert: true }),
    )
  }
  async remove(paths) {
    if (paths.length) await this.result(this.client.storage.from(this.bucket).remove(paths))
  }
  async removePrefix(prefix) {
    // Deletion is retried from the durable outbox. Never delete another user's prefix.
    if (!/^(media|staging|snapshots)\/[A-Za-z0-9_-]+$/.test(prefix))
      throw new Error('invalid storage prefix')
    for (;;) {
      const list = await this.result(
        this.client.storage.from(this.bucket).list(prefix, { limit: 100 }),
      )
      if (!list.length) break
      await this.remove(list.map((f) => prefix + '/' + f.name))
    }
  }
}
export const limits = mediaLimits()
export const storageConfig = () => ({ ...mediaConfig(limits), transport: 'signed-v1' })
async function usage(db, uid) {
  const r = await one(
    db,
    'select coalesce(sum(size),0)::bigint as bytes,count(*)::int as count from ironlog.media where user_id=$1',
    [uid],
  )
  return { bytes: Number(r.bytes), count: r.count, quotaBytes: limits.quotaMB * MB }
}
const capFor = (mime) => {
  const t = MEDIA_TYPES[mime]
  return t
    ? (t.kind === 'video' ? limits.videoMB : t.kind === 'gif' ? limits.gifMB : limits.imageMB) * MB
    : 0
}
async function startTransfer(ctx, kind, data) {
  const u = requireUser(ctx),
    size = data.size,
    max = kind === 'media' ? capFor(data.mime) : MAX_PROFILE_BYTES + 8192
  if (!Number.isSafeInteger(size) || size < 1 || !max || size > max)
    fail(413, 'file too large or unsupported', 'media-too-large')
  await throttle(ctx.db, 'upload:' + u.id, limits.uploadsPerHour, 3600)
  if (
    kind === 'media' &&
    (await one(ctx.db, 'select hash from ironlog.media where user_id=$1 and hash=$2', [
      u.id,
      data.hash,
    ]))
  )
    return { existed: true, usage: await usage(ctx.db, u.id) }
  if (data.hash) {
    const existing = await one(
      ctx.db,
      "select id,path from ironlog.transfers where user_id=$1 and kind=$2 and data->>'hash'=$3 and data->>'mime'=$4 and (data->>'size')::bigint=$5 and expires>now() and completed_at is null order by expires desc limit 1",
      [u.id, kind, data.hash, data.mime, size],
    )
    if (existing) {
      const uploaded = await ctx.storage.exists(existing.path)
      await ctx.db.query(
        "update ironlog.transfers set expires=now()+interval '3 hours' where id=$1",
        [existing.id],
      )
      if (uploaded) return { id: existing.id, uploaded: true }
      const signed = await ctx.storage.uploadUrl(existing.path)
      return { id: existing.id, url: signed.signedUrl, path: signed.path, token: signed.token }
    }
  }

  const pending = await one(
    ctx.db,
    "select count(*)::int as n,coalesce(sum((data->>'size')::bigint),0)::bigint as bytes from ironlog.transfers where user_id=$1 and expires>now() and completed_at is null",
    [u.id],
  )
  if (pending.n >= 2)
    fail(429, 'too many uploads, try again later', 'media-busy', { retryAfter: 60 })
  const used = await usage(ctx.db, u.id)
  if (
    kind === 'media' &&
    used.quotaBytes &&
    used.bytes + Number(pending.bytes) + size > used.quotaBytes
  )
    fail(413, 'storage quota exceeded', 'media-quota')
  const id = crypto.randomBytes(20).toString('hex'),
    p = `staging/${u.id}/${id}`
  // Reserve BEFORE issuing a URL. File lifetime is longer than URL expiry, and cleanup
  // retains reservations until the upload URL has expired, preventing quota bypass.
  await ctx.db.query(
    "insert into ironlog.transfers(id,user_id,kind,path,data,expires) values($1,$2,$3,$4,$5,now()+interval '3 hours')",
    [id, u.id, kind, p, data],
  )
  const signed = await ctx.storage.uploadUrl(p)
  return { id, url: signed.signedUrl, path: signed.path, token: signed.token }
}
async function transfer(ctx, kind) {
  const u = requireUser(ctx),
    r = await one(
      ctx.db,
      'select * from ironlog.transfers where id=$1 and user_id=$2 and kind=$3 and expires>now() for update',
      [ctx.body.id, u.id, kind],
    )
  if (!r) fail(404, 'upload expired or missing', 'upload-missing')
  return r
}
async function videoCheck(bytes, sn) {
  if (!['mp4', 'mov'].includes(sn.ext)) return
  // Reuse upstream's bounded box parser. /tmp is only scratch, never persistence.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ironlog-media-')),
    p = path.join(dir, 'check')
  try {
    fs.writeFileSync(p, bytes, { mode: 0o600 })
    const fd = fs.openSync(p, 'r')
    let info
    try {
      info = mp4Info(fd, bytes.length)
    } finally {
      fs.closeSync(fd)
    }
    if (!info) fail(415, 'invalid media', 'media-invalid')
    if (info.durationSec != null && info.durationSec > limits.videoSec + 1)
      fail(413, 'that video is too long', 'media-too-long', { maxSec: limits.videoSec })
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}
export async function snapshotEnvelope(ctx, value) {
  const u = requireUser(ctx),
    id = crypto.randomBytes(20).toString('hex'),
    p = `snapshots/${u.id}/${id}`
  const bytes = Buffer.from(JSON.stringify(value))
  await ctx.storage.put(p, bytes, 'application/json')
  await ctx.db.query(
    "insert into ironlog.transfers(id,user_id,kind,path,data,expires,completed_at) values($1,$2,'snapshot',$3,$4,now()+interval '5 minutes',now())",
    [id, u.id, p, { size: bytes.length }],
  )
  return { url: await ctx.storage.downloadUrl(p), size: bytes.length }
}
export const storageRoutes = {
  'POST /api/media/missing': async (ctx) => {
    const u = requireUser(ctx),
      hs = ctx.body.hashes
    if (
      !Array.isArray(hs) ||
      hs.length > 1000 ||
      hs.some((h) => typeof h !== 'string' || !HASH_RE.test(h))
    )
      fail(400, 'invalid hashes')
    const found = new Set(
      (
        await rows(
          ctx.db,
          'select hash from ironlog.media where user_id=$1 and hash=any($2::text[])',
          [u.id, hs],
        )
      ).map((r) => r.hash),
    )
    return answer({ missing: hs.filter((h) => !found.has(h)), usage: await usage(ctx.db, u.id) })
  },
  'POST /api/media/upload': async (ctx) => {
    requireUser(ctx)
    if (!HASH_RE.test(ctx.body.hash || '')) fail(400, 'invalid hash')
    return answer(
      await startTransfer(ctx, 'media', {
        hash: ctx.body.hash,
        mime: ctx.body.mime,
        size: ctx.body.size,
      }),
    )
  },
  'POST /api/media/complete': async (ctx) => {
    const u = requireUser(ctx),
      r = await transfer(ctx, 'media')
    if (r.completed_at) return answer({ ok: true, usage: await usage(ctx.db, u.id) })
    const bytes = await ctx.storage.get(r.path, capFor(r.data.mime)),
      sn = sniffMedia(bytes.subarray(0, 64))
    if (bytes.length !== r.data.size) fail(400, 'file size mismatch', 'media-invalid')
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== r.data.hash)
      fail(400, 'file hash mismatch', 'hash-mismatch')
    if (!sn || sn.category !== MEDIA_TYPES[r.data.mime]?.category)
      fail(415, 'unsupported file type', 'media-type')
    if (bytes.length > capFor(sn.mime)) fail(413, 'file too large', 'media-too-large')
    await videoCheck(bytes, sn)
    const p = `media/${u.id}/${r.data.hash}.${sn.ext}`
    await ctx.storage.put(p, bytes, sn.mime)
    const state = await readProfile(ctx.db, u.id),
      referenced = state && referencedHashes(state).has(r.data.hash)
    await ctx.db.query(
      `insert into ironlog.media(user_id,hash,path,mime,size,unreferenced_since) values($1,$2,$3,$4,$5,$6)
      on conflict(user_id,hash) do update set size=excluded.size,mime=excluded.mime`,
      [u.id, r.data.hash, p, sn.mime, bytes.length, referenced ? null : new Date()],
    )
    await ctx.db.query('update ironlog.transfers set completed_at=now() where id=$1', [r.id])
    // The untrusted URL remains usable for two hours: don't delete/reuse its staging
    // name until expiry. Trusted bytes were copied, not moved into a mutable path.
    return answer({ ok: true, usage: await usage(ctx.db, u.id) })
  },
  'GET /api/media/{hash}': async (ctx) => {
    const u = requireUser(ctx),
      m = await one(
        ctx.db,
        'select path,mime,size from ironlog.media where user_id=$1 and hash=$2',
        [u.id, ctx.params.hash],
      )
    if (!m) fail(404, 'no such file', 'media-missing')
    return answer({
      url: await ctx.storage.downloadUrl(m.path),
      mime: m.mime,
      size: Number(m.size),
    })
  },
  'POST /api/media/sweep': async (ctx) => {
    const u = requireUser(ctx)
    // GC runs in a worker after rechecking the profile, not a destructive request path.
    await ctx.db.query(
      "insert into ironlog.jobs(id,kind,payload,due_at) values($1,'media-gc',$2,now()) on conflict(id) do update set due_at=now(),done_at=null",
      ['gc:' + u.id, { userId: u.id }],
    )
    return answer({ ok: true, usage: await usage(ctx.db, u.id) })
  },
  'POST /api/data/upload': async (ctx) =>
    answer(
      await startTransfer(ctx, 'snapshot', {
        size: ctx.body.size,
        mime: 'application/json',
        ...(HASH_RE.test(ctx.body.hash || '') ? { hash: ctx.body.hash } : {}),
      }),
    ),
  'POST /api/data/commit': async (ctx) => {
    const u = requireUser(ctx),
      r = await transfer(ctx, 'snapshot')
    const bytes = await ctx.storage.get(r.path, MAX_PROFILE_BYTES + 8192)
    if (bytes.length !== r.data.size) fail(400, 'snapshot size mismatch')
    if (r.data.hash && crypto.createHash('sha256').update(bytes).digest('hex') !== r.data.hash)
      fail(400, 'snapshot hash mismatch', 'hash-mismatch')
    let body
    try {
      body = JSON.parse(bytes.toString('utf8'))
    } catch {
      fail(400, 'invalid snapshot')
    }
    // Same validation, revision check and stamps as the ordinary data endpoint.
    const reply = await writeProfile(ctx.db, u, body)
    await ctx.db.query('update ironlog.transfers set completed_at=now() where id=$1', [r.id])
    return answer(reply)
  },
  'GET /api/data/snapshot': async (ctx) => {
    const u = requireUser(ctx),
      state = await readProfile(ctx.db, u.id)
    return answer(await snapshotEnvelope(ctx, { state: forClient(state), rev: state?._rev || 0 }))
  },
}
