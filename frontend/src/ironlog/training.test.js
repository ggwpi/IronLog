import { describe, expect, it } from 'vitest'
import { trainingInsights, cycleWeeks } from './training.js'
import { loadOfWorkouts, loadOfWeeklyPlan } from '../lib/muscles.js'

const now = new Date('2026-10-22T12:00:00')
const base = () => ({ unit:'kg', weekStart:0, week:{}, routines:[], customEx:[], workouts:[], bodyweight:[] })
const workout = (d, sets) => ({ id:d, d, entries:[{id:'own-bench',exercise:{tg:'pectorals',sm:['triceps']},sets}] })
describe('one training model for native charts and IronLog insights', () => {
  it('leaves missing measurements empty and never seeds or modifies a profile', () => {
    const S=base(), before=structuredClone(S), model=trainingInsights(S,now)
    expect(model).toMatchObject({workouts:[],sets:0,load:{},planned:{},effort:{rated:0,percent:null},weight:{current:null,previous:null,delta:null},recovery:{sleep:null,readiness:null}})
    expect(cycleWeeks(S,now)).toEqual([])
    expect(S).toEqual(before)
  })
  it('agrees exactly with native credits, including historical snapshots and warm-up exclusion', () => {
    const S=base()
    S.workouts=[workout('2026-10-21',[{done:true,w:60,r:8,rir:2},{done:true,type:'warmup',warmup:true,w:20,r:10},{done:false,w:60,r:8}]),workout('2026-10-01',[{done:true,w:80,r:8}])]
    const model=trainingInsights(S,now)
    expect(model.workouts).toHaveLength(1)
    expect(model.sets).toBe(1)
    expect(model.load).toEqual(loadOfWorkouts([S.workouts[0]]))
    expect(model.load.chest).toBe(1)
    expect(model.load.triceps).toBe(.4)
    expect(model.effort.percent).toBeNull()
  })
  it('uses the chosen week boundary rather than a separate Sunday calendar', () => {
    const S=base(); S.workouts=[workout('2026-10-18',[{done:true}])]
    expect(trainingInsights(S,now).sets).toBe(1)
    S.weekStart=1
    expect(trainingInsights(S,now).sets).toBe(0)
  })
  it('uses the native rotation and recurring-plan volume', () => {
    const S=base()
    S.routines=[{id:'a',ex:[{id:'0025',sets:4}]},{id:'b',ex:[{id:'0025',sets:2}]}]
    S.week={1:['a'],3:['a']}
    expect(trainingInsights(S,now).planned).toEqual(loadOfWeeklyPlan(S))
    S.queue={ids:['b'],since:+now,startsOn:'2026-10-22'}
    expect(trainingInsights(S,now).planned).toEqual(loadOfWeeklyPlan(S))
  })
  it('keeps unrated sets out of RIR adherence and converts RPE with the upstream reader', () => {
    const S=base(); S.workouts=[workout('2026-10-21',[{rir:1},{rpe:8},{rir:2},{rir:0},{rir:4},{}].map(s=>({...s,done:true,w:50,r:8})))]
    expect(trainingInsights(S,now).effort).toEqual({rated:5,inTarget:3,percent:60})
    expect(trainingInsights(S,now).sets).toBe(6)
  })
  it('requires actual weigh-ins in both windows and keeps the current unit', () => {
    const S=base(); S.unit='lb'; S.bodyweight=[{d:'2026-10-01',w:190},{d:'2026-10-21',w:200}]
    expect(trainingInsights(S,now).weight.delta).toBeNull()
    S.bodyweight.push({d:'2026-10-14',w:199},{d:'2026-10-22',w:202})
    expect(trainingInsights(S,now).weight).toMatchObject({current:201,previous:199,delta:2,samples:2,previousSamples:1})
  })
  it('does not use stale or future check-ins', () => {
    const S=base(); S.ironlogRecovery=[{measured_at:'2026-09-01',sleep_minutes:600,readiness:7},{measured_at:'2026-10-23',sleep_minutes:600,readiness:7},{measured_at:'2026-10-21',sleep_minutes:420,readiness:0}]
    expect(trainingInsights(S,now).recovery).toEqual({sleep:7,readiness:0,samples:1})
  })
  it('shows recorded sessions per cycle week without inventing completed or deload weeks', () => {
    const S=base(); S.ironlogCycle={starts_on:'2026-10-01',planned_weeks:4}; S.workouts=[workout('2026-10-02',[]),workout('2026-10-22',[])]
    expect(cycleWeeks(S,now)).toEqual([{number:1,current:false,sessions:1},{number:2,current:false,sessions:0},{number:3,current:false,sessions:0},{number:4,current:true,sessions:1}])
  })
})
