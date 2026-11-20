import { afterEach, describe, expect, it } from 'vitest'
import {
  FORM_KEYS, readForm, formOf, formDays, formScore, isRough,
  withForm, checkinMode, offerCheckin, sleepRatingOf,
  dailyFormSource, registerDailyFormSource,
} from './daily-form.js'
import { formTrend, setDailyFormSource } from './deload-cycle.js'
import { STAMPED_MAPS, mergeStates, stampChange } from './sync-merge.js'
import { STAMPED_MAPS as SERVER_STAMPED_MAPS, keepUnknown } from '../../../api/sync-stamps.js'
import { auditUserDataPreservation } from './migration-audit.js'

afterEach(() => setDailyFormSource(null))

describe('openGym Daily Form original scoring model', () => {
  it('accepts only 1–5 integers and four named questions', () => {
    expect(FORM_KEYS).toEqual(['sleep', 'energy', 'sore', 'stress'])
    expect(readForm({ sleep: 2, energy: 5, sore: 6, stress: '3', other: 'private' }))
      .toEqual({ sleep: 2, energy: 5, sore: null, stress: null, lighter: null })
    expect(readForm({ _ts: 123 })).toBeNull()
    expect(readForm(null)).toBeNull()
  })
  it('inverts sore/stress and shows rough day only after two answers', () => {
    expect(formScore({ sleep: 5, energy: 5, sore: 1, stress: 1 })).toBe(5)
    expect(formScore({ sleep: 1, sore: 5 })).toBe(1)
    expect(isRough({ sleep: 1 })).toBe(false)
    expect(isRough({ sleep: 1, energy: 2 })).toBe(true)
    expect([4, 5.5, 6.2, 7.4, 8, 9].map(sleepRatingOf)).toEqual([1, 2, 3, 4, 5, 5])
  })
  it('persists daily answers additively without overwriting any prior day or workout', () => {
    const before = { workouts: [{ id: 'w1', entries: [{ id: '0025', sets: [{ w: 90, r: 6, done: true }] }] }],
      routines: [{ id: 'r1' }], dayForm: { '2026-11-13': { energy: 4, _ts: 1 } } }
    const snapshot = structuredClone(before)
    const next = { ...before, dayForm: withForm(before.dayForm, '2026-11-17', { sleep: 2, energy: 3 }, 500) }
    expect(formOf(next, '2026-11-17').sleep).toBe(2)
    expect(next.dayForm['2026-11-13']).toEqual(before.dayForm['2026-11-13'])
    expect(before).toEqual(snapshot)
    expect(auditUserDataPreservation(before, next).ok).toBe(true)
    expect(formDays(next).map(r => r.d)).toEqual(['2026-11-13', '2026-11-17'])
    const cleared = withForm(next.dayForm, '2026-11-17', {}, 600)
    expect(cleared['2026-11-17']).toEqual({ _ts: 600 })
    expect(formOf({ dayForm: cleared }, '2026-11-17')).toBeNull()
  })
  it('never interrupts existing accounts until explicitly enabled', () => {
    expect(checkinMode({}, '2026-11-17')).toBeNull()
    expect(checkinMode({ dailyForm: false }, '2026-11-17')).toBeNull()
    expect(checkinMode({ dailyForm: true }, '2026-11-17')).toBe('ask')
    expect(checkinMode({ dailyForm: true, dayForm: { '2026-11-17': { sleep: 4, _ts: 1 } } }, '2026-11-17')).toBeNull()
    expect(checkinMode({ dailyForm: true, modules: { health: false } }, '2026-11-17')).toBeNull()
    expect(offerCheckin({ workouts: Array(3).fill({}) })).toBe(true)
    expect(offerCheckin({ workouts: Array(3).fill({}), dailyForm: false })).toBe(false)
  })
  it('supplies 0..1 scores to real deload suggestion only when there are enough check-ins', () => {
    const rough = { sleep: 1, energy: 2, sore: 4, stress: 4, _ts: 1 }
    const S = { dayForm: Object.fromEntries(['2026-11-04', '2026-11-06', '2026-11-08', '2026-11-10', '2026-11-13'].map(d => [d, rough])) }
    expect(dailyFormSource(S, '2026-11-05', '2026-11-12')).toHaveLength(3)
    registerDailyFormSource()
    expect(formTrend(S, '2026-11-14')).toMatchObject({ low: true, n: 5 })
    expect(dailyFormSource({ ...S, modules: { health: false } }, '2026-11-01', '2026-11-20')).toEqual([])
  })
})

describe('Daily Form check-ins across devices and API', () => {
  it('is a stamped per-day map on client AND backend', () => {
    expect(STAMPED_MAPS).toContain('dayForm')
    expect(SERVER_STAMPED_MAPS).toContain('dayForm')
  })
  it('merges separately answered days, retains the latest answer per day, and keeps workouts', () => {
    const old = { unit: 'kg', _ts: 100, workouts: [{ id: 'w1', d: '2026-11-12', entries: [] }],
      dayForm: { '2026-11-11': { sleep: 4, _ts: 100 }, '2026-11-12': { energy: 4, _ts: 300 } } }
    const newer = { unit: 'kg', _ts: 500, workouts: [{ id: 'w2', d: '2026-11-13', entries: [] }],
      dayForm: { '2026-11-12': { energy: 1, _ts: 200 }, '2026-11-13': { sleep: 2, _ts: 500 } } }
    const merged = mergeStates(old, newer)
    expect(merged.dayForm['2026-11-11'].sleep).toBe(4)
    expect(merged.dayForm['2026-11-12'].energy).toBe(4)
    expect(merged.dayForm['2026-11-13'].sleep).toBe(2)
    expect(merged.workouts.map(w => w.id).sort()).toEqual(['w1', 'w2'])
    expect(old.dayForm['2026-11-12'].energy).toBe(4)
  })
  it('keeps daily check-ins when an older app pushes a profile without that field', () => {
    const server = {
      unit: 'kg', workouts: [{ id: 'w1', d: '2026-11-13', entries: [] }],
      dayForm: { '2026-11-13': { sleep: 5, _ts: 400 } },
    }
    const oldClient = {
      unit: 'kg', workouts: [{ id: 'w1', d: '2026-11-13', entries: [] }],
    }
    keepUnknown(server, oldClient)
    expect(oldClient.dayForm).toEqual(server.dayForm)
    expect(server.dayForm['2026-11-13'].sleep).toBe(5)
  })
  it('retains an explicitly cleared day even when another device has a stale answer', () => {
    const a = { _ts: 100, dayForm: { '2026-11-13': { sleep: 5, _ts: 100 } } }
    const b = { _ts: 200, dayForm: { '2026-11-13': { _ts: 200 } } }
    expect(formOf(mergeStates(a, b), '2026-11-13')).toBeNull()
  })
  it('stamps local preference changes without touching workouts', () => {
    const before = { _ts: 1, workouts: [{ id: 'w1', d: '2026-11-15', entries: [] }] }
    const next = structuredClone(before)
    next.dailyForm = true
    next.dayForm = withForm({}, '2026-11-17', { energy: 4 }, 100)
    const at = stampChange(before, next, 100)
    expect(at).toBeGreaterThanOrEqual(100)
    expect(next.workouts).toEqual(before.workouts)
    expect(next.dayForm['2026-11-17']._ts).toBe(100)
    // The store applies the returned timestamp to the document after stampChange.
    expect(next._ts).toBe(before._ts)
  })
})
