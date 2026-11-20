import { describe, expect, it } from 'vitest'
import { lifetimeTotals } from './lifetime-totals.js'

const set = (extra = {}) => ({ w: 50, r: 10, done: true, ...extra })

describe('lifetime totals from openGym (non-mutating)', () => {
  it('counts completed work sets and realistic training time, not warm-ups', () => {
    const before = { workouts: [
      { d: '2026-11-01', start: 0, end: 3600e3, entries: [{ id: 'a', sets: [set({ phase: 'warmup' }), set(), set(), set({ done: false })] }] },
      { d: '2026-11-02', start: 0, end: 30 * 60e3, entries: [{ id: 'b', sets: [set()] }] },
      { d: '2026-11-03', start: 0, end: 20 * 3600e3, entries: [{ id: 'c', sets: [set()] }] },
      { d: '2026-11-04', entries: [{ id: 'd', sets: [set()] }] },
    ] }
    const raw = JSON.stringify(before)
    expect(lifetimeTotals(before)).toEqual({ workouts: 4, sets: 5, hours: 1.5 })
    expect(JSON.stringify(before)).toBe(raw)
  })

  it('does not count unfinished or missing sessions, and handles empty profiles', () => {
    expect(lifetimeTotals({ workouts: [] })).toEqual({ workouts: 0, sets: 0, hours: 0 })
    expect(lifetimeTotals({})).toEqual({ workouts: 0, sets: 0, hours: 0 })
    expect(lifetimeTotals({ workouts: [{ d: '2026-10-01', entries: [{ sets: [{ r: 3, w: 30, done: false }] }] }] }))
      .toEqual({ workouts: 1, sets: 0, hours: 0 })
  })
})
