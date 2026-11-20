import { expect, it } from 'vitest'
import { stackOf, withStack, stackFromStep, parseWeightList } from './machine-stacks.js'
import { ownedWeightsFor } from './dumbbells.js'
import { nextPrescription } from './progression.js'
import { EXDB } from './exercises-data.js'
import { mergeStates, stampChange } from './sync-merge.js'
const id = EXDB.find(e => e.eq === 'cable' && /row/.test(e.n)).id
it('retains metadata, canonical unit and explicit clears while using the original list parsers', () => {
  const S = { unit: 'kg', stackWeights: { [id]: { unit: 'kg', weights: [5], _ts: 1, custom: { keep: true } } } }
  expect(parseWeightList('5, 11.3; 18.1 kg')).toEqual([5, 11.3, 18.1])
  expect(parseWeightList('5; 11,3; 18,1', true)).toEqual([5, 11.3, 18.1])
  expect(stackFromStep(5, 2.5, 3)).toEqual([5, 7.5, 10])
  const next = { ...S, stackWeights: withStack(S, id, [5, 11.3, 18.1], 100) }
  expect(ownedWeightsFor(next, { id, mode: 'reps' })).toEqual([5, 11.3, 18.1])
  expect(next.stackWeights[id].custom).toEqual({ keep: true }); expect(S.stackWeights[id].weights).toEqual([5])
  expect(stackOf({ ...next, unit: 'lb' }, id)).toEqual([11, 24.9, 39.9])
  expect(withStack(next, id, [], 200)[id]).toEqual({ custom: { keep: true }, _ts: 200 })
})
it('advances a machine on its actual stack using the unchanged upstream progression', () => {
  const cfg = { id, mode: 'reps', sets: 2, reps: 8, weight: 10, inc: 2.5, prog: 'linear' }
  const S = { unit: 'kg', stackWeights: { [id]: { unit: 'kg', weights: [5, 10, 13.6], _ts: 1 } }, workouts: [{ id: 'w', d: '2026-11-19', entries: [{ id, target: cfg, sets: [{ w: 10, r: 8, done: true }, { w: 10, r: 8, done: true }] }] }] }
  const result = nextPrescription(S, cfg)
  expect(result.weight).toBe(13.6)
})
it('merges concurrent machine inventories per exercise using existing stamped-map rules', () => {
  const base = { unit: 'kg', stackWeights: { x: { unit: 'kg', weights: [5], _ts: 1 } } }, a = structuredClone(base), b = structuredClone(base)
  a.stackWeights.x = { unit: 'kg', weights: [7], _ts: 10 }; b.stackWeights.y = { unit: 'kg', weights: [9], _ts: 20 }
  stampChange(base, a, 10); stampChange(base, b, 20)
  const merged = mergeStates(a, b)
  expect(merged.stackWeights.x.weights).toEqual([7]); expect(merged.stackWeights.y.weights).toEqual([9])
})
