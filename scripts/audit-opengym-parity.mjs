// Read-only source inventory. File equality is evidence of provenance, NOT feature parity.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const upstream = resolve(root, 'upstream/opengym-v1.4.5')
const pin = 'e4a68a94c42a3c17cbd560d66ce2e46a7048ab99'
const git = (...args) => execFileSync('git', ['-C', upstream, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim()
if (!existsSync(resolve(upstream, '.git')) || git('rev-parse', 'HEAD') !== pin) {
  throw new Error('Initialize the pinned source: git submodule update --init upstream/opengym-v1.4.5')
}
if (git('status', '--porcelain')) throw new Error('Upstream source must be unmodified')
const blob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
const rows = git('ls-tree', '-r', pin).split('\n').map(line => {
  const [meta, path] = line.split('\t')
  const [, type, sha] = meta.split(' ')
  // Include extensionless build files, native project formats, SVG, documentation and config
  // as well as executable source. Large binary media/fonts/build artifacts are a separate gate.
  if (type !== 'blob' || /\.(?:png|webp|jpe?g|gif|mp4|webm|ogg|mp3|m4a|wav|aac|flac|ttf|otf|woff2?|ico|icns|pdf|zip|gz|tgz|br|a|so|dylib|jar|keystore|jks|p12|cer|der)$/i.test(path)) return null
  const local = resolve(root, path)
  const bytes = existsSync(local) ? readFileSync(local) : null
  // Match repository text consistently across Linux and core.autocrlf Windows checkouts.
  // Byte-for-byte immutable imports are separately enforced by source-integrity tests.
  const localSha = bytes ? blob(Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'))) : null
  const area = path.startsWith('frontend/src/lib/') ? 'domain'
    : path.startsWith('frontend/src/') ? 'presentation'
    : /^frontend\/(ios|android|garmin|wearos)\//.test(path) || path.startsWith('watch-') ? 'native'
    : /^(api|mcp|cloudflare)\//.test(path) ? 'backend'
    : /^(catalogue|routines)\//.test(path) ? 'data' : 'support'
  return { path, area, upstreamBlob: sha, ironlogBlob: localSha,
    source: !localSha ? 'absent-at-original-path' : localSha === sha ? 'repository-text-equal' : 'different',
    verification: 'not-certified' }
}).filter(Boolean)
const counts = Object.fromEntries(['repository-text-equal', 'different', 'absent-at-original-path'].map(s => [s, rows.filter(r => r.source === s).length]))
const report = { upstream: pin, meaning: 'Read-only text-source inventory (CRLF normalized to LF). Different files include intentional IronLog customizations; absent paths can have adapters under other names. Matching source does not prove byte-level, dependency or runtime parity. Immutable imports have separate raw-blob tests. Every feature still needs call-site, data, UI and platform verification.', counts, files: rows }
// One record per line keeps the generated inventory reviewable rather than an 80k-line diff.
const { files, ...metadata } = report
const out = JSON.stringify(metadata, null, 2).replace(/\n}$/, ',\n  "files": [\n')
  + files.map(file => '    ' + JSON.stringify(file)).join(',\n') + '\n  ]\n}\n'
const target = resolve(root, 'docs/OPENGYM_SOURCE_INVENTORY.json')
if (process.argv.includes('--check')) {
  if (!existsSync(target) || readFileSync(target, 'utf8') !== out) throw new Error('Source inventory is stale; run node scripts/audit-opengym-parity.mjs --write')
} else if (process.argv.includes('--write')) writeFileSync(target, out)
else process.stdout.write(JSON.stringify({ upstream: pin, counts }) + '\n')
