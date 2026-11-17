import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Verify the originally imported upstream algorithms/tests cannot silently drift.
// These are actual Git blob SHA-1 values from DuarteSantos8/openGym@e4a68a94c42a3c17cbd560d66ce2e46a7048ab99.
const blob = path => {
  const bytes = readFileSync(new URL(path, import.meta.url))
  return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')
}
describe('immutable openGym source provenance', () => {
  it('preserves upstream set trend algorithm byte-for-byte', () => {
    expect(blob('./set-trend.js')).toBe('95c4e159b916222ad75c68a44235d6239f7c9bd0')
  })
  it('preserves upstream set trend unit tests byte-for-byte', () => {
    expect(blob('./set-trend.test.js')).toBe('bfb406fcca15c37424ad384d009eb41787ec03d6')
  })
  it('preserves upstream workouts-left algorithm byte-for-byte', () => {
    expect(blob('./week-left.js')).toBe('25097c8f263823ef16c7deba574811944fab6572')
  })
  it('pins the entire original repository separately from IronLog UI', () => {
    const gitmodules = readFileSync(new URL('../../../.gitmodules', import.meta.url), 'utf8')
    expect(gitmodules).toContain('path = upstream/opengym-v1.4.5')
    expect(gitmodules).toContain('url = https://github.com/DuarteSantos8/openGym.git')
  })
})
