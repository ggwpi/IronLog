import { expect, it } from 'vitest'
import { mergeStates, stampChange } from './sync-merge.js'
import { buildCompletedWorkout } from './finish-workout.js'
import { workoutsCSV } from './ironlog-csv.js'
import { parseWorkoutCSV, mergeImport } from './import-csv.js'
import { withCardioBy, settleSpeed } from './opengym-v145/distance.js'

it('preserves distance through finish/JSON/CSV and keeps unrelated offline records on import', () => {
 const row = settleSpeed({ min: 31, km: 6.4374, done: true, note: 'א'.repeat(500), tag: 'blue', media: [{ hash: 'keep' }] })
 const active = { id: 'active', name: 'Distance fixture', d: '2026-11-19', start: new Date('2026-11-19T09:00:00').getTime(), entries: [{ id: '2138', target: { mode: 'cardio', sets: 1, min: 31, speed: row.speed }, sets: [row] }] }
 const workout = buildCompletedWorkout(active)
 expect(workout.entries[0].sets[0]).toEqual(row)
 const state = { unit: 'kg', speedUnit: 'mph', customEx: [], workouts: [workout] }
 const restored = JSON.parse(JSON.stringify(state))
 expect(restored.workouts[0].entries[0].sets[0]).toEqual(row)
 const parsed = parseWorkoutCSV(workoutsCSV(restored), { unit: 'kg', cardioBy: { '2138': 'distance' } })
 expect(parsed.workouts[0].entries[0].sets[0]).toMatchObject({ min: 31, km: 6.4374, speed: 12.46, note: row.note, tag: 'blue' })
 const target = { unit: 'kg', customEx: [], workouts: [{ id: 'keep', d: '2026-10-01', entries: [], media: 'keep' }], bodyweight: [], active: { id: 'offline-draft' }, reminder: { on: true } }
 const original = structuredClone(target)
 expect(mergeImport(target, parsed).added).toBe(1)
 expect(target.workouts.find(w => w.id === 'keep')).toEqual(original.workouts[0])
 expect(target.active).toEqual(original.active); expect(target.reminder).toEqual(original.reminder)
 expect(mergeImport(target, parsed).added).toBe(0)
})
it('never guesses logging intent from CSV and respects note opt-out when distance is explicitly selected', () => {
 const S = { unit: 'kg', workouts: [{ id: 'fixture', d: '2026-11-19', entries: [{ id: '2138', sets: [{ min: 30, km: 5, speed: 10, done: true, note: 'private-fixture' }] }] }] }
 const csv = workoutsCSV(S)
 expect(parseWorkoutCSV(csv).workouts[0].entries[0].sets[0]).not.toHaveProperty('km')
 const parsed = parseWorkoutCSV(csv, { notes: false, cardioBy: { '2138': 'distance' } })
 expect(parsed.workouts[0].entries[0].sets[0]).toMatchObject({ min: 30, speed: 10, km: 5 })
 expect(parsed.workouts[0].entries[0].sets[0]).not.toHaveProperty('note')
})
it('retains exact distance and a long note for an unnamed legacy workout without inventing a stored identity', () => {
 const note = 'א'.repeat(500)
 const S = { unit: 'kg', workouts: [{ id: 'keep-source', d: '2026-11-19', entries: [{ id: '2138', sets: [{ min: 30, km: 5, speed: 10, done: true, note }] }] }] }
 const before = structuredClone(S)
 const parsed = parseWorkoutCSV(workoutsCSV(S), { cardioBy: { '2138': 'distance' } })
 expect(parsed.workouts[0].entries[0].sets[0]).toMatchObject({ km: 5, note })
 expect(S).toEqual(before)
})
it('does not cross-assign long notes when unnamed and literally Imported sessions normalize to the same identity', () => {
 const work = (name, note) => ({ name, d: '2026-11-19', start: new Date('2026-11-19T09:00:00').getTime(), entries: [{ id: '2138', sets: [{ min: 30, speed: 10, done: true, note }] }] })
 const S = { unit: 'kg', workouts: [work('', 'a'.repeat(500)), work('Imported', 'b'.repeat(500))] }
 const parsed = parseWorkoutCSV(workoutsCSV(S))
 expect(parsed.workouts).toHaveLength(2)
 expect(parsed.workouts[0].entries[0].sets[0].note).toBe('a'.repeat(140))
 expect(parsed.workouts[1].entries[0].sets[0].note).toBe('b'.repeat(140))
})
it('still preserves both full notes for distinct named sessions at the same time', () => {
 const work = (name, note) => ({ name, d: '2026-11-19', start: new Date('2026-11-19T09:00:00').getTime(), entries: [{ id: '2138', sets: [{ min: 30, speed: 10, done: true, note }] }] })
 const parsed = parseWorkoutCSV(workoutsCSV({ unit: 'kg', workouts: [work('First', 'a'.repeat(500)), work('Second', 'b'.repeat(500))] }))
 expect(parsed.workouts[0].entries[0].sets[0].note).toBe('a'.repeat(500))
 expect(parsed.workouts[1].entries[0].sets[0].note).toBe('b'.repeat(500))
})
it('keeps a newer logging choice when another device changes language, retaining every other exercise key', () => {
 const base = { _ts: 1000, unit: 'kg', lang: 'en', workouts: [], routines: [], cardioBy: { future: 'keep' } }
 const phone = structuredClone(base); phone.cardioBy = withCardioBy(phone.cardioBy, '2138', 'distance'); phone._ts = stampChange(base, phone, 2000)
 const old = structuredClone(base); old.lang = 'he'; old._ts = stampChange(base, old, 3000)
 for (const [a,b] of [[phone,old],[old,phone]]) {
  const merged = mergeStates(a,b)
  expect(merged.cardioBy).toEqual({ future: 'keep', '2138': 'distance' })
  expect(merged.lang).toBe('he')
 }
})
