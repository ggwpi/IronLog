// Pure fixtures only: no server, Supabase credentials, remote reads or writes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'

test('an older IronLog client preserves set colour tags, notes, media and custom IDs on save', () => {
  const current = { _ts: 1000, _rev: 1, unit: 'kg', workouts: [{ id: 'fixture-workout', d: '2026-11-18', start: 1, end: 2,
    entries: [{ id: 'custom-fixture', sets: [{ w: 60, r: 8, done: true, tag: 'blue', note: 'original note', media: [{ hash: 'fixture-only' }] }] }] }],
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
