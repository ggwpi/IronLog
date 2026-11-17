import { describe, expect, it } from 'vitest'
import { muscleWeightsOf, musclesOf } from './muscles-v145.js'
import { weeklyMuscleSets, withTarget } from './muscle-targets.js'
import { auditUserDataPreservation } from './migration-audit.js'

describe('isolated 1.4.5 muscle targets are safe for legacy IronLog', () => {
  it('reads legacy generic shoulder and back metadata into the split muscles', () => {
    const shoulders = muscleWeightsOf({ id: 'old-custom-shoulders', custom: true, bp: 'shoulders', tg: 'deltoids' })
    expect(shoulders['front-delts']).toBeGreaterThan(0)
    expect(shoulders['side-delts']).toBeGreaterThan(0)
    expect(shoulders['rear-delts']).toBeGreaterThan(0)

    const back = musclesOf({ id: 'old-custom-back', custom: true, bp: 'back', tg: 'upper-back' })
    expect(back['lats']).toBeGreaterThan(0)
    expect(back['upper-back']).toBeGreaterThan(0)
  })

  it('does not mutate workouts, snapshots, units or stored user settings while calculating', () => {
    const profile = {
      unit: 'kg', weekStart: 1,
      workouts: [{
        id: 'original-workout', d: '2026-11-16', start: 1794830400000,
        entries: [{ id: 'old-custom-back', exercise: { id: 'old-custom-back', custom: true, bp: 'back', tg: 'upper-back' },
          sets: [{ w: 35, r: 12, done: true }] }],
      }],
      routines: [{ id: 'routine', name: 'Back' }],
      bodyweight: [{ d: '2026-11-16', w: 76 }],
      muscleTargets: { chest: [12, 18] },
    }
    const before = structuredClone(profile)
    const rows = weeklyMuscleSets(profile, '2026-11-17')
    expect(rows.find(r => r.slug === 'lats')?.sets).toBeGreaterThan(0)
    expect(rows.find(r => r.slug === 'upper-back')?.sets).toBeGreaterThan(0)
    expect(profile).toEqual(before)
    expect(auditUserDataPreservation(before, profile).ok).toBe(true)
  })

  it('adding a muscle target is strictly additive and never overwrites the legacy model', () => {
    const old = { chest: [12, 18], deltoids: [8, 16], 'upper-back': [10, 18] }
    // An explicit default is deliberately removed by upstream withTarget.
    // An actual personal override MUST be retained without rewriting legacy keys.
    const next = withTarget(old, 'front-delts', [5, 13])
    expect(next).toMatchObject({ chest: [12, 18], deltoids: [8, 16], 'upper-back': [10, 18], 'front-delts': [5, 13] })
    const defaults = withTarget(next, 'front-delts', [4, 12])
    expect(defaults).toEqual(old)
    expect(old).toEqual({ chest: [12, 18], deltoids: [8, 16], 'upper-back': [10, 18] })
  })
})
