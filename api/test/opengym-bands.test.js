import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'
const fixture = () => ({ bands: [{ id: 'r', name: 'אדומה', color: '#eb5757', future: { keep: true } }], bandEx: { ex: true }, routines: [{ id: 'r', ex: [{ id: 'ex', bands: ['r'], reps: 12 }] }],
  workouts: [{ id: 'w', entries: [{ id: 'ex', sets: [{ w: 20, r: 12, bands: ['r'], done: true }] }] }] })
for (const stamped of [true, false]) {
  test(`older ${stamped ? 'stamped' : 'unstamped'} clients preserve band fields while editing known numbers`, () => {
    const current = fixture(), before = structuredClone(current), next = structuredClone(current), report = {}
    delete next.bands; delete next.bandEx; delete next.routines[0].ex[0].bands; delete next.workouts[0].entries[0].sets[0].bands
    next.workouts[0].entries[0].sets[0].r = 14
    // An unknown profile setting echoed by an old writer does not grant request capability.
    next.trainingDataVersion = 1
    stampPut(current, next, { stamped, overRead: true, bodyDataVersion: 1, now: 300, report })
    assert.deepEqual(next.bands, current.bands); assert.deepEqual(next.bandEx, current.bandEx)
    assert.deepEqual(next.routines[0].ex[0].bands, ['r'])
    assert.deepEqual(next.workouts[0].entries[0].sets[0], { ...current.workouts[0].entries[0].sets[0], r: 14 })
    assert.deepEqual(current, before); assert.equal(report.changed, true)
  })
  test(`capable ${stamped ? 'stamped' : 'unstamped'} clients retain explicit clears`, () => {
    const current = fixture(), next = structuredClone(current)
    delete next.bands; delete next.bandEx; delete next.routines[0].ex[0].bands; delete next.workouts[0].entries[0].sets[0].bands
    stampPut(current, next, { stamped, overRead: true, bodyDataVersion: 1, trainingDataVersion: 1, now: 300 })
    assert.equal('bands' in next, false); assert.equal('bandEx' in next, false)
    assert.equal('bands' in next.routines[0].ex[0], false)
    assert.equal('bands' in next.workouts[0].entries[0].sets[0], false)
  })
}
test('ambiguous row restructuring by an incapable client rejects before persistence; capable editing and reset work', () => {
  const current = fixture(), before = structuredClone(current), next = structuredClone(current)
  next.workouts[0].entries[0].sets = [{ w: 20, r: 12 }, { w: 20, r: 8 }]
  assert.throws(() => stampPut(current, next, { stamped: true }), RangeError)
  assert.deepEqual(current, before)
  assert.doesNotThrow(() => stampPut(current, next, { stamped: true, trainingDataVersion: 1 }))
  const reset = { resetAt: 500, workouts: [], routines: [] }
  stampPut(current, reset, { stamped: true, now: 600 })
  assert.equal('bands' in reset, false); assert.equal('bandEx' in reset, false)
})
