import { describe, expect, it } from 'vitest'
import { isOn, MODULE_IDS, applyPreset, setModule, presetOf } from './modules.js'
import { stampChange, mergeStates, stampRestore } from './sync-merge.js'

const original = () => ({
  unit: 'kg', _ts: 1000,
  workouts: [{ id: 'kept', d: '2026-11-18', entries: [{ id: 'custom-1', sets: [{ w: 50, r: 8, done: true }] }], media: [{ hash: 'media-hash' }] }],
  routines: [{ id: 'plan-id', name: 'Keep', ex: [{ id: 'custom-1', sets: 3, reps: 8, weight: 50 }] }],
  customEx: [{ id: 'custom-1', n: 'Custom', bp: 'chest' }],
  bodyweight: [{ d: '2026-11-18', w: 80 }], exWeights: {}, week: {}, dayPlan: {},
})

describe('unmodified openGym modules through IronLog cloud-state stamps', () => {
  it('does not switch existing IronLog customizations or data off for an older profile', () => {
    const before = original(), copy = structuredClone(before)
    for (const id of MODULE_IDS) expect(isOn(before, id)).toBe(true)
    expect(presetOf(before)).toBe('all')
    expect(before).toEqual(copy)
    expect(isOn({ ...before, checkIn: false }, 'checkin')).toBe(false)
    expect(isOn({ ...before, checkIn: false, modules: { checkin: true } }, 'checkin')).toBe(true)
  })

  it('keeps each device\'s separate module setting instead of losing one to a later unrelated write', () => {
    const base = original()
    const phone = structuredClone(base), laptop = structuredClone(base)
    setModule(phone, 'body', false); phone._ts = stampChange(base, phone, 3000)
    setModule(laptop, 'coach', false); laptop._ts = stampChange(base, laptop, 4000)
    expect(phone.edited['modules.body']).toBe(3000)
    expect(laptop.edited['modules.coach']).toBe(4000)
    const anotherWorkout = structuredClone(laptop)
    anotherWorkout.workouts.push({ id: 'new-workout', d: '2026-11-19', entries: [] })
    anotherWorkout._ts = stampChange(laptop, anotherWorkout, 5000)
    const merged = mergeStates(phone, anotherWorkout)
    expect(merged.modules).toMatchObject({ body: false, coach: false })
    expect(merged.workouts.map(x => x.id)).toEqual(['kept', 'new-workout'])
    expect(merged.workouts[0].media).toEqual(base.workouts[0].media)
    expect(merged.routines).toEqual(base.routines)
    expect(merged.customEx).toEqual(base.customEx)
    expect(merged.bodyweight).toEqual(base.bodyweight)
    expect(phone.workouts).toEqual(base.workouts)
  })

  it('honors a later switch for one module without resetting the other', () => {
    const base = original(), a = structuredClone(base), b = structuredClone(base)
    setModule(a, 'checkin', false); a._ts = stampChange(base, a, 3000)
    setModule(b, 'checkin', true); b._ts = stampChange(base, b, 5000)
    setModule(b, 'body', false); b._ts = stampChange(a, b, 6000)
    const merged = mergeStates(a, b)
    expect(isOn(merged, 'checkin')).toBe(true)
    expect(isOn(merged, 'body')).toBe(false)
    expect(merged.workouts).toEqual(base.workouts)
  })

  it('restored backup stamps each module independently, preserving user history', () => {
    const saved = original(), restored = structuredClone(saved)
    applyPreset(restored, 'training')
    stampRestore(restored, [saved], 9000)
    expect(restored.edited['modules.body']).toBe(9000)
    expect(restored.edited['modules.coach']).toBe(9000)
    expect(restored.workouts).toEqual(saved.workouts)
    expect(restored.routines.map(({ _ts, ...r }) => r)).toEqual(saved.routines)
    expect(restored.routines[0]._ts).toBe(9000) // Restoring correctly stamps the routine, without editing any of its content
  })
})
