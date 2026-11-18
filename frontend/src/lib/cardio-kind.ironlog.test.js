import { describe, expect, it } from 'vitest'
import { cardioStartSpeed, kindOfName } from './cardio-kind.js'
import { defaultConfig } from './history.js'
import { EXDB } from './exercises.js'
import { toSpeed } from './speed.js'
import { mergeStates } from './sync-merge.js'

describe('unmodified openGym 1.4.5 cardio defaults through IronLog state', () => {
  it('keeps original upstream cardio classification and pace choices', () => {
    expect(kindOfName('walking on stepmill')).toBe('stairs')
    expect(kindOfName('elliptical machine walk')).toBe('elliptical')
    expect(kindOfName('high knee run')).toBeNull()
    expect(cardioStartSpeed('Walking on treadmill')).toBe(5)
    expect(cardioStartSpeed('Rennvelo')).toBe(20)
    expect(cardioStartSpeed('Schwimmen')).toBe(3)
    expect(cardioStartSpeed('Run on treadmill')).toBe(8)
  })

  it('uses the upstream default for a new cardio exercise, without replacing IronLog components', () => {
    const candidates = EXDB.filter(e => e.bp === 'cardio' && /walk|bike|cycl|swim|run/i.test(e.n))
    expect(candidates.length).toBeGreaterThan(0)
    for (const ex of candidates.slice(0, 30)) {
      const original = JSON.stringify(ex)
      const pace = cardioStartSpeed(ex.n, ex.eq)
      expect(defaultConfig(ex.id)).toEqual({ sets: 1, min: 20, speed: pace })
      expect(defaultConfig(ex.id, undefined, { unit: 'lb' }).speed).toBe(cardioStartSpeed(ex.n, ex.eq, 'mph'))
      expect(JSON.stringify(ex)).toBe(original)
    }
  })

  it('respects existing speed-unit preferences without changing original profile state', () => {
    const profile = { unit: 'lb', speedUnit: 'mph', workouts: [{ id: 'keep-w1', d: '2026-11-17', entries: [{ id: '0025', sets: [{ w: 40, r: 6, done: true }] }] }] }
    const before = structuredClone(profile)
    const walk = EXDB.find(e => e.bp === 'cardio' && /walking on treadmill/i.test(e.n)) || EXDB.find(e => e.bp === 'cardio' && /walk/i.test(e.n))
    expect(walk).toBeTruthy()
    const next = defaultConfig(walk.id, undefined, profile)
    expect(toSpeed(next.speed, 'mph')).toBe(toSpeed(cardioStartSpeed(walk.n, walk.eq, 'mph'), 'mph'))
    expect(profile).toEqual(before)
    expect(profile.workouts).toEqual(before.workouts)
  })

  it('keeps existing synced workouts, custom IDs and media references across devices', () => {
    const saved = { unit: 'kg', _ts: 1000, workouts: [
      { id: 'keep-workout', d: '2026-11-17', entries: [{ id: 'custom123', sets: [{ w: 60, r: 8, done: true }] }], media: [{ hash: 'original-hash' }] },
    ], routines: [{ id: 'keep-routine', ex: [{ id: 'custom123', sets: 3, reps: 8, weight: 60 }] }],
      bodyweight: [{ d: '2026-11-17', w: 81 }], customEx: [{ id: 'custom123', n: 'Spazieren gehen', bp: 'cardio', eq: '' }], exWeights: {} }
    const remote = structuredClone(saved), local = structuredClone(saved)
    local._ts = 2000
    const merged = mergeStates(local, remote)
    expect(merged.workouts).toEqual(saved.workouts)
    expect(merged.routines).toEqual(saved.routines)
    expect(merged.bodyweight).toEqual(saved.bodyweight)
    expect(merged.customEx).toEqual(saved.customEx)
    expect(local).toEqual({ ...saved, _ts: 2000 })
    expect(remote).toEqual(saved)
    // An upstream default returns a NEW config; the synced workout's stored sets never change.
    expect(cardioStartSpeed(saved.customEx[0].n)).toBe(5)
  })
})
