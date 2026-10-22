import { describe, it, expect } from 'vitest'
import { addOriginalPlan } from './preset.js'
import { ironModel } from './model.js'

describe('original IronLog programme', () => {
 it('adds six days without replacing existing routines, and is idempotent', () => {
  const s={routines:[{id:'existing',name:'Mine',ex:[]}],week:{1:['existing']},customEx:[]}
  addOriginalPlan(s)
  expect(s.routines).toHaveLength(7)
  expect(s.week[1][0]).toBe('existing')
  expect(s.customEx).toHaveLength(38)
  expect(s.routines.find(r=>r.name==='PUSH A').ex[0]).toMatchObject({sets:4,restSec:150})
  addOriginalPlan(s)
  expect(s.routines).toHaveLength(7)
 })
 it('keeps the original sub-muscle credit when history has an exercise snapshot', () => {
  const s={routines:[],week:{},customEx:[],workouts:[],bodyweight:[]}
  addOriginalPlan(s)
  s.workouts=[{d:'2026-10-21',entries:[{id:'ironlog-incline-smith',exercise:{n:'Incline Smith Press'},sets:[{done:true,w:60,r:8,rir:2}]}]}]
  const model=ironModel(s,new Date('2026-10-22T12:00:00Z')).model
  expect(model.muscleVolume.muscles.find(m=>m.id==='upper-chest').actual).toBe(1)
  expect(model.muscleVolume.muscles.find(m=>m.id==='triceps').actual).toBe(.5)
 })
})
