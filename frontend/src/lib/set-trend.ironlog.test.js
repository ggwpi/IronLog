import { describe, expect, it } from 'vitest'
import { setTrend, setTrendsFor, setTrendOn, trendGlyph, lastTimeBefore } from './set-trend.js'
const done = (w, r) => ({ w, r, done: true })
const workout = (id, d, w) => ({ id, d, start: new Date(d + 'T10:00:00').getTime(), entries: [{ id: '0025', target: { mode: 'reps' }, sets: [done(w, 8)] }] })
describe('IronLog set trends are opt-in, read-only and preserve data', () => {
  it('keeps existing IronLog visuals unchanged until enabled', () => {
    expect(setTrendOn({})).toBe(false)
    expect(setTrendOn({ setTrend: false })).toBe(false)
    expect(setTrendOn({ setTrend: true })).toBe(true)
  })
  it('uses only the earlier log without annotating or rewriting workouts', () => {
    const w1 = workout('a', '2026-10-01', 60), w2 = workout('b', '2026-10-08', 65), w3 = workout('c', '2026-10-15', 70)
    const S = { workouts: [w1, w2, w3] }, before = JSON.stringify(S)
    const last = lastTimeBefore(S, w2, w2.entries[0])
    expect(last.sets[0].w).toBe(60)
    expect(setTrendsFor(w2.entries[0], last).map(trendGlyph)).toEqual(['↑'])
    expect(lastTimeBefore(S, w1, w1.entries[0])).toBeNull()
    expect(JSON.stringify(S)).toBe(before)
  })
  it('leaves warm-ups and unfinished rows unmarked', () => {
    const entry = { id: '0025', target: { mode: 'reps' }, sets: [{ w: 30, r: 8, done: true, phase: 'warmup' }, done(70, 8), { w: 70, r: 8, done: false }] }
    expect(setTrendsFor(entry, { sets: [done(65, 8)] }).map(trendGlyph)).toEqual(['', '↑', ''])
    expect(setTrend(done(80, 8), done(80, 8)).dir).toBe(0)
  })
})
