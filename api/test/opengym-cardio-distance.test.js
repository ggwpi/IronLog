// Pure compatibility fixtures, with no account/database/network access.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'

test('legacy known-distance clearing remains intentional while unknown logging preferences survive', () => {
 const current = { _ts: 1000, _rev: 1, unit: 'kg', cardioBy: { '2138': 'distance', future: 'keep' },
 workouts: [{ id: 'fixture', d: '2026-11-19', entries: [{ id: '2138', sets: [{ min: 30, km: 5, speed: 10, done: true, tag: 'blue', note: 'א'.repeat(500), media: [{ hash: 'keep' }] }] }] }], routines: [], bodyweight: [] }
 const next = structuredClone(current)
 delete next.cardioBy; delete next.workouts[0].entries[0].sets[0].km; delete next.workouts[0].entries[0].sets[0].tag
 next.workouts[0].entries[0].sets[0].speed = 12
 stampPut(current, next, { overRead: true, stamped: false, now: 2000 })
 assert.deepEqual(next.cardioBy, current.cardioBy)
 assert.equal(next.workouts[0].entries[0].sets[0].km, undefined)
 assert.equal(next.workouts[0].entries[0].sets[0].speed, 12)
 assert.equal(next.workouts[0].entries[0].sets[0].tag, 'blue')
 assert.equal(next.workouts[0].entries[0].sets[0].note.length, 500)
 assert.deepEqual(next.workouts[0].entries[0].sets[0].media, [{ hash: 'keep' }])
 assert.equal(current.workouts[0].entries[0].sets[0].km, 5)
})
