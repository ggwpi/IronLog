import { expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { buildSets, setLabel } from './history.js'
import { buildPlannedEntry } from './session-start.js'
import { cleanBands, setKnownBands } from './bands.js'
import { mergeStates, stampChange } from './sync-merge.js'
import { workoutsCSV } from './ironlog-csv.js'
import { parseImport, mergeImport } from './import-csv.js'
import { _setLangState } from './i18n-core.js'
import { convertStateUnit } from './units.js'

const bands = [{ id: 'y', name: 'Yellow', color: '#f2c94c', kg: 5 }, { id: 'r', name: 'Red', color: '#eb5757', kg: 10 }]
const cfg = { id: '0025', mode: 'reps', sets: 2, reps: 12, repsMin: 8, repsMax: 12, weight: 0, bands: ['y'] }
const state = () => ({ unit: 'kg', bands, bandEx: { '0025': true }, workouts: [], routines: [], bodyweight: [], customEx: [] })
it('retains complete original component and tests as exact upstream Git blobs', () => {
  for (const [path, hash] of [['../components/Bands.jsx', 'b078f4eec1814458c48269896b5a2a363de928c3'], ['../components/Bands.test.jsx', '191100a131aa17c5d875fa7cd8a9aa47bd861d18'], ['./bands.test.js', '2f1f6beb0a14fe6acb082ca2a6ac811464bac4b4'], ['./opengym-v145/session-engine/frontend/src/lib/history.bands.test.js', '940e0cf2ec1716761753db44eb00a0a40b067c4f']]) {
    const bytes = readFileSync(new URL(path, import.meta.url))
    expect(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')).toBe(hash)
  }
})
it('retains extension metadata while original validation clears known optional fields', () => {
  expect(cleanBands([{ ...bands[0], kg: undefined, level: '', future: { keep: true } }])).toEqual([{ id: 'y', name: 'Yellow', color: '#f2c94c', future: { keep: true } }])
})
it('seeds plans, carries previous bands, and uses original band progression without mutating history', () => {
  const S = state()
  expect(buildSets(S, cfg).map(x => x.bands)).toEqual([['y'], ['y']])
  S.workouts = [{ id: 'w', d: '2026-11-01', entries: [{ id: cfg.id, target: cfg, sets: [{ w: 0, r: 12, bands: ['y'], done: true }, { w: 0, r: 12, bands: ['y'], done: true }] }] }]
  const before = structuredClone(S)
  expect(buildSets(S, cfg).map(x => [x.bands, x.r])).toEqual([[['r'], 8], [['r'], 8]])
  const entry = buildPlannedEntry(S, cfg, { id: 'routine' })
  expect(entry.sets.map(x => x.bands)).toEqual([['r'], ['r']])
  expect(S).toEqual(before)
})
it('exports and imports original band names while retaining IDs in JSON and unrelated data', () => {
  const S = state(); setKnownBands(bands)
  S.workouts = [{ id: 'w', d: '2026-11-01', start: 1793520000000, end: 1793520600000, name: 'Bands', entries: [{ id: cfg.id, target: cfg, sets: [{ w: 0, r: 12, bands: ['r'], done: true }] }] }]
  expect(setLabel(cfg.id, S.workouts[0].entries[0].sets[0], cfg)).toContain('Red')
  const before = structuredClone(S), csv = workoutsCSV(S)
  expect(csv).toContain('Red')
  const parsed = parseImport(csv, { unit: 'kg', bands })
  expect(parsed.workouts[0].entries[0].sets[0].bands).toEqual(['r'])
  const dest = state(); dest.custom = { keep: true }; mergeImport(dest, parsed)
  expect(dest.workouts[0].entries[0].sets[0].bands).toEqual(['r'])
  expect(dest.custom).toEqual({ keep: true }); expect(S).toEqual(before)
})
it('joins exercise preferences per key through existing conflict resolution', () => {
  const base = { ...state(), _ts: 100, bandEx: {} }, a = structuredClone(base), b = structuredClone(base)
  a.bandEx.a = true; b.bandEx.b = false; stampChange(base, a, 200); stampChange(base, b, 300)
  expect(mergeStates(a, b).bandEx).toEqual({ a: true, b: false })
  expect(mergeStates(b, a).bandEx).toEqual({ a: true, b: false })
})
it('retains canonical band resistance when profile loads change units', () => {
  const S = state(), before = structuredClone(S.bands)
  expect(convertStateUnit(S, 'lb').bands).toEqual(before)
  expect(S.bands).toEqual(before)
})
it('uses the existing Hebrew dictionary and RTL isolation for missing band names', () => {
  _setLangState('he', { band: 'גומייה', F: 'כשל' })
  try {
    const text = setLabel(cfg.id, { w: 0, r: 12, bands: ['missing'] }, cfg, undefined, [])
    expect(text).toContain('גומייה'); expect(text).not.toContain('band')
  } finally { _setLangState('en', {}) }
})
