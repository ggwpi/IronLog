import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'
for (const stamped of [false, true]) test(`gym inventories survive compatible legacy edits (${stamped})`, () => {
  const cur = { _ts: 100, equipProfiles: [{ id: 'home', name: 'בית', equipment: ['dumbbell'], dumbbells: { kg: { weights: [5, 10], _ts: 80 } }, custom: { keep: true } }], stackWeights: { x: { unit: 'kg', weights: [5, 11.3], _ts: 90, custom: 'keep' } } }
  const next = structuredClone(cur); next.equipProfiles[0].name = 'חדש'
  if (!stamped) { delete next.equipProfiles[0].dumbbells; delete next.equipProfiles[0].custom; delete next.stackWeights }
  stampPut(cur, next, { stamped, overRead: true, trainingDataVersion: 2, now: 200 })
  assert.equal(next.equipProfiles[0].name, 'חדש'); assert.deepEqual(next.equipProfiles[0].dumbbells, cur.equipProfiles[0].dumbbells)
  assert.deepEqual(next.equipProfiles[0].custom, { keep: true }); assert.deepEqual(next.stackWeights, cur.stackWeights)
})
test('explicit stack clears are stamped without deleting other machine inventories', () => {
  const cur = { stackWeights: { x: { unit: 'kg', weights: [5], _ts: 1 }, y: { unit: 'kg', weights: [7], _ts: 2 } } }, next = structuredClone(cur)
  next.stackWeights.x = { _ts: 3 }; stampPut(cur, next, { stamped: true, trainingDataVersion: 2, now: 100 })
  assert.deepEqual(next.stackWeights.x, { _ts: 3 }); assert.deepEqual(next.stackWeights.y, cur.stackWeights.y)
})
