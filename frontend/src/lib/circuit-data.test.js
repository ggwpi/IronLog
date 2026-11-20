import { expect, it } from 'vitest'
import { setCircuit, applyProgramAdvances } from './circuit-data.js'
import { mergeStates, stampWorkout } from './sync-merge.js'
import { buildCompletedWorkout } from './finish-workout.js'
it('keeps unknown clock metadata through manual changes and original run/walk advancement', () => {
  const entries = [{ id: '0685', sg: 'clock', sgCircuit: { mode: 'intervals', program: 'runwalk', level: 1, n: 0, future: { keep: true } } }]
  setCircuit(entries, 'clock', { mode: 'intervals', program: 'runwalk', level: 1, n: 1 })
  expect(entries[0].sgCircuit).toMatchObject({ n: 1, future: { keep: true } })
  const from = structuredClone(entries[0].sgCircuit)
  const moved = applyProgramAdvances([{ id: 'r', ex: entries }], [{ advance: { rid: 'r', sg: 'clock', from, to: { ...from, n: 2 } } }])
  expect(moved).toBe(1); expect(entries[0].sgCircuit).toMatchObject({ n: 2, future: { keep: true } })
  setCircuit(entries, 'clock', null); expect(entries[0]).not.toHaveProperty('sgCircuit')
})
it('saves and synchronizes full score metadata without reapplying private program commands', () => {
  const A = { id: 'w', d: '2026-11-20', start: 100, circuits: [{ mode: 'emom', future: { keep: true }, advance: { rid: 'private' } }], entries: [{ id: '0025', target: { mode: 'reps' }, sets: [{ w: 20, r: 10, done: true, note: 'א'.repeat(500) }] }] }
  const before = structuredClone(A), w = buildCompletedWorkout(A, { end: 200 })
  expect(w.circuits).toEqual([{ mode: 'emom', future: { keep: true } }]); expect(A).toEqual(before)
  stampWorkout(w, 300)
  const merged = mergeStates({ _ts: 300, workouts: [w] }, { _ts: 400, workouts: [{ id: 'other', _ts: 400, entries: [] }] })
  expect(merged.workouts.find(x => x.id === 'w').circuits).toEqual(w.circuits)
  expect(merged.workouts.find(x => x.id === 'w').entries[0].sets[0].note).toBe('א'.repeat(500))
})
