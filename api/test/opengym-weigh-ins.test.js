import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'
const fixture = () => ({ _ts: 100, weighInTimes: true, bwDaily: 'avg', bodyweight: [{ d: '2026-10-01', w: 81, t: 100, ins: [{ id: 'am', at: '07:00', w: 80, t: 100, custom: 'keep' }, { id: 'pm', at: '19:00', w: 82, t: 100 }], gone: { removed: 90 }, media: [{ hash: 'keep' }] }], workouts: [{ id: 'keep', note: 'א'.repeat(500) }] })
test('a legacy daily-weight writer cannot drop readings, tombstones, preferences or custom metadata', () => {
  const current = fixture(), before = structuredClone(current), next = structuredClone(current)
  delete next.weighInTimes; delete next.bwDaily
  next.bodyweight = [{ d: '2026-10-01', w: 79, t: 200 }]
  stampPut(current, next, { overRead: true, stamped: false, now: 300 })
  assert.equal(next.bodyweight[0].w, 79)
  for (const key of ['ins', 'gone', 'media']) assert.deepEqual(next.bodyweight[0][key], current.bodyweight[0][key])
  assert.equal(next.bwDaily, 'avg'); assert.equal(next.weighInTimes, true)
  assert.deepEqual(next.workouts, current.workouts); assert.deepEqual(current, before)
})
test('modern explicit reading removal and time opt-out remain intentional', () => {
  const current = fixture(), next = structuredClone(current)
  next.weighInTimes = false
  next.bodyweight[0].ins.pop(); next.bodyweight[0].gone.pm = 200; next.bodyweight[0].w = 80; next.bodyweight[0].t = 200
  stampPut(current, next, { overRead: true, stamped: true, now: 300 })
  assert.equal(next.weighInTimes, false); assert.equal(next.bodyweight[0].ins.length, 1)
  assert.ok(next.bodyweight[0].gone.pm >= 200); assert.deepEqual(next.bodyweight[0].media, current.bodyweight[0].media)
})
test('legacy measurement writers preserve typed units, health fields and custom metadata while clearing a value', () => {
  const current = fixture()
  current.customMeasurements = [{ id: 'ratio', name: 'Ratio', unit: '%', enabled: true, future: 'keep' }]
  current.measurements = [{ d: '2026-10-01', waist: 85, bpSys: 120, pulse: 65, note: 'א'.repeat(500),
    other: [{ id: 'ratio', name: 'Ratio', unit: '%', value: 10, future: 'keep' }] }]
  const before = structuredClone(current), next = structuredClone(current)
  next.customMeasurements = [{ id: 'ratio', name: 'Ratio', enabled: false }]
  next.measurements = [{ d: '2026-10-01', waist: 86, other: [{ id: 'ratio', name: 'Ratio', value: null }] }]
  stampPut(current, next, { overRead: true, stamped: false, now: 300 })
  assert.equal(next.customMeasurements[0].unit, '%'); assert.equal(next.customMeasurements[0].enabled, false)
  assert.equal(next.measurements[0].waist, 86); assert.equal(next.measurements[0].bpSys, 120)
  assert.equal(next.measurements[0].note, current.measurements[0].note)
  assert.deepEqual(next.measurements[0].other[0], { ...current.measurements[0].other[0], value: null })
  assert.deepEqual(current, before)
  const clear = structuredClone(current)
  delete clear.measurements[0].waist
  stampPut(current, clear, { overRead: true, stamped: false, now: 400 })
  assert.equal('waist' in clear.measurements[0], false)
  assert.equal(clear.measurements[0].bpSys, 120)
})
