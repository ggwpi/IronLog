import { describe, expect, it } from 'vitest'
import { buildSessionEntries } from './session-start.js'
import { isDeloadDay, deloadSets, setDeloadEvery, skipDeload } from './deload-cycle.js'
import { assertUserDataPreserved } from './migration-audit.js'

const routine = { id: 'r1', name: 'Push', ex: [
  { id: '0025', sets: 3, reps: 5, weight: 100 },
  { id: '0043', sets: 4, reps: 6, weight: 80 },
] }
const base = () => ({
  weekStart: 1, unit: 'kg', workouts: [{
    id: 'w-old', d: '2026-11-16', start: 1794830400000,
    entries: [{ id: '0025', sets: [{ w: 100, r: 5, done: true }] }],
  }],
  routines: [routine], bodyweight: [{ d: '2026-11-16', w: 75 }],
  exWeights: {}, active: { d: '2026-11-25' },
})

describe('IronLog planned-workout deload integration: non-destructive', () => {
  it('does not alter the original workout behavior for profiles without deload enabled', () => {
    const original = base()
    const baseline = buildSessionEntries(original, routine)
    const explicitlyOff = buildSessionEntries({ ...original, deloadCycle: { auto: false } }, routine)
    expect(explicitlyOff).toEqual(baseline)
    expect(baseline.every(e => !e.noProg)).toBe(true)
  })

  it('reduces only future planned work and never changes history, routines or user weights', () => {
    const profile = base()
    const before = structuredClone(profile)
    setDeloadEvery(profile, 4, '2026-11-04')
    expect(isDeloadDay(profile, '2026-11-25')).toBe(true)
    const entries = buildSessionEntries(profile, routine)
    expect(entries).toHaveLength(2)
    expect(entries.map(e => e.sets.filter(s => s.phase !== 'warmup' && !s.warmup).length)).toEqual([
      deloadSets(3), deloadSets(4),
    ])
    expect(entries.every(e => e.noProg === true && e.plan.kind === 'deloadweek')).toBe(true)
    expect(entries.map(e => e.planned.sets)).toEqual([3, 4])
    expect(entries[0].sets.filter(s => s.phase !== 'warmup' && !s.warmup).map(s => s.w)).toEqual([100, 100])
    expect(assertUserDataPreserved(before, profile)).toBe(true)
    expect(profile.workouts).toEqual(before.workouts)
    expect(profile.routines).toEqual(before.routines)
    expect(profile.bodyweight).toEqual(before.bodyweight)
  })

  it('skipped deload weeks return to original prescription, never rewrite existing rows', () => {
    const S = base()
    setDeloadEvery(S, 4, '2026-11-04')
    skipDeload(S, '2026-11-23')
    expect(isDeloadDay(S, '2026-11-25')).toBe(false)
    const result = buildSessionEntries(S, routine)
    expect(result.every(e => !e.noProg && e.plan.kind !== 'deloadweek')).toBe(true)
  })

  it('never applies deload to a routine excluded from progression', () => {
    const S = base()
    setDeloadEvery(S, 4, '2026-11-04')
    const excluded = { ...routine, excludeFromProgression: true }
    const entries = buildSessionEntries(S, excluded)
    expect(entries.every(e => e.noProg === true && e.plan.kind === 'off')).toBe(true)
    expect(entries[0].planned.sets).toBe(3)
  })
})
