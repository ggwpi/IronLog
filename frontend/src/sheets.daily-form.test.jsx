// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { startFlow, beginWorkout } from './sheets.jsx'
import { setNav } from './lib/nav.js'
import { auditCompleteProfilePreservation } from './lib/migration-audit.js'
import { goLighter } from './lib/daily-form.js'
import { buildCompletedWorkout } from './lib/finish-workout.js'
import { mergeStates, stampChange } from './lib/sync-merge.js'

vi.mock('./lib/api.js', () => ({ api: vi.fn(() => Promise.resolve({})) }))
vi.mock('./lib/lightning-transition.js', () => ({ lightningTransition: (_source, action) => { action(); return () => {} } }))
vi.mock('./lib/screen-ready.js', () => ({ waitForWorkoutScreen: () => Promise.resolve() }))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root, host
const clone = v => structuredClone(v)
const current = () => useStore.getState().S
const click = button => act(() => button.click())
const button = text => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text)
const rate = (key,n) => click(host.querySelector(`[data-daily-form-question="${key}"] button[aria-label="${n}"]`))
const protectedState = s => { const { active, _ts, _rev, ...rest } = clone(s); return rest }
function renderSheet() {
 if (root) act(() => root.unmount())
 if (host) host.remove()
 host = document.createElement('div'); document.body.appendChild(host); root=createRoot(host)
 const sheet=useUI.getState().sheets.at(-1)
 act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
}
beforeEach(() => {
 setNav(vi.fn()); useUI.setState({ sheets: [], timer: null, work: null })
 const S=clone(DEF)
 Object.assign(S,{ dailyForm:true,weighIn:false,active:null,dayForm:{'2026-01-01':{energy:4,_ts:1}},customUnknown:{keep:true},
  workouts:[{id:'keep',d:'2026-01-02',entries:[{id:'0043',sets:[{w:60,r:8,done:true,note:'א'.repeat(500),media:[{hash:'keep'}]}]}]}],
  routines:[{id:'r',name:'Routine',ex:[{id:'0025',mode:'reps',sets:3,reps:8,weight:80}]}] })
 useStore.setState({ S,user:null })
})
afterEach(() => { if(root)act(()=>root.unmount());host?.remove();root=host=null;useUI.getState().stopRest() })
function openRough() { act(()=>startFlow(['r']));renderSheet();rate('sleep',1);rate('energy',1) }

