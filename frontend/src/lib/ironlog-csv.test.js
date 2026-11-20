import { describe, expect, it } from 'vitest'
import { workoutsCSV, bodyCSV, csvCounts, isOwnWorkoutCSV } from './ironlog-csv.js'
import { parseCSV, parseWorkoutCSV, parseImport, mergeImport } from './import-csv.js'
import { mergeStates, stampChange } from './sync-merge.js'
import { assertUserDataPreserved } from './migration-audit.js'

const longNote = 'הערת IronLog עם פרטים על האחיזה. '.repeat(18).slice(0, 499) + 'א'
const at = (d, h) => new Date(`${d}T${h}:00:00`).getTime()
it('round trips original resistance metadata and full IronLog notes without changing the source', () => {
  const S = { unit: 'kg', workouts: [{ id: 'bike', name: 'Bike', d: '2026-11-19', start: at('2026-11-19', '09:00'), end: at('2026-11-19', '09:30'), entries: [{ id: '2138', target: { mode: 'cardio' }, sets: [{ min: 30, speed: 10, level: 8, note: longNote, done: true, media: [{ hash: 'keep' }] }] }] }] }
  const before = structuredClone(S)
  const csv = workoutsCSV(S)
  expect(csv).toContain('resistance_level')
  const row = parseWorkoutCSV(csv).workouts[0].entries[0].sets[0]
  expect(row).toMatchObject({ min: 30, speed: 10, level: 8, note: longNote, done: true })
  expect(S).toEqual(before)
})
const fixture = () => ({
  unit: 'kg', lang: 'he', _ts: 1000, exWeights: {}, customEx: [{ id: 'cx-ironlog', n: 'Grip, "custom"', bp: 'lower arms', custom: true, photo: 'fixture-media', other: { retained: true } }],
  routines: [{ id: 'fixture-plan', ex: [{ id: 'cx-ironlog', sets: 3 }] }], bodyweight: [{ d: '2026-11-01', w: 80 }],
  measurements: [{ d: '2026-11-01', waist: 85, other: [{ id: 'custom-measure', name: 'Neck, relaxed', value: 39 }] }],
  customMeasurements: [{ id: 'custom-measure', name: 'Neck, relaxed' }], dayPhotos: { '2026-11-01': [{ hash: 'fixture-photo' }] },
  bands: [{ id: 'band-old', name: 'Existing band', color: '#ff0000', future: { retained: true } }],
  active: { id: 'offline-draft', entries: [] }, mediaPending: ['offline-file'],
  workouts: [{ id: 'fixture-workout', name: '=Formula-safe, אימון', d: '2026-11-02', start: at('2026-11-02', '18'), end: at('2026-11-02', '19'),
    note: 'Workout note', entries: [
      { id: '0025', note: 'Exercise note', target: { mode: 'reps', tempo: '3-1-X-0' }, sets: [
        { w: 20, r: 10, done: true, phase: 'warmup', tag: 'orange', note: longNote },
        { w: 60, r: 8, done: true, type: 'dropset', rir: 2, tag: 'blue', note: longNote, drops: [{ w: 40, r: 5 }] },
        { w: 60, r: 8, done: false, note: 'unfinished stays in JSON' },
      ] },
      { id: 'cx-ironlog', target: { mode: 'reps', side: true }, sets: [{ side: true, tag: 'green', note: longNote, sides: { L: { w: 10, r: 7, done: true }, R: { w: 12, r: 6, done: true } } }] },
      { id: 'fixture-hold', sets: [{ w: 0, sec: 45, done: true, tag: 'purple', note: longNote }] },
    ] },
    { id: 'second-session', name: 'Another session', d: '2026-11-02', start: at('2026-11-02', '20'), end: at('2026-11-02', '21'), entries: [{ id: '0025', sets: [{ w: 62.5, r: 6, done: true, tag: 'red', note: longNote }] }] },
  ],
})
const empty = extra => ({ unit: 'kg', workouts: [], routines: [], bodyweight: [], customEx: [], exWeights: {}, _ts: 1000, ...extra })
const freeze = v => { if (v && typeof v === 'object') { Object.freeze(v); Object.values(v).forEach(freeze) } return v }

