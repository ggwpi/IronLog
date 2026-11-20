import { describe, it, expect } from 'vitest'
import { addWeighIn, editWeighIn, removeWeighIn, restoreWeighIn, settleAll, readingsOf } from './weigh-ins.js'
import { mergeStates, stampChange } from './sync-merge.js'
import { convertStateUnit } from './units.js'
import { bodyCSV } from './ironlog-csv.js'
import { parseImport, mergeImport } from './import-csv.js'
import { normalizeMeasurementsState, measurementSeries, measurementValue } from './measurements.js'
const D = '2026-10-01'
const packs = import.meta.glob('../locales/*.js', { eager: true, import: 'default' })
const state = () => ({ _ts: 100, unit: 'kg', bwDaily: 'first', routines: [], workouts: [{ id: 'keep', note: 'א'.repeat(500), media: [{ hash: 'keep' }], entries: [] }], bodyweight: [{ d: D, w: 80, t: 100, custom: { keep: true }, ins: [{ id: 'am', at: '07:00', w: 80, t: 100, custom: { grip: 'keep' }, media: [{ hash: 'reading' }] }] }], measurements: [{ d: D, waist: 85, note: 'keep', future: { a: 1 }, other: [] }], customMeasurements: [] })
describe('IronLog multiple-reading compatibility', () => {
  it('localizes the new reading and unit controls in all 19 existing language packs', () => {
    expect(Object.keys(packs)).toHaveLength(19)
    for (const [name, pack] of Object.entries(packs)) for (const key of ['Daily weigh-in value', 'Morning (first)', 'Before breakfast is the one to compare.', 'Average', 'Every weigh-in of the day counts the same.', 'Last', 'The most recent one of the day.', 'Edit weigh-in', 'Weigh-in updated', 'Weigh-in deleted', 'Time', 'Measurement unit', 'Activities']) expect(pack[key], name + ': ' + key).toBeTruthy()
  })
  it('moves a legacy id without replacing the target day or losing source-day details', () => {
    const S = state()
    S.bodyweight = [{ d: D, w: 80, t: 100, future: 'keep', ins: [{ id: '0', at: '07:00', w: 80, t: 100 }] },
      { d: '2026-10-02', w: 82, t: 200, ins: [{ id: '0', at: '19:00', w: 82, t: 200 }] }]
    const moved = editWeighIn(S, D, '0', { d: '2026-10-02', at: '08:00' }, 300)
    expect(moved.id).not.toBe('0')
    expect(S.bodyweight).toHaveLength(1)
    expect(S.bodyweight[0].ins.map(r => r.w)).toEqual([80, 82])
    expect(S.bodyweight[0].ins[1]).toMatchObject({ id: '0', w: 82 })
    expect(S.bodyweight[0].future).toBe('keep')
  })
  it('rejects an ambiguous time or metadata collision before changing either day', () => {
    const S = state()
    S.bodyweight.push({ d: '2026-10-02', w: 82, t: 200, custom: 'different', ins: [{ id: 'pm', at: '19:00', w: 82, t: 200 }] })
    const before = structuredClone(S)
    expect(editWeighIn(S, D, 'am', { d: '2026-10-02', at: '19:00' }, 300)).toBeNull()
    expect(editWeighIn(S, D, 'am', { d: '2026-10-02', at: '08:00' }, 300)).toBeNull()
    expect(S).toEqual(before)
  })
  it('keeps existing reading and day metadata during add/edit/move/remove/undo', () => {
    const S = state(), old = structuredClone(S.bodyweight[0]), workouts = structuredClone(S.workouts)
    addWeighIn(S, { d: D, id: 'pm', at: '19:00', w: 82, t: 200 })
    expect(S.bodyweight[0].ins[0]).toEqual(old.ins[0])
    editWeighIn(S, D, 'am', { d: '2026-10-02', w: 79, at: '08:00' }, 300)
    expect(S.bodyweight[1].ins[0]).toMatchObject({ ...old.ins[0], w: 79, at: '08:00', t: 300 })
    const undo = removeWeighIn(S, '2026-10-02', 'am', 400)
    restoreWeighIn(S, undo, 500)
    expect(S.bodyweight.find(b => b.d === '2026-10-02').ins[0].custom).toEqual(old.ins[0].custom)
    expect(S.bodyweight[0].custom).toEqual(old.custom)
    expect(S.workouts).toEqual(workouts)
  })
  it('joins concurrent readings in either direction without changing either source', () => {
    const a = state(), b = state()
    addWeighIn(a, { d: D, at: '12:00', w: 81, t: 200, id: 'noon' })
    addWeighIn(b, { d: D, at: '19:00', w: 82, t: 300, id: 'pm' })
    a._ts = 200; b._ts = 300
    const snapshots = structuredClone([a, b])
    for (const [left, right] of [[a, b], [b, a]]) {
      const merged = mergeStates(left, right)
      expect(merged.bodyweight[0].ins.map(r => r.id)).toEqual(['am', 'noon', 'pm'])
      expect(merged.bodyweight[0].ins[0].custom).toEqual({ grip: 'keep' })
      expect(merged.measurements).toEqual(a.measurements)
    }
    expect([a, b]).toEqual(snapshots)
  })
  it('keeps tombstones and intentional Undo distinct across old copies', () => {
    const stale = state(), next = state()
    addWeighIn(stale, { d: D, at: '19:00', w: 82, t: 200, id: 'pm' })
    next.bodyweight = structuredClone(stale.bodyweight)
    const undo = removeWeighIn(next, D, 'am', 300)
    next._ts = stampChange(stale, next, 400)
    expect(mergeStates(next, stale).bodyweight[0].ins.map(r => r.id)).toEqual(['pm'])
    restoreWeighIn(next, undo, 500)
    next._ts = 500
    expect(mergeStates(next, stale).bodyweight[0].ins[0].custom).toEqual({ grip: 'keep' })
  })
  it('preserves metadata and converts every reading when changing profile units', () => {
    const S = state(), before = structuredClone(S)
    const lb = convertStateUnit(S, 'lb')
    expect(lb.bodyweight[0].w).toBe(176.4)
    expect(lb.bodyweight[0].ins[0]).toEqual({ ...S.bodyweight[0].ins[0], w: 176.4 })
    expect(convertStateUnit(lb, 'kg').bodyweight).toEqual(S.bodyweight)
    expect(S).toEqual(before)
  })
  it('round trips own timed body CSV without rewriting existing days, definitions or other data', () => {
    const source = state()
    addWeighIn(source, { d: D, at: '19:00', w: 82, t: 200, id: 'pm' })
    const csv = bodyCSV(source), parsed = parseImport(csv, { unit: 'kg' })
    expect(parsed.bodyweight.map(b => b.at)).toEqual(['07:00', '19:00'])
    const target = { ...state(), bodyweight: [], measurements: [{ d: D, waist: 99, future: 'keep', other: [] }] }
    const before = structuredClone(target.measurements), workouts = structuredClone(target.workouts)
    expect(mergeImport(target, parsed).added).toBe(2)
    expect(readingsOf(target.bodyweight[0]).map(r => r.w)).toEqual([80, 82])
    expect(mergeImport(target, parsed).added).toBe(0)
    expect(target.measurements).toEqual(before)
    expect(target.workouts).toEqual(workouts)
  })
  it('keeps custom typed units and unknown metadata through measurement normalization', () => {
    const S = state()
    S.customMeasurements = [{ id: 'pct', name: 'Ratio', unit: '%', future: 'keep', enabled: true }]
    S.measurements[0].other = [{ id: 'pct', name: 'Ratio', unit: '%', value: 0, future: 'keep' }]
    normalizeMeasurementsState(S)
    expect(S.customMeasurements[0].future).toBe('keep')
    expect(S.measurements[0]).toMatchObject({ note: 'keep', future: { a: 1 }, other: [{ id: 'pct', unit: '%', value: 0, future: 'keep' }] })
    expect(measurementValue(S.measurements[0], 'other:pct')).toBe(0)
    expect(measurementSeries({ ...S, unit: 'lb' }, 'other:pct')[0].y).toBe(0)
  })
  it('uses original typed-series unit compatibility and the chosen field display unit', () => {
    const S = { unit: 'kg', customMeasurements: [{ id: 'length', name: 'Length', unit: 'in' }],
      measurements: [{ d: D, other: [{ id: 'length', unit: 'cm', value: 25.4 }] }] }
    expect(measurementSeries(S, 'other:length')[0].y).toBe(10)
    S.customMeasurements[0].unit = '%'
    expect(measurementSeries(S, 'other:length')).toEqual([])
    expect(S.measurements[0].other[0]).toEqual({ id: 'length', unit: 'cm', value: 25.4 })
  })
  it('changes daily aggregation without changing the readings or their custom fields', () => {
    const S = state()
    addWeighIn(S, { d: D, at: '19:00', w: 82, t: 200, id: 'pm' })
    const readings = structuredClone(S.bodyweight[0].ins)
    settleAll(S, 'avg'); expect(S.bodyweight[0].w).toBe(81)
    settleAll(S, 'last'); expect(S.bodyweight[0].w).toBe(82)
    expect(S.bodyweight[0].ins).toEqual(readings)
  })
})