it('keeps preview read-only and rough-day Start defaults to the original planned workout',()=>{
 const before=clone(current());openRough()
 expect(current()).toEqual(before)
 expect(button('As planned')).toBeTruthy();expect(button('10% lighter')).toBeTruthy();expect(button('One set fewer')).toBeTruthy()
 click(button('Start workout'))
 expect(current().active.entries[0].sets.map(s=>s.w)).toEqual([80,80,80])
 expect(current().active.noProg).toBeUndefined()
 expect(auditCompleteProfilePreservation(protectedState(before),protectedState(current())).ok).toBe(true)
})
it.each([['10% lighter','load',3,70],['One set fewer','sets',2,80]])('applies explicit %s only to the new session', (label,kind,count,weight)=>{
 const before=clone(current());openRough();click(button(label));click(button('Start workout'))
 const active=current().active
 expect(active.entries[0].sets).toHaveLength(count);expect(active.entries[0].sets.every(s=>s.w===weight)).toBe(true)
 expect(active.noProg).toBe(true);expect(active.lighter).toBe(kind);expect(active.entries.every(e=>e.noProg)).toBe(true)
 expect(auditCompleteProfilePreservation(protectedState(before),protectedState(current())).ok).toBe(true)
 expect(Object.values(current().dayForm).find(f=>f.lighter===kind)).toMatchObject({sleep:1,energy:1})
 expect(JSON.parse(localStorage.getItem('gym_state_v1')).active).toEqual(active)
})
it('does not apply a previous lighter selection after the day is changed to good',()=>{
 openRough();click(button('10% lighter'));rate('sleep',5);rate('energy',5);click(button('Start workout'))
 expect(current().active.lighter).toBeUndefined();expect(current().active.entries[0].sets.every(s=>s.w===80)).toBe(true)
})
it('Skip writes no answer and starts the original plan',()=>{
 const before=clone(current());openRough();click(button('10% lighter'));click(button('Skip for today'))
 expect(current().dayForm).toEqual(before.dayForm);expect(current().active.noProg).toBeUndefined()
 expect(auditCompleteProfilePreservation(protectedState(before),protectedState(current())).ok).toBe(true)
})
it('carries the choice through the existing required weigh-in',()=>{
 useStore.setState(s=>({S:{...s.S,weighIn:true}}));openRough();click(button('10% lighter'));click(button('Start workout'))
 expect(current().active).toBeNull();expect(useUI.getState().sheets.at(-1).locked).toBe(true)
 // The real weigh-in callback uses beginWorkout with the same selected option.
 renderSheet();const skip=[...host.querySelectorAll('button')].find(b=>b.textContent.includes('without weighing'))
 expect(skip).toBeTruthy();click(skip)
 expect(current().active.lighter).toBe('load');expect(current().active.bw).toBeNull()
})
it('Health off leaves the existing start/weigh-in gate and all prior form records intact',()=>{
 useStore.setState(s=>({S:{...s.S,modules:{health:false}}}));const before=clone(current());act(()=>startFlow(['r']))
 expect(useUI.getState().sheets).toHaveLength(0);expect(current().active.lighter).toBeUndefined()
 expect(current().dayForm).toEqual(before.dayForm)
})
it('keeps saved history/routines and completed rows exact when the original model adapts an open row',()=>{
 act(()=>beginWorkout(['r'],null));const state=clone(current());const entry=state.active.entries[0]
 Object.assign(entry.sets[0],{done:true,note:'א'.repeat(500),media:[{hash:'keep'}],tag:'blue'})
 Object.assign(entry.sets[1],{note:'pending',media:[{hash:'pending'}],tag:'orange'})
 const before=clone(state);expect(goLighter(state,'load')).toBe(1)
 expect(state.active.entries[0].sets[0]).toEqual(before.active.entries[0].sets[0])
 expect(state.active.entries[0].sets[1]).toMatchObject({w:70,note:'pending',media:[{hash:'pending'}],tag:'orange'})
 expect(protectedState(state)).toEqual(protectedState(before))
 const saved=buildCompletedWorkout(state.active)
 expect(saved.excludeFromProgression).toBe(true)
 expect(saved.entries.every(e=>e.noProg===true)).toBe(true)
 expect(saved.entries[0].sets[0]).toEqual(before.active.entries[0].sets[0])
})
it('retains the daily lighter answer and other device settings through the actual stamped merge',()=>{
 const base=clone(current()), phone=clone(base),other=clone(base)
 phone.dayForm={...phone.dayForm,'2026-11-19':{sleep:1,energy:1,lighter:'load',_ts:2000}}
 phone._ts=stampChange(base,phone,2000)
 other.lang='he';other._ts=stampChange(base,other,3000)
 for(const [a,b] of [[phone,other],[other,phone]]){
  const merged=mergeStates(a,b)
  expect(merged.dayForm['2026-11-19'].lighter).toBe('load');expect(merged.lang).toBe('he')
  expect(merged.workouts).toEqual(base.workouts);expect(merged.routines).toEqual(base.routines)
 }
})
it.each([undefined,false])('retains an explicit IronLog manual warm-up and its edited metadata (%s)',edited=>{
 act(()=>beginWorkout(['r'],null));const state=clone(current())
 const warm={w:37.5,r:5,done:false,warmup:true,weightOrigin:'manual',note:'keep warm-up',media:[{hash:'keep'}],...(edited===false?{edited:false}:{})}
 state.active.entries[0].sets.unshift(warm);const before=clone(warm)
 expect(goLighter(state,'load')).toBe(1)
 expect(state.active.entries[0].sets[0]).toEqual(before)
 expect(state.active.entries[0].sets.slice(1).every(s=>s.w===70)).toBe(true)
})
