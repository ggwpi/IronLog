import { describe, expect, it } from 'vitest'
import plan from '../../public/ironlog-plan.opengym.json' with { type: 'json' }
import { parsePlan, mergePlan } from './plan-share.js'
import { EXDB } from './exercises-data.js'
import { IRONLOG_MATCHES, migrateIronLogExercises, prepareCatalogueMigration } from './ironlog-catalogue.js'

describe('original plan to upstream catalogue', () => {
  it('imports the real six-day plan through the upstream importer without custom definitions', () => {
    const parsed = parsePlan(JSON.stringify(plan))
    const state = {routines: [], week: {}, customEx: [], unit: 'kg'}
    expect(mergePlan(state, parsed, {schedule: true})).toEqual({routines: 6})
    expect(state.customEx).toEqual([])
    expect(Object.keys(state.week)).toHaveLength(6)
    expect(state.routines.flatMap(r => r.ex).every(e => EXDB.some(x => x.id === e.id))).toBe(true)
    expect(state.routines[0].ex[0]).toMatchObject({id: '0757', sets: 4, reps: 8, restSec: 150, note: '8–10 · RIR 1–2'})
  })
  it('maps all 38 exercises to actual upstream entries with stills and clips', () => {
    expect(Object.keys(IRONLOG_MATCHES)).toHaveLength(38)
    for (const id of Object.values(IRONLOG_MATCHES)) {
      const ex = EXDB.find(e => e.id === id)
      expect(ex, id).toBeTruthy()
      expect(ex.img, id).toBeTruthy()
      expect(ex.gif, id).toBeTruthy()
    }
  })
  it('keeps the plan prescription, logged sets and active work connected, and leaves other custom exercises', () => {
    const id = 'ironlog-incline-smith'
    const s = { routines: [{id: 'my-routine', ex: [{id, sets: 4, reps: 8, note: '8–10', backups: [id]}]}],
      workouts: [{id: 'workout', entries: [{id, sets: [{w: 60, r: 9}]}]}], active: {entries: [{id, target: {id}}]},
      exWeights: {[id]: 60}, exNotes: {[id]: 'seat 4'}, favEx: [id],
      customEx: [{id}, {id: 'my-exercise', n: 'Mine', media: {hash: 'keep'}}] }
    expect(migrateIronLogExercises(s)).toBe(true)
    expect(s.routines[0]).toEqual({id: 'my-routine', ex: [{id: '0757', sets: 4, reps: 8, note: '8–10', backups: ['0757']}]})
    expect(s.workouts[0].entries[0]).toEqual({id: '0757', sets: [{w: 60, r: 9}]})
    expect(s.active.entries[0].target.id).toBe('0757')
    expect(s.exWeights).toEqual({'0757': 60})
    expect(s.exNotes).toEqual({'0757': 'seat 4'})
    expect(s.favEx).toEqual(['0757'])
    expect(s.customEx).toEqual([{id: 'my-exercise', n: 'Mine', media: {hash: 'keep'}}])
    const after = JSON.stringify(s)
    expect(migrateIronLogExercises(s)).toBe(false)
    expect(JSON.stringify(s)).toBe(after)
  })
  it('does not overwrite a catalogue override when both records already exist', () => {
    const s = {exWeights: {'ironlog-incline-smith': 60, '0757': 70}}
    migrateIronLogExercises(s)
    expect(s.exWeights).toEqual({'ironlog-incline-smith': 60, '0757': 70})
  })
  it('requires a recoverable original before rewriting history', () => {
    const s = {workouts: [{entries: [{id: 'ironlog-incline-smith'}]}]}
    const items = new Map()
    const storage = {getItem: k => items.get(k), setItem: (k,v) => items.set(k,v)}
    expect(prepareCatalogueMigration(s, storage)).toBe(true)
    expect(JSON.parse(items.get('ironlog_before_catalogue_v1'))).toEqual(s)
    expect(() => prepareCatalogueMigration(s, {getItem: () => null, setItem: () => {throw Error('quota')}})).toThrow('quota')
  })
})
