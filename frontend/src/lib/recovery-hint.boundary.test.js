import { expect, it } from 'vitest'
import { recoveryHint } from './recovery-hint.js'
import { recoveryHint as originalHint } from './opengym-v145/recovery-hint.js'
import { auditCompleteProfilePreservation } from './migration-audit.js'

const today = '2026-10-28', now = new Date(2026, 9, 28, 9).getTime()
const work = (ago, ids) => ({ id: ago + '-' + ids.join(), d: `2026-10-${String(28-ago).padStart(2,'0')}`, start: new Date(2026,9,28-ago,18).getTime(),
 entries: ids.map(id => ({ id, sets: Array.from({ length: 5 }, () => ({ w: 60, r: 8, done: true, note: 'א'.repeat(500), media: [{ hash: 'keep' }] })) })) })
const upper = n => work(n, ['0025','0027','0091']), legs = n => work(n, ['0043','0085'])
const fixture = () => ({ unit: 'kg', recoveryHint: true, workouts: [upper(20),legs(12),upper(10),legs(9),upper(3)], routines: [], week: {}, dayPlan: {}, customSetting: { value: false } })

it('projects old deltoid fatigue read-only while retaining IronLog opt-in and the original default', () => {
 const S = fixture(); S.dayPlan[today] = 'rest'
 const fatigue = Object.freeze({ deltoids: .8 })
 const before = structuredClone(S)
 expect(recoveryHint(S, { now, today, fatigue })).toMatchObject({ kind: 'rest', region: 'upper' })
 expect(fatigue).toEqual({ deltoids: .8 })
 expect(auditCompleteProfilePreservation(before, S).ok).toBe(true)
 const split = { 'front-delts': .8, 'side-delts': .8, 'rear-delts': .8 }
 expect(originalHint({ ...S, recoveryHint: undefined }, { now, today, fatigue: split })).toMatchObject({ kind: 'rest', region: 'upper' })
 expect(recoveryHint({ ...S, recoveryHint: undefined }, { now, today, fatigue })).toBeNull()
})
it('respects explicit split values instead of overwriting them with a legacy aggregate', () => {
 const S = fixture(); S.dayPlan[today] = 'rest'
 const fatigue = Object.freeze({ deltoids: .9, 'front-delts': 0, 'side-delts': 0, 'rear-delts': 0 })
 expect(recoveryHint(S, { now, today, fatigue })).toBeNull()
})
it('recent stored sport prevents a false legs-neglected hint without changing any profile fields', () => {
 const S = fixture()
 expect(recoveryHint(S, { now, today })).toEqual({ kind: 'neglect', group: 'legs', days: 9 })
 S.activities = { football: { d: '2026-10-26', sport: 'football', min: 90, at: new Date(2026,9,26,18).getTime(), _ts: 1 } }
 const before = structuredClone(S)
 expect(recoveryHint(S, { now, today })?.group).not.toBe('legs')
 expect(auditCompleteProfilePreservation(before, S).ok).toBe(true)
})
