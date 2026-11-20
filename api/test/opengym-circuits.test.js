import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'
const cfg = { mode: 'emom', every: 60, count: 4 }
const fixture = () => ({ routines: [{ id: 'r', ex: [{ id: 'x', sg: 'g', sets: 4, sgCircuit: cfg, preType: { sets: 2, sg: null } }] }], workouts: [{ id: 'w', circuits: [{ mode: 'emom', rounds: 4, future: { keep: true } }], entries: [{ id: 'x', target: { sgCircuit: cfg }, sets: [{ w: 20, r: 12, done: true, note: 'א'.repeat(500) }] }] }] })
for (const stamped of [true, false]) for (const version of [0, 1]) test(`legacy training ${version}/${stamped} cannot drop circuit results or original routine snapshots`, () => {
  const cur = fixture(), before = structuredClone(cur), next = structuredClone(cur), report = {}
  delete next.routines[0].ex[0].sgCircuit; delete next.routines[0].ex[0].preType; delete next.workouts[0].circuits; delete next.workouts[0].entries[0].target.sgCircuit
  next.workouts[0].entries[0].sets[0].r = 14
  stampPut(cur, next, { stamped, trainingDataVersion: version, bodyDataVersion: 1, overRead: true, now: 300, report })
  assert.deepEqual(next.routines, cur.routines); assert.deepEqual(next.workouts[0].circuits, cur.workouts[0].circuits)
  assert.deepEqual(next.workouts[0].entries[0].target, cur.workouts[0].entries[0].target)
  assert.equal(next.workouts[0].entries[0].sets[0].r, 14); assert.equal(report.changed, true); assert.deepEqual(cur, before)
})
for (const stamped of [true, false]) test(`version 2/${stamped} retains explicit circuit clears`, () => {
  const cur = fixture(), next = structuredClone(cur)
  delete next.routines[0].ex[0].sgCircuit; delete next.routines[0].ex[0].preType; delete next.workouts[0].circuits; delete next.workouts[0].entries[0].target.sgCircuit
  stampPut(cur, next, { stamped, trainingDataVersion: 2, bodyDataVersion: 1, overRead: true, now: 300 })
  assert.equal('sgCircuit' in next.routines[0].ex[0], false); assert.equal('preType' in next.routines[0].ex[0], false)
  assert.equal('circuits' in next.workouts[0], false); assert.equal('sgCircuit' in next.workouts[0].entries[0].target, false)
})
test('legacy group unlinking is refused, while capable restore and reset remain intentional', () => {
  const cur = fixture(), next = structuredClone(cur), before = structuredClone(cur)
  delete next.routines[0].ex[0].sg
  assert.throws(() => stampPut(cur, next, { stamped: true, trainingDataVersion: 1 }), RangeError)
  assert.deepEqual(cur, before)
  assert.doesNotThrow(() => stampPut(cur, next, { stamped: true, trainingDataVersion: 2 }))
  const reset = { resetAt: 1000, routines: [], workouts: [] }
  stampPut(cur, reset, { stamped: true, now: 2000 }); assert.deepEqual(reset.routines, [])
})
