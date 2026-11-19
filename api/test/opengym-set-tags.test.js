// Pure fixtures only: no server, Supabase credentials, remote reads or writes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'

test('an older IronLog client preserves set colour tags, notes, media and custom IDs on save', () => {
  const current = { _ts: 1000, _rev: 1, unit: 'kg', workouts: [{ id: 'fixture-workout', d: '2026-11-18', start: 1, end: 2,
    entries: [{ id: 'custom-fixture', sets: [{ w: 60, r: 8, done: true, tag: 'blue', note: 'א'.repeat(500), media: [{ hash: 'fixture-only' }] }] }] }],
    routines: [], bodyweight: [{ d: '2026-11-18', w: 80 }] }
  const next = structuredClone(current)
  delete next.workouts[0].entries[0].sets[0].tag
  next.restSec = 120
  stampPut(current, next, { overRead: true, stamped: false, now: 2000 })
  assert.deepEqual(next.workouts[0].entries[0].sets, current.workouts[0].entries[0].sets)
  assert.deepEqual(next.bodyweight, current.bodyweight)
  assert.equal(next.workouts[0].entries[0].id, 'custom-fixture')
  assert.equal(next.restSec, 120)
})

test('keeps IronLog legacy intentional note clearing while protecting an unknown colour tag', () => {
  const current = { _ts: 1000, _rev: 1, unit: 'kg', workouts: [{ id: 'fixture', d: '2026-11-18', start: 1,
    entries: [{ id: 'custom-fixture', sets: [{ w: 60, r: 8, done: true, note: 'א'.repeat(500), tag: 'blue' }] }] }], routines: [], bodyweight: [] }
  const next = structuredClone(current)
  // The older IronLog schema already knows `note`: its documented omission means clear.
  // `tag` is unknown to it and must be retained instead. Do not change V139_DROPS to hide this distinction.
  delete next.workouts[0].entries[0].sets[0].note
  delete next.workouts[0].entries[0].sets[0].tag
  stampPut(current, next, { overRead: true, stamped: false, now: 2000 })
  assert.equal(next.workouts[0].entries[0].sets[0].note, undefined)
  assert.equal(next.workouts[0].entries[0].sets[0].tag, 'blue')
  assert.equal(current.workouts[0].entries[0].sets[0].note.length, 500)
})

test('an old unstamped writer retains set and routine tempos without losing its workout edit', () => {
  const current = { _ts: 1000, _rev: 1, unit: 'kg', workouts: [{ id: 'fixture', d: '2026-11-19', entries: [{ id: '0025', sets: [{ w: 60, r: 8, done: true, tempo: '5-0-X-0', tag: 'blue' }] }] }],
    routines: [{ id: 'plan', name: 'Keep', ex: [{ id: '0025', sets: 1, reps: 8, tempo: '3-1-1-0' }] }], bodyweight: [] }
  const next = structuredClone(current)
  delete next.workouts[0].entries[0].sets[0].tempo
  delete next.routines[0].ex[0].tempo
  next.workouts[0].entries[0].sets[0].r = 9
  stampPut(current, next, { overRead: true, stamped: false, now: 2000 })
  assert.equal(next.workouts[0].entries[0].sets[0].tempo, '5-0-X-0')
  assert.equal(next.workouts[0].entries[0].sets[0].r, 9)
  assert.equal(next.routines[0].ex[0].tempo, '3-1-1-0')
  assert.equal(current.workouts[0].entries[0].sets[0].r, 8)
})
