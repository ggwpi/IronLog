import { describe, expect, it } from 'vitest'
import { SET_TAGS, setTagOf, withSetTag, setTagCell } from './set-tags.js'
import { mergeStates, stampChange, stampWorkout } from './sync-merge.js'
import { buildCompletedWorkout } from './finish-workout.js'
import { assertUserDataPreserved } from './migration-audit.js'

describe('original set tags at IronLog data boundaries', () => {
  it('has six unique shapes and ignores unknown tags without changing the source row', () => {
    expect(new Set(SET_TAGS.map(t => t.shape)).size).toBe(6)
    const row = { w: 60, r: 8, done: true, media: [{ hash: 'fixture-video' }], note: 'IronLog custom note' }
    for (const tag of SET_TAGS) {
      const next = withSetTag(row, tag.id)
      expect(setTagCell(next)).toBe(tag.id)
      expect(withSetTag(next, null)).toEqual(row)
    }
    expect(row).not.toHaveProperty('tag')
    expect(setTagOf({ tag: 'future-tag' })).toBeNull()
    expect(withSetTag(row, 'unknown')).toEqual(row)
  })

  it.each([
    { w: 60, r: 8, done: true, phase: 'warmup' },
    { min: 20, speed: 8, incline: 2, done: true },
    { sec: 30, w: 0, done: true, side: 'L' },
    { side: true, done: true, sides: { L: { w: 10, r: 5, done: true }, R: { w: 12, r: 6, done: true } } },
    { w: 60, r: 8, done: true, drops: [{ w: 40, r: 4, done: true }] },
  ])('keeps all original fields through finish, JSON backup and two-device merge: %j', row => {
    const active = { id: 'fixture-session', d: '2026-11-18', start: 1000, name: 'Fixture workout', bw: null, entries: [{ id: 'custom-fixture', target: { mode: 'reps' }, sets: [withSetTag(row, 'blue')] }] }
    const completed = buildCompletedWorkout(active, { end: 5000 })
    expect(completed.entries[0].sets[0]).toEqual({ ...row, tag: 'blue' })
    const base = { unit: 'kg', workouts: [stampWorkout(completed, 5000)], routines: [], bodyweight: [], customEx: [], _ts: 5000 }
    const backup = JSON.parse(JSON.stringify(base))
    assertUserDataPreserved(base, backup)
    const phone = structuredClone(backup), desktop = structuredClone(backup)
    phone.workouts[0].entries[0].sets[0] = withSetTag(phone.workouts[0].entries[0].sets[0], 'green')
    stampWorkout(phone.workouts[0], 6000)
    phone._ts = stampChange(base, phone, 6000)
    desktop.restSec = 120
    desktop._ts = stampChange(base, desktop, 7000)
    const merged = mergeStates(phone, desktop)
    expect(merged.workouts[0].entries[0].sets[0]).toEqual({ ...row, tag: 'green' })
    expect(merged.restSec).toBe(120)
    expect(merged.workouts[0].entries[0].id).toBe('custom-fixture')
  })
})
