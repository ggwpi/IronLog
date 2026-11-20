import { expect, it } from 'vitest'
import { buildSessionEntries } from './session-start.js'
import { buildSessionEntries as originalEntries } from './opengym-v145/session-engine/frontend/src/lib/session-start.js'
import { saveProgramme, programmeById, resizeWeeks, startProgramme, endProgramme, buildStarterProgramme, starterProgrammeOptions } from './programmes.js'
import { buildProgrammeBundle, parsePlan, mergePlan } from './plan-share.js'
import { EXIDX } from './exercises.js'
import { stampEdits, mergeStates } from './sync-merge.js'
import { stampPut } from '../../../api/sync-stamps.js'
import { buildCompletedWorkout } from './opengym-v145/session-engine/frontend/src/lib/finish-workout.js'

const clone = v => structuredClone(v)
const fixture = () => ({ unit: 'kg', weekStart: 1, week: { 1: ['old'] }, workouts: [], exWeights: {},
  routines: [{ id: 'r', name: 'A', ex: [{ id: '0025', sets: 3, reps: 5, weight: 60, note: 'א'.repeat(500), future: { keep: true } }] }, { id: 'old', name: 'Existing', ex: [] }],
  bodyweight: [{ d: '2026-01-01', w: 70 }], media: { photo: 'existing' }, futureSetting: { keep: true } })
const programme = () => ({ id: 'p', name: 'Block', at: 1, days: { 2: ['r'] }, weeks: [{ rpe: 8, futureWeek: { keep: true }, t: { '0025': { pct: 75, futureTarget: 'keep' } } }] })

it('preserves existing data, future programme metadata and the previous schedule through editing and ending', () => {
  const s = fixture(), before = clone(s)
  saveProgramme(s, programme())
  const p = programmeById(s, 'p'); p.name = 'Edited'; p.weeks = resizeWeeks(p.weeks, 4); saveProgramme(s, p)
  expect(s.programmes.p.weeks[0]).toMatchObject(programme().weeks[0])
  expect(s.programmes.p.weeks[3].futureWeek).toEqual({ keep: true })
  startProgramme(s, 'p', '2026-11-16'); expect(s.week).toEqual({ 2: ['r'] })
  endProgramme(s, '2026-11-17')
  for (const [key, value] of Object.entries(before)) expect(s[key], key).toEqual(value)
})

it.each([false, true])('uses original programme targets with progression off and last-session mode=%s while retaining IronLog metadata', last => {
  const s = fixture(); s.startFrom = last ? 'last' : 'plan'; s.active = { d: '2026-11-16' }
  s.routines[0].prog = 'off'; saveProgramme(s, programme()); startProgramme(s, 'p', '2026-11-16')
  const entry = buildSessionEntries(s, s.routines[0])[0], upstream = originalEntries(s, s.routines[0])[0]
  expect(entry.plan).toEqual(upstream.plan); expect(entry.sets).toEqual(upstream.sets)
  expect(entry.target.note).toHaveLength(500); expect(entry.target.future).toEqual({ keep: true })
  s.programmes.p.weeks[0] = { deload: true }
  expect(buildSessionEntries(s, s.routines[0])[0].noProg).toBe(true)
  s.routines[0].excludeFromProgression = true
  expect(buildSessionEntries(s, s.routines[0])[0].plan.kind).toBe('off')
})

it('shares a programme under fresh IDs without replacing old data or starting it', () => {
  const source = fixture(); saveProgramme(source, programme())
  const bundle = parsePlan(JSON.stringify(buildProgrammeBundle(source, 'p')))
  const recipient = fixture(), before = clone(recipient)
  const result = mergePlan(recipient, bundle)
  expect(result.programmes).toBe(1); expect(recipient.routines.slice(0, 2)).toEqual(before.routines)
  expect(recipient.routines[2].ex[0].note).toHaveLength(500)
  expect(recipient.week).toEqual(before.week); expect(recipient.programme).toBeUndefined()
  expect(Object.values(recipient.programmes)[0].id).not.toBe('p')
})

it('every original starter references the existing IronLog catalogue and only adds new routines', () => {
  for (const option of starterProgrammeOptions()) {
    const built = buildStarterProgramme(option.id, 'Starter')
    expect(built.programme.weeks).toHaveLength(option.weeks)
    for (const r of built.routines) for (const e of r.ex) expect(EXIDX[e.id], e.id).toBeTruthy()
  }
})

it('applies the original percentage calculation against actual history and keeps saved history unchanged', () => {
  const s = fixture(); s.active = { d: '2026-11-16' }
  s.workouts = [buildCompletedWorkout({ id: 'w', d: '2026-11-01', start: 1, routineIds: ['r'],
    entries: [{ id: '0025', rid: 'r', target: { sets: 1, reps: 5, weight: 100 }, sets: [{ w: 100, r: 5, done: true }] }] }, { end: 2 })]
  saveProgramme(s, programme()); startProgramme(s, 'p', '2026-11-16')
  const entry = buildSessionEntries(s, s.routines[0])[0]
  expect(entry.target.weight).toBe(87.5)
  expect(entry.plan.prog).toMatchObject({ week: 1, weeks: 1, pct: 75, rpe: 8 })
  expect(entry.sets.filter(x => !x.warmup && x.phase !== 'warmup').map(x => x.w)).toEqual([87.5, 87.5, 87.5])
  expect(s.workouts).toHaveLength(1)
})

it('the actual API stamps programme changes per key and protects against an old client', () => {
  const base = fixture(); saveProgramme(base, programme()); saveProgramme(base, { ...programme(), id: 'q' })
  stampEdits(null, base, 1000)
  const phone = clone(base), desktop = clone(base)
  phone.programmes.p.name = 'Phone'; desktop.programmes.q.name = 'Desktop'
  stampPut(base, phone, { overRead: true, now: 2000 }); stampPut(base, desktop, { overRead: true, now: 3000 })
  const merged = mergeStates(phone, desktop)
  expect(merged.programmes.p.name).toBe('Phone'); expect(merged.programmes.q.name).toBe('Desktop')
  const old = clone(merged); delete old.programmes; delete old.programme
  stampPut(merged, old, { overRead: true, now: 4000 })
  expect(mergeStates(merged, old).programmes).toEqual(merged.programmes)
})
