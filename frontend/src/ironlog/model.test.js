import { describe, it, expect } from 'vitest'
import { ironModel } from './model.js'

const now = new Date('2026-10-22T12:00:00Z')
const base = () => ({ unit:'kg', routines:[], week:{}, dayPlan:{}, workouts:[], bodyweight:[], customEx:[], exWeights:{} })
const workout = (d, sets) => ({ id:d, d, entries:[{ id:'custom-bench', exercise:{ n:'Bench', tg:'pectorals', sm:['triceps'] }, sets }] })

describe('IronLog widgets over openGym history', () => {
  it('keeps empty widgets honest and does not invent a cycle or plan', () => {
    const s = base(), before = structuredClone(s)
    const result = ironModel(s, now)
    expect(result.workouts).toEqual([])
    expect(result.model.bodyWeight.hasData).toBe(false)
    expect(result.model.recovery.hasData).toBe(false)
    expect(result.model.mesocycle.totalWeeks).toBe(0)
    expect(s).toEqual(before)
  })
  it('counts only completed work sets in the current week, with secondary credit', () => {
    const s = base()
    s.workouts = [workout('2026-10-21', [{ done:true,w:60,r:8,rir:2 }, { done:true,w:20,r:10,type:'warmup',warmup:true }, { done:false,w:60,r:8 }]),workout('2026-10-01',[{ done:true,w:100,r:8 }])]
    const result = ironModel(s,now)
    expect(result.model.muscleVolume.muscles.find(m => m.id === 'chest').actual).toBe(1)
    expect(result.model.muscleVolume.muscles.find(m => m.id === 'triceps').actual).toBe(0.5)
    expect(result.model.recovery.rirAdherence.value).toBe('100%')
  })
  it('converts pounds to kilograms for the original weight widget', () => {
    const s = base(); s.unit='lb'; s.bodyweight=[{d:'2026-10-21',w:200}]
    expect(ironModel(s,now).model.bodyWeight.current).toBe(90.7)
  })
  it('does not reuse stale recovery check-ins', () => {
    const s = base(); s.ironlogRecovery=[{measured_at:'2026-09-01',sleep_minutes:480,readiness:7}]
    expect(ironModel(s,now).model.recovery.hasData).toBe(false)
  })
})
