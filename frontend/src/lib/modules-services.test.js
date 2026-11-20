import { expect, it } from 'vitest'
import { coachAvailable } from './coach.js'
import { mayBeDue, mayHaveNews } from './coach-schedule.js'
import { watchExtras } from './watch-sync.js'
it('pauses scheduled Coach work and UI gates without clearing consent, configuration or history', () => {
  const S = { modules: { coach: false }, coach: { cadence: 'weekly', consent: { agreedAt: 100 } }, workouts: [{ id: 'keep' }] }
  const before = structuredClone(S), config = { coach: { enabled: true } }, user = { id: 'u' }
  expect(coachAvailable(config, user, { state: S })).toBe(false)
  expect(mayBeDue({ S, coachLocal: { mode: 'byok' } })).toBe(false)
  expect(mayHaveNews({ S, config, user })).toBe(false)
  expect(S).toEqual(before)
  S.modules.coach = true
  expect(coachAvailable(config, user, { state: S })).toBe(true)
  expect(mayBeDue({ S, coachLocal: { mode: 'byok' } })).toBe(true)
  expect(mayHaveNews({ S, config, user })).toBe(true)
})
it('removes hidden Body data from watch settings and restores it without editing history', () => {
  const S = { modules: { body: false }, bodyweight: [{ d: '2026-11-20', w: 80 }] }, before = structuredClone(S.bodyweight)
  expect(watchExtras(S)).not.toHaveProperty('lastBw'); expect(watchExtras(S).weighIn).toBe(false)
  S.modules.body = true
  expect(watchExtras(S)).toMatchObject({ weighIn: true, lastBw: 80 }); expect(S.bodyweight).toEqual(before)
})
