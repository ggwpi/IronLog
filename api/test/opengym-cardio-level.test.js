// Synthetic local sync fixtures; no database or network access.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'
const fixture = () => ({ _ts: 1000, showCardioLevel: true, routines: [{ id: 'r', ex: [{ id: '2138', sets: 1, min: 20, speed: 10, level: 8 }] }], workouts: [{ id: 'keep', entries: [{ id: '2138', sets: [{ min: 20, speed: 10, level: 8, done: true, note: 'א'.repeat(500), media: [{ hash: 'keep' }] }] }] }] })
test('old writers preserve unknown resistance fields alongside intentional speed edits', () => {
  const current = fixture(), before = structuredClone(current), next = structuredClone(current)
  delete next.showCardioLevel
  delete next.routines[0].ex[0].level
  delete next.workouts[0].entries[0].sets[0].level
  next.workouts[0].entries[0].sets[0].speed = 12
  stampPut(current, next, { overRead: true, stamped: false, now: 2000 })
  assert.equal(next.showCardioLevel, true)
  assert.deepEqual(next.routines[0].ex, current.routines[0].ex)
  assert.deepEqual(next.workouts[0].entries[0].sets[0], { ...current.workouts[0].entries[0].sets[0], speed: 12 })
  assert.deepEqual(current, before)
})
test('modern intentional clears remain clear without rewriting saved history', () => {
  const current = fixture(), next = structuredClone(current)
  next.showCardioLevel = false
  delete next.routines[0].ex[0].level
  stampPut(current, next, { overRead: true, stamped: true, now: 2000 })
  assert.equal(next.showCardioLevel, false)
  assert.equal(next.routines[0].ex[0].level, undefined)
  assert.deepEqual(next.workouts, current.workouts)
})
