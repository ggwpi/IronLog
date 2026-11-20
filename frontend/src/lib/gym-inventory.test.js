// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { syncGymInventory, switchGym, copyInventory, gymView, reRoundOpenSets, INV_KEYS } from './gym-inventory.js'
import { useStore, DEF } from '../store/useStore.js'
import { stampChange, mergeStates } from './sync-merge.js'
import { buildCompletedWorkout } from './finish-workout.js'
import { EXDB } from './exercises-data.js'
const clone = structuredClone
const id = EXDB.find(e => e.eq === 'dumbbell' && /curl/.test(e.n)).id
const fixture = () => ({ ...clone(DEF), unit: 'kg', plates: { kg: { 10: 2, _ts: 1, custom: 'keep' } },
  dumbbells: { kg: { weights: [5, 10, 15], _ts: 1 } }, barDefaults: { kg: { barbell: 15 } },
  equipProfiles: [{ id: 'home', name: 'בית', equipment: ['dumbbell'], custom: { keep: true } }, { id: 'gym', name: 'חדר כושר', equipment: ['dumbbell'] }],
  activeEquipId: 'home', workouts: [{ id: 'old', d: '2026-01-01', note: 'א'.repeat(500), media: [{ hash: 'h' }], entries: [] }],
})
it('retains the entire original inventory algorithm byte for byte', () => {
  const bytes = readFileSync('src/lib/opengym-v145/session-engine/frontend/src/lib/gym-inventory.js')
  expect(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')).toBe('ea8bb84c98b228c310f7940d6cd911cccb0b7ab8')
})
it('initializes every legacy gym with the current inventory and preserves all existing values', () => {
  const S = fixture(), before = clone(S)
  syncGymInventory(S, null, 100)
  for (const key of INV_KEYS) for (const g of S.equipProfiles) expect(g[key]).toEqual(before[key] || {})
  expect(S.workouts).toEqual(before.workouts); expect(S.plates).toEqual(before.plates)
  expect(S.equipProfiles[0].custom).toEqual(before.equipProfiles[0].custom)
  const none = { ...before, equipProfiles: [] }, old = clone(none)
  syncGymInventory(none); expect(none).toEqual(old)
})
it('isolates inventory edits and copying, including separate kg/lb lists and unknown metadata', () => {
  const S = fixture(); syncGymInventory(S, null, 100)
  switchGym(S, 'gym', 200); S.dumbbells = { kg: { weights: [7, 12], _ts: 201 }, lb: { weights: [25], _ts: 201, future: 'keep' } }
  syncGymInventory(S, null, 202); switchGym(S, 'home', 300)
  expect(S.dumbbells.kg.weights).toEqual([5, 10, 15]); expect(gymView(S, 'gym').dumbbells.lb.future).toBe('keep')
  copyInventory(S, 'gym', 'dumbbells', { now: 400 }); syncGymInventory(S, null, 401)
  expect(S.dumbbells.kg.weights).toEqual([7, 12]); expect(S.dumbbells.lb.weights).toEqual([25])
  expect(S.plates.kg.custom).toBe('keep')
})
it('settles an older-client profile switch without replacing the other gym inventory', () => {
  const S = fixture(); syncGymInventory(S, null, 100)
  S.equipProfiles[1].dumbbells = { kg: { weights: [8, 16], _ts: 200 } }
  S.activeEquipId = 'gym'; syncGymInventory(S, null, 300)
  expect(S.dumbbells.kg.weights).toEqual([8, 16]); expect(S.equipProfiles[0].dumbbells.kg.weights).toEqual([5, 10, 15])
})
it('uses the actual store update and retains per-gym data across offline merges', () => {
  const S = fixture(); useStore.setState({ S, user: null })
  useStore.getState().update(s => { s.sound = false }, false)
  const base = clone(useStore.getState().S), remote = clone(base)
  remote.equipProfiles[1].name = 'מרוחק'; stampChange(base, remote, 500)
  useStore.getState().update(s => { switchGym(s, 'gym', 600); s.dumbbells = { kg: { weights: [9, 18], _ts: 601 } } }, false)
  const merged = mergeStates(useStore.getState().S, remote)
  syncGymInventory(merged, null, 700)
  expect(merged.equipProfiles[1].name).toBe('מרוחק'); expect(merged.dumbbells.kg.weights).toEqual([9, 18])
  expect(merged.workouts).toEqual(base.workouts)
})
it('switches and rounds only unfinished work, retaining completed weights and notes', () => {
  const S = fixture(); syncGymInventory(S, null, 100)
  S.equipProfiles[1].dumbbells = { kg: { weights: [7, 12], _ts: 200 } }
  S.active = { id: 'a', d: '2026-11-20', start: 1, entries: [{ id, target: { id, mode: 'reps', dbLoad: 'each' }, sets: [{ w: 15, r: 8, done: true, note: 'א'.repeat(500) }, { w: 15, r: 8, done: false }] }] }
  syncGymInventory(S, null, 201); switchGym(S, 'gym', 300); expect(reRoundOpenSets(S)).toBe(1)
  expect(S.active.entries[0].sets[0].w).toBe(15); expect(S.active.entries[0].sets[1].w).toBe(12)
  const saved = buildCompletedWorkout(S.active, { end: 400 })
  expect(saved.gym).toEqual({ id: 'gym', name: 'חדר כושר' }); expect(saved.entries[0].sets[0].note).toHaveLength(500)
})
