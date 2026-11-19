// Pure fixtures only; no account, database or Supabase access.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'

const fixture = () => ({ _ts: 1000, unit: 'kg', cardioGoal: 150,
 cardioGoals: [{ kind: 'run', unit: 'km', v: 10 }, { kind: 'any', unit: 'min', v: 150 }],
 workouts: [{ id: 'legacy', d: '2026-11-18', entries: [{ id: '0025', sets: [{ w: 60, r: 8, done: true, note: 'א'.repeat(500), tag: 'blue', media: [{ hash: 'keep' }] }] }] }],
 routines: [], bodyweight: [{ d: '2026-11-18', w: 80 }] })

test('an old unstamped minutes edit retains unknown multi-goal settings and every workout field', () => {
 const current = fixture(), next = structuredClone(current)
 delete next.cardioGoals; next.cardioGoal = 300
 stampPut(current, next, { overRead: true, stamped: false, now: 2000 })
 assert.deepEqual(next.cardioGoals, current.cardioGoals)
 assert.equal(next.cardioGoal, 300)
 assert.deepEqual(next.workouts, current.workouts)
 assert.deepEqual(next.bodyweight, current.bodyweight)
})
test('a modern stamped clear remains cleared', () => {
 const current = fixture(), next = structuredClone(current)
 next.cardioGoals = []; next.cardioGoal = 0
 stampPut(current, next, { overRead: true, stamped: true, now: 2000 })
 assert.deepEqual(next.cardioGoals, [])
 assert.equal(next.cardioGoal, 0)
 assert.deepEqual(next.workouts, current.workouts)
})