describe('original CSV engines at IronLog boundaries', () => {
  it('exports only by reading fixtures, preserves JSON/offline/media state and keeps formula guards', () => {
    const S = fixture(), before = structuredClone(S)
    freeze(S)
    const csv = workoutsCSV(S)
    expect(isOwnWorkoutCSV(csv)).toBe(true)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain("'=Formula-safe")
    expect(csv).toContain(longNote)
    expect(bodyCSV(S)).toContain('Neck, relaxed (cm)')
    expect(csvCounts(S).workouts).toBe(2)
    expect(S).toEqual(before)
    expect(assertUserDataPreserved(before, JSON.parse(JSON.stringify(S)))).toBe(true)
  })

  it('uses the actual app importer and retains stable IDs, tags, 500-character notes, sides and drops', () => {
    const S = fixture()
    const p = parseImport(workoutsCSV(S), { unit: 'kg', customEx: S.customEx })
    expect(p.source).toBe('openGym')
    expect(p.workouts.map(w => w.name)).toEqual(S.workouts.map(w => w.name))
    const [warm, work] = p.workouts[0].entries.find(e => e.id === '0025').sets
    expect(warm).toMatchObject({ w: 20, r: 10, done: true, phase: 'warmup', tag: 'orange', note: longNote })
    expect(work).toMatchObject({ w: 60, r: 8, rir: 2, tag: 'blue', note: longNote, drops: [{ w: 40, r: 5 }], tempo: '3-1-X-0' })
    expect(p.workouts[0].entries.find(e => e.id === 'cx-ironlog').sets[0]).toMatchObject({ tag: 'green', note: longNote, sides: { L: { w: 10, r: 7 }, R: { w: 12, r: 6 } } })
    expect(p.workouts[1].entries[0].sets[0]).toMatchObject({ tag: 'red', note: longNote, w: 62.5 })
    expect(p.workouts[0].entries.find(e => e.id === '0025').sets).toHaveLength(2)
  })

  it('restores long notes even when legacy workout timestamps are absent', () => {
    const S = fixture(); S.workouts = [S.workouts[0]]; delete S.workouts[0].start; delete S.workouts[0].end
    const p = parseWorkoutCSV(workoutsCSV(S), { customEx: S.customEx })
    expect(p.workouts[0].entries[0].sets[0].note).toBe(longNote)
  })

  it('does not mistake note text for a Health XML export or a spreadsheet formula', () => {
    const S = fixture()
    const note = '=HKQuantityTypeIdentifier, "literal note"\n' + longNote
    S.workouts[0].entries[0].sets[1].note = note
    const p = parseImport(workoutsCSV(S), { customEx: S.customEx })
    expect(p.kind).toBe('workouts')
    expect(p.workouts[0].entries[0].sets[1].note).toBe(note)
  })

  it('honours upstream note opt-out and converts weights without interpreting tags as loads', () => {
    const S = fixture()
    const p = parseWorkoutCSV(workoutsCSV(S), { unit: 'lb', customEx: S.customEx, notes: false })
    const sets = p.workouts[0].entries.find(e => e.id === '0025').sets
    expect(sets[1]).toMatchObject({ w: 132.28, tag: 'blue' })
    expect(sets.every(s => !s.note)).toBe(true)
  })

  it('retains existing records on import and duplicate import, including unrelated unsynced settings', () => {
    const S = fixture(), before = structuredClone(S)
    const p = parseWorkoutCSV(workoutsCSV(S), { unit: 'kg', customEx: S.customEx })
    expect(mergeImport(S, p)).toMatchObject({ added: 0, skipped: 2 })
    expect(S).toEqual(before)
    const target = empty({ workouts: [{ id: 'existing', d: '2026-10-01', entries: [], media: 'keep-hash' }], active: { id: 'local-draft' }, reminder: { on: true }, mediaPending: ['owed-hash'] })
    const original = structuredClone(target)
    expect(mergeImport(target, p).added).toBe(2)
    expect(mergeImport(target, p).added).toBe(0)
    expect(assertUserDataPreserved(original, target)).toBe(true)
  })

  it('preserves existing band definition fields while adding definitions used by own CSV rows', () => {
    const S = fixture()
    S.workouts[0].entries[0].sets[1].bands = ['new-band']
    S.bands.push({ id: 'new-band', name: 'New band', color: '#00ff00' })
    const target = empty({ bands: [structuredClone(S.bands[0])] })
    const p = parseWorkoutCSV(workoutsCSV(S), { unit: 'kg', customEx: S.customEx, bands: target.bands })
    mergeImport(target, p)
    expect(target.bands[0]).toEqual(S.bands[0])
    expect(target.bands.find(b => b.name === 'New band')).toBeTruthy()
    const ids = target.workouts[0].entries.find(e => e.id === '0025').sets[1].bands
    expect(ids.every(id => target.bands.some(b => b.id === id))).toBe(true)
  })

  it('retains long notes when the receiving profile already has the same custom exercise under another ID', () => {
    const source = fixture()
    source.workouts = [source.workouts[0]]
    source.workouts[0].entries = source.workouts[0].entries.filter(e => e.id === source.customEx[0].id)
    const custom = { ...source.customEx[0], id: 'local-custom-id' }
    const target = empty({ customEx: [custom] })
    const parsed = parseWorkoutCSV(workoutsCSV(source), { unit: 'kg', customEx: target.customEx })
    mergeImport(target, parsed)
    const entry = target.workouts[0].entries.find(e => e.id === custom.id)
    expect(entry.sets[0].note).toBe(longNote)
    expect(entry.sets[0].tag).toBe('green')
    expect(target.customEx).toEqual([custom])
  })

  it('syncs imported fixtures through the existing two-device merge without losing old history or settings', () => {
    const source = fixture(), base = empty({ workouts: [{ id: 'keep', d: '2026-10-01', start: 1, entries: [] }] })
    const a = structuredClone(base), b = structuredClone(base)
    mergeImport(a, parseWorkoutCSV(workoutsCSV(source), { customEx: source.customEx }))
    a._ts = stampChange(base, a, 2000)
    b.restSec = 180; b._ts = stampChange(base, b, 3000)
    const merged = mergeStates(a, b)
    expect(merged.workouts).toHaveLength(3)
    expect(merged.workouts.find(w => w.name === source.workouts[0].name).entries[0].sets[0].note).toBe(longNote)
    expect(merged.restSec).toBe(180)
    expect(merged.workouts.some(w => w.id === 'keep')).toBe(true)
  })

  it('filters only export output by date and keeps body values canonical without modifying them', () => {
    const S = fixture(), before = structuredClone(S)
    expect(parseCSV(workoutsCSV(S, { from: '2026-12-01' }))).toHaveLength(1)
    expect(parseCSV(bodyCSV(S))[1].slice(0, 3)).toEqual(['2026-11-01', '80', '85'])
    expect(S).toEqual(before)
  })
})
