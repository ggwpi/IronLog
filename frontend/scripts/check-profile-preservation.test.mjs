import { mkdtempSync, writeFileSync, readFileSync, unlinkSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { afterEach, beforeEach, expect, it } from 'vitest'

const cli = fileURLToPath(new URL('../../scripts/check-ironlog-profile-preservation.mjs', import.meta.url))
let dir, beforeFile, afterFile
beforeEach(() => {
 dir = mkdtempSync(join(tmpdir(), 'ironlog-preservation-fixture-'))
 beforeFile = join(dir, 'before.json'); afterFile = join(dir, 'after.json')
})
afterEach(() => {
 // Only the two explicitly created fixture files; no recursive directory removal.
 for (const file of [beforeFile, afterFile]) { try { unlinkSync(file) } catch {} }
 rmdirSync(dir)
})
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' })

it('checks actual local JSON files, exits successfully and leaves both files byte-identical', () => {
 const before = { _ts: 100, workouts: [{ id: 'keep', note: 'א'.repeat(500) }], unknown: { enabled: false } }
 const a = JSON.stringify(before), b = JSON.stringify({ ...before, _ts: 101, newFeature: true })
 writeFileSync(beforeFile, a); writeFileSync(afterFile, b)
 const result = run(beforeFile, afterFile)
 expect(result.status).toBe(0); expect(JSON.parse(result.stdout)).toEqual({ ok: true, issues: [] })
 expect(readFileSync(beforeFile, 'utf8')).toBe(a); expect(readFileSync(afterFile, 'utf8')).toBe(b)
})
it('refuses dropped custom settings without printing personal source values or changing files', () => {
 const a = JSON.stringify({ custom: 'private-fixture-value', workouts: [] }), b = JSON.stringify({ workouts: [] })
 writeFileSync(beforeFile, a); writeFileSync(afterFile, b)
 const result = run(beforeFile, afterFile)
 expect(result.status).toBe(1); expect(JSON.parse(result.stdout).issues).toEqual(['custom: field removed'])
 expect(result.stdout + result.stderr).not.toContain('private-fixture-value')
 expect(readFileSync(beforeFile, 'utf8')).toBe(a); expect(readFileSync(afterFile, 'utf8')).toBe(b)
})
it('reports invalid or unavailable inputs without logging raw JSON parse errors', () => {
 writeFileSync(beforeFile, '{"secret":"private-fixture-value"'); writeFileSync(afterFile, '{}')
 let result = run(beforeFile, afterFile)
 expect(result.status).toBe(2); expect(result.stdout + result.stderr).not.toContain('private-fixture-value')
 expect(readFileSync(beforeFile, 'utf8')).toBe('{"secret":"private-fixture-value"')
 result = run(resolve(dir, 'missing.json'), afterFile)
 expect(result.status).toBe(2)
 expect(result.stderr).toContain('No files were changed')
})
it('rejects missing arguments and invalid profile shapes without rewriting anything', () => {
 expect(run().status).toBe(2)
 writeFileSync(beforeFile, '[]'); writeFileSync(afterFile, '{}')
 const result = run(beforeFile, afterFile)
 expect(result.status).toBe(1)
 expect(JSON.parse(result.stdout).issues).toEqual(['profile: expected two complete JSON objects'])
 expect(readFileSync(beforeFile, 'utf8')).toBe('[]')
})
