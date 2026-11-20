import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { convertBodyWeight } from '../body-compat/units.js'

test('the server reading model is the full unchanged upstream Git blob', () => {
  const bytes = readFileSync(new URL('../body-compat/weigh-ins.js', import.meta.url))
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), '5b3915751afc6c9f019c200f0025ba8e4eb70820')
})
const fixture = () => ({ _ts: 100, weighInTimes: true, bwDaily: 'avg', bodyweight: [{ d: '2026-10-01', w: 81, t: 100, ins: [{ id: 'am', at: '07:00', w: 80, t: 100, custom: 'keep' }, { id: 'pm', at: '19:00', w: 82, t: 100 }], gone: { removed: 90 }, media: [{ hash: 'keep' }] }], workouts: [{ id: 'keep', note: 'א'.repeat(500) }] })
test('a legacy daily-weight writer cannot drop readings, tombstones, preferences or custom metadata', () => {
  const current = fixture(), before = structuredClone(current), next = structuredClone(current)
  delete next.weighInTimes; delete next.bwDaily
  next.bodyweight = [{ d: '2026-10-01', w: 79, t: 200 }]
  stampPut(current, next, { overRead: true, stamped: false, now: 300 })
  assert.equal(next.bodyweight[0].w, 79)
  for (const key of ['gone', 'media']) assert.deepEqual(next.bodyweight[0][key], current.bodyweight[0][key])
  assert.equal(next.bodyweight[0].ins[0].w, 79)
  assert.equal(next.bodyweight[0].ins[0].custom, 'keep')
  assert.equal(next.bodyweight[0].ins[1].w, 82)
  assert.equal(next.bwDaily, 'avg'); assert.equal(next.weighInTimes, true)
  assert.deepEqual(next.workouts, current.workouts); assert.deepEqual(current, before)
})

for (const stamped of [false, true]) test(`old ${stamped ? 'stamped' : 'unstamped'} normalization retains invisible health/zero days and typed values`, () => {
  const current = { measureUnit: 'in', customMeasurements: [{ id: 'score', name: 'Score', unit: 'none', enabled: true }], measurements: [
    { d: '2026-10-01', bpSys: 120, bpDia: 80, pulse: 63, note: 'בדיקה', future: { keep: true } },
    { d: '2026-10-02', other: [{ id: 'score', name: 'Score', unit: 'none', value: 0 }] },
    { d: '2026-10-03', waist: 85, other: [{ id: 'score', name: 'Score', unit: 'none', value: 2.345 }] },
    { d: '2026-10-04', waist: 86 },
  ] }
  const before = structuredClone(current)
  const next = { bodyDataVersion: 1, customMeasurements: [{ id: 'score', name: 'Score', enabled: false }], measurements: [
    { d: '2026-10-03', waist: 87, other: [{ id: 'score', name: 'Score', value: 2.3 }] },
  ], deleted: { measurements: { '2026-10-01': 200, '2026-10-02': 200, '2026-10-04': 200 } } }
  const report = {}
  stampPut(current, next, { stamped, overRead: true, now: 300, report })
  assert.equal(next.measureUnit, 'in')
  assert.equal(next.customMeasurements[0].unit, 'none'); assert.equal(next.customMeasurements[0].enabled, false)
  assert.equal(next.measurements.find(x => x.d === '2026-10-03').waist, 87)
  assert.equal(next.measurements.find(x => x.d === '2026-10-03').other[0].value, 2.345)
  assert.deepEqual(next.measurements.find(x => x.d === '2026-10-01'), current.measurements[0])
  assert.deepEqual(next.measurements.find(x => x.d === '2026-10-02'), current.measurements[1])
  assert.equal(next.measurements.some(x => x.d === '2026-10-04'), false)
  assert.ok(next.deleted.measurements['2026-10-01'] < 0)
  assert.equal(report.changed, true)
  assert.deepEqual(current, before)
})

for (const stamped of [false, true]) test(`capable ${stamped ? 'stamped' : 'unstamped'} writers can clear health data and units`, () => {
  const current = { measureUnit: 'in', measurements: [{ d: '2026-10-01', waist: 85, bpSys: 120, bpDia: 80, note: 'old', other: [{ id: 'score', value: 0, unit: 'none' }] }] }
  const next = { measurements: [{ d: '2026-10-01', waist: 85 }] }
  stampPut(current, next, { stamped, bodyDataVersion: 1, overRead: true, now: 300 })
  assert.deepEqual(next.measurements, [{ d: '2026-10-01', waist: 85 }])
  assert.equal('measureUnit' in next, false)
  const reset = { resetAt: 400, measurements: [] }
  stampPut(current, reset, { stamped, now: 500 })
  assert.deepEqual(reset.measurements, [])
})

for (const stamped of [false, true]) test(`old ${stamped ? 'stamped' : 'unstamped'} unit switch converts every reading once`, () => {
  const current = { ...fixture(), unit: 'kg' }, next = structuredClone(current)
  next.unit = 'lb'; next.bodyweight[0] = { d: current.bodyweight[0].d, t: 200, w: convertBodyWeight(81, 'kg', 'lb') }
  stampPut(current, next, { stamped, overRead: true, now: 300 })
  assert.deepEqual(next.bodyweight[0].ins.map(x => x.w), [convertBodyWeight(80, 'kg', 'lb'), convertBodyWeight(82, 'kg', 'lb')])
  assert.equal(next.bodyweight[0].ins[0].custom, 'keep')
  const modern = structuredClone(next)
  stampPut(next, modern, { stamped: true, bodyDataVersion: 1, now: 400 })
  assert.deepEqual(modern.bodyweight, next.bodyweight)
})
test('modern explicit reading removal and time opt-out remain intentional', () => {
  const current = fixture(), next = structuredClone(current)
  next.weighInTimes = false
  next.bodyweight[0].ins.pop(); next.bodyweight[0].gone.pm = 200; next.bodyweight[0].w = 80; next.bodyweight[0].t = 200
  stampPut(current, next, { overRead: true, stamped: true, bodyDataVersion: 1, now: 300 })
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
