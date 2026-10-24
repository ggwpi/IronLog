// Cloud-only transport: no redirects, no LAN/metadata endpoints, bounded replies.
// DNS is checked by the HTTPS agent at connect time, including rebinding.
import crypto from 'node:crypto'
import https from 'node:https'
import { PUSH_AGENT, pushEndpointError } from './push-security.js'
import { HTTP_PROVIDERS, validateBaseUrl } from '../coach/core/providers.js'
import anthropic from '../coach/core/adapters/anthropic.js'
import openai from '../coach/core/adapters/openai.js'
import gemini from '../coach/core/adapters/gemini.js'
import compatible from '../coach/core/adapters/compatible.js'
export const ADAPTERS = { anthropic, openai, gemini, compatible }
export function encryptionKey() {
  const raw = process.env.IRONLOG_COACH_KEY || ''
  if (!/^[a-f0-9]{64}$/i.test(raw))
    throw new Error('Coach encryption is not configured')
  return Buffer.from(raw, 'hex')
}
export function sealKey(uid, provider, value, key = encryptionKey()) {
  const iv = crypto.randomBytes(12),
    cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(`ironlog-coach-v1:${uid}:${provider}`))
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), body]
    .map((b) => b.toString('base64url'))
    .join('.')
}
export function openKey(uid, provider, value, key = encryptionKey()) {
  const [iv, tag, body] = value
    .split('.')
    .map((s) => Buffer.from(s, 'base64url'))
  const cipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(`ironlog-coach-v1:${uid}:${provider}`))
  cipher.setAuthTag(tag)
  return Buffer.concat([cipher.update(body), cipher.final()]).toString('utf8')
}
export function settingsOf(body) {
  const provider = body.provider
  if (!Object.hasOwn(ADAPTERS, provider)) throw new Error('invalid provider')
  const base =
    provider === 'compatible'
      ? body.baseUrl
      : HTTP_PROVIDERS[provider].defaultBase
  const valid = validateBaseUrl(base)
  if (!valid.ok || !valid.value || pushEndpointError(valid.value))
    throw new Error('invalid endpoint')
  const url = new URL(valid.value)
  if (url.port && url.port !== '443') throw new Error('HTTPS port required')
  return {
    provider,
    baseUrl: valid.value,
    model:
      typeof body.model === 'string' ? body.model.trim().slice(0, 150) : '',
  }
}
export const cfgOf = (s) => ({
  provider: s.provider,
  providerOptions: { [s.provider]: { baseUrl: s.baseUrl } },
})
export const envOf = (s, key) => ({
  [HTTP_PROVIDERS[s.provider].apiKeyEnv]: key,
})
export function providerFetch(raw, init = {}) {
  return new Promise((resolve, reject) => {
    const error = pushEndpointError(raw)
    if (error) return reject(new Error('Provider endpoint is not allowed'))
    if (init.signal?.aborted)
      return reject(new DOMException('Aborted', 'AbortError'))
    const req = https.request(
      raw,
      {
        method: init.method || 'GET',
        headers: init.headers,
        agent: PUSH_AGENT,
        signal: init.signal,
      },
      (res) => {
        // Never follow a redirect carrying a user's Authorization/API-key header.
        const parts = []
        let size = 0
        res.on('data', (b) => {
          size += b.length
          if (size > 2 * 1024 * 1024)
            res.destroy(new Error('Provider response too large'))
          else parts.push(b)
        })
        res.on('error', reject)
        res.on('end', () => {
          try {
            resolve(
              new Response(
                [204, 205, 304].includes(res.statusCode)
                  ? null
                  : Buffer.concat(parts),
                {
                  status: res.statusCode,
                  headers: {
                    'content-type':
                      res.headers['content-type'] || 'application/json',
                  },
                }
              )
            )
          } catch (e) {
            reject(e)
          }
        })
      }
    )
    req.setTimeout(90000, () =>
      req.destroy(new DOMException('Timed out', 'AbortError'))
    )
    req.on('error', reject)
    req.end(init.body)
  })
}
