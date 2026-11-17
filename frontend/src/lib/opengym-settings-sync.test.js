import { describe, expect, it } from 'vitest'
import { mergeStates, stampChange } from './sync-merge.js'

// A recent workout on another phone must not replace settings that were set
// on this one. Nothing here touches a live account, database, or browser state.
const base = () => ({
  unit: 'kg', workouts: [{
    id: 'w1', d: '2026-11-17', start: 1794920400000,
    entries: [{ id: '0025', sets: [{ w: 100, r: 5, done: true }] }],
  }],
  routines: [{ id: 'r1', name: 'Plan', ex: [{ id: '0025', sets: 3, reps: 5, weight: 100 }] }],
  bodyweight: [{ d: '2026-11-17', w: 80 }],
  exWeights: {},
  _ts: 1000,
})

describe('upstream fields across IronLog multi-device sync', () => {
  it('keeps a later deload/target preference when another device logs a workout', () => {
    const original = base()
    const latestPrefs = structuredClone(original)
    latestPrefs.deloadCycle = { every: 4, from: '2026-11-16' }
    latestPrefs.muscleTargets = { chest: [12, 17] }
    latestPrefs.showWeeklySetsHome = true
    stampChange(original, latestPrefs, 3000)

    const secondDevice = structuredClone(original)
    secondDevice._ts = 5000 // An unrelated newer workout timestamp
    secondDevice.workouts.push({
      id: 'w2', d: '2026-11-18', start: 1795006800000,
      entries: [{ id: '0043', sets: [{ w: 80, r: 6, done: true }] }],
    })
    const merged = mergeStates(latestPrefs, secondDevice)
    expect(merged.deloadCycle).toEqual(latestPrefs.deloadCycle)
    expect(merged.muscleTargets).toEqual(latestPrefs.muscleTargets)
    expect(merged.showWeeklySetsHome).toBe(true)
    expect(merged.workouts.map(w => w.id)).toEqual(['w1', 'w2'])
    expect(merged.routines).toEqual(original.routines)
  })

  it('honors a newer explicit opt-out without deleting an earlier workout', () => {
    const original = base()
    const enabled = structuredClone(original)
    enabled.deloadCycle = { every: 4, from: '2026-11-16', auto: false }
    stampChange(original, enabled, 3000)
    const disabled = structuredClone(enabled)
    delete disabled.deloadCycle
    stampChange(enabled, disabled, 5000)

    const merged = mergeStates(enabled, disabled)
    expect(merged.deloadCycle).toBeUndefined()
    expect(merged.workouts).toEqual(original.workouts)
    expect(merged.bodyweight).toEqual(original.bodyweight)
  })
})
