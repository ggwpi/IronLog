import { describe, it, expect } from 'vitest'
import { auditUserDataPreservation, assertUserDataPreserved } from './migration-audit.js'

const original = () => ({
  unit: 'kg',
  workouts: [
    { id: 'w1', d: '2026-10-21', entries: [{ id: 'squat', sets: [{ w: 85, r: 6, done: true, media: [{ hash: 'clip1' }] }] }] },
    { id: 'w2', d: '2026-10-22', entries: [{ id: 'curl', sets: [{ w: 16, r: 12, done: true }] }] },
  ],
  routines: [{ id: 'r1', name: 'Leg day', exercises: [{ id: 'squat', sets: 3 }] }],
  bodyweight: [{ d: '2026-10-21', w: 79.5 }],
  measurements: [{ d: '2026-10-21', waist: 82 }],
  customEx: [{ id: 'c1', n: 'Custom exercise', photo: 'local-hash' }],
  dayPhotos: { '2026-10-21': [{ hash: 'p1' }] },
  gymCards: [{ id: 'gym', code: 'redacted-in-fixture' }],
  exWeights: { squat: { w: 85 } },
  active: { id: 'pending-session', entries: [] },
  queue: { ids: ['r1'] },
})

describe('read-only user data preservation audit', () => {
  it('accepts an unchanged snapshot and additive fields without mutation', () => {
    const before = original()
    const after = structuredClone(before)
    after.workouts[0].entries[0].sets[0].newDisplayHint = 'optional'
    after.newUpstreamFeature = { enabled: true }
    const frozenCopy = JSON.stringify(before)
    expect(auditUserDataPreservation(before, after)).toEqual({ ok: true, issues: [] })
    expect(JSON.stringify(before)).toBe(frozenCopy)
  })

  it('rejects dropped workouts, edited weights and dates', () => {
    const before = original()
    const missing = structuredClone(before)
    missing.workouts.pop()
    expect(auditUserDataPreservation(before, missing).issues.join()).toContain('workouts')
    const changed = structuredClone(before)
    changed.workouts[0].entries[0].sets[0].w = 80
    changed.workouts[1].d = '2026-10-23'
    expect(auditUserDataPreservation(before, changed).issues.join()).toContain('original value changed')
    expect(() => assertUserDataPreserved(before, changed)).toThrow('Unsafe IronLog migration')
  })

  it('rejects removed media references, missing measurements, settings and active sessions', () => {
    const before = original()
    const after = structuredClone(before)
    delete after.workouts[0].entries[0].sets[0].media
    delete after.measurements
    delete after.unit
    after.active = null
    const paths = auditUserDataPreservation(before, after).issues.join('|')
    expect(paths).toContain('media')
    expect(paths).toContain('measurements')
    expect(paths).toContain('unit')
    expect(paths).toContain('active')
  })

  it('does not confuse a missing historical field with a newly added one', () => {
    expect(assertUserDataPreserved({ workouts: [] }, { workouts: [], bodyweight: [] })).toBe(true)
    expect(auditUserDataPreservation({}, null).ok).toBe(false)
  })
})
