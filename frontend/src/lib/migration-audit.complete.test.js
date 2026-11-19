import { describe, it, expect } from 'vitest'
import { auditCompleteProfilePreservation } from './migration-audit.js'

const fixture = () => ({
  _ts: 100, _rev: 2, lang: 'he', theme: 'light', accent: 'custom',
  reminder: { on: true, time: '08:30', tone: 'quiet' }, modules: { health: false, unknown: { preserved: true } },
  cardioGoal: 150, cardioGoals: [{ kind: 'run', unit: 'km', v: 10 }],
  activities: { original: { d: '2026-11-19', min: 30, _ts: 12 } }, bands: [{ id: 'band', unknown: 'keep' }],
  workouts: [{ id: 'w', d: '2026-11-18', entries: [{ id: 'custom', sets: [{ w: 60, r: 8, tempo: '5-0-X-0', note: 'א'.repeat(500), media: [{ hash: 'keep' }] }] }] }],
  customFutureField: { nested: [{ id: 'unknown-user-owned-id', enabled: false }], privateValue: 'fixture-private-value' },
  active: { id: 'offline', pending: true }, deleted: { workouts: ['old-id'] },
})

describe('complete migration snapshot gate', () => {
 it('accepts additive schema fields and monotonic protocol clocks without mutating either snapshot', () => {
  const before = fixture(), after = structuredClone(before)
  after._ts++; after._rev++; after.newFeature = { on: false }; after.workouts[0].newHint = true
  const a = JSON.stringify(before), b = JSON.stringify(after)
  expect(auditCompleteProfilePreservation(before, after)).toEqual({ ok: true, issues: [] })
  expect(JSON.stringify(before)).toBe(a); expect(JSON.stringify(after)).toBe(b)
 })
 it.each(['lang','theme','accent','reminder','modules','cardioGoal','cardioGoals','activities','bands','customFutureField','active','deleted'])('rejects a dropped %s, including fields outside the old selected-field list', field => {
  const before = fixture(), after = structuredClone(before); delete after[field]
  expect(auditCompleteProfilePreservation(before, after)).toEqual({ ok: false, issues: [field + ': field removed'] })
 })
 it('rejects nested custom-setting and unknown-field edits without logging their values', () => {
  const before = fixture(), after = structuredClone(before)
  after.customFutureField.privateValue = 'different-private-value'; after.modules.unknown.preserved = false
  const result = auditCompleteProfilePreservation(before, after)
  expect(result.ok).toBe(false)
  expect(result.issues.join()).toContain('customFutureField.privateValue')
  expect(JSON.stringify(result)).not.toContain('fixture-private-value')
  expect(JSON.stringify(result)).not.toContain('different-private-value')
 })
 it.each(['_ts','_rev'])('rejects deletion, regression or type conversion of %s', field => {
  for (const change of [s => delete s[field], s => s[field]--, s => s[field] = String(s[field])]) {
   const before = fixture(), after = structuredClone(before); change(after)
   expect(auditCompleteProfilePreservation(before, after).ok).toBe(false)
  }
 })
 it('retains malformed legacy clock values exactly rather than sanitizing them', () => {
  const before = { _ts: null, _rev: 'legacy' }
  expect(auditCompleteProfilePreservation(before, structuredClone(before)).ok).toBe(true)
  expect(auditCompleteProfilePreservation(before, { _ts: 0, _rev: 0 }).ok).toBe(false)
 })
 it('rejects missing/reordered records and changed media or long notes', () => {
  const before = fixture(), after = structuredClone(before)
  after.workouts[0].entries[0].sets[0].media[0].hash = 'different'
  after.workouts[0].entries[0].sets[0].note = 'א'.repeat(140)
  expect(auditCompleteProfilePreservation(before, after).issues).toHaveLength(2)
  expect(auditCompleteProfilePreservation({ ids: ['a','b'] }, { ids: ['b','a'] }).ok).toBe(false)
 })
 it('handles arbitrary JSON keys without reading inherited replacement values', () => {
  const before = JSON.parse('{"__proto__":{"value":"keep"},"constructor":"keep"}')
  expect(auditCompleteProfilePreservation(before, {}).ok).toBe(false)
  expect(auditCompleteProfilePreservation(before, JSON.parse(JSON.stringify(before))).ok).toBe(true)
 })
 it.each([null, [], undefined, { bad: undefined }, { bad: NaN }, { bad: Infinity }, { bad: new Date() }, { bad: new Map() }, { bad: () => {} }])('rejects incomplete or non-JSON snapshots %#', value => {
  expect(auditCompleteProfilePreservation(value, {}).ok).toBe(false)
  expect(auditCompleteProfilePreservation({}, value).ok).toBe(false)
 })
 it('rejects cycles and sparse/decorated arrays but accepts JSON-compatible shared references', () => {
  const cyclic = {}; cyclic.self = cyclic
  expect(auditCompleteProfilePreservation(cyclic, {}).ok).toBe(false)
  expect(auditCompleteProfilePreservation({ bad: Array(2) }, {}).ok).toBe(false)
  const array = [1]; array.extra = true
  expect(auditCompleteProfilePreservation({ bad: array }, {}).ok).toBe(false)
  const shared = { value: true }, before = { a: shared, b: shared }
  expect(auditCompleteProfilePreservation(before, JSON.parse(JSON.stringify(before))).ok).toBe(true)
 })
 it('bounds issue output instead of dumping a damaged snapshot', () => {
  const before = Object.fromEntries(Array.from({ length: 200 }, (_, i) => ['field' + i, 'private']))
  const result = auditCompleteProfilePreservation(before, {})
  expect(result.ok).toBe(false); expect(result.issues).toHaveLength(100)
  expect(JSON.stringify(result)).not.toContain('private')
 })
 it('rejects accessor, symbol and hidden properties without executing a getter', () => {
  let reads = 0
  const accessor = {}; Object.defineProperty(accessor, 'value', { enumerable: true, get() { reads++; return 'private' } })
  const hidden = {}; Object.defineProperty(hidden, 'value', { value: 'private' })
  const symbol = { [Symbol('private')]: true }
  for (const value of [accessor, hidden, symbol]) expect(auditCompleteProfilePreservation(value, {}).ok).toBe(false)
  expect(reads).toBe(0)
 })
})
