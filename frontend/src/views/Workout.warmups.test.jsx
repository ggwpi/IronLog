// @vitest-environment happy-dom
import React,{act}from'react'
import{createRoot}from'react-dom/client'
import{MemoryRouter}from'react-router-dom'
import{beforeEach,afterEach,it,expect,vi}from'vitest'
import Workout from './Workout.jsx'
import Modals from '../components/Modals.jsx'
import{bindUI}from'../components/ui.jsx'
import{DEF,useStore}from'../store/useStore.js'
import{useUI}from'../store/useUI.js'
import{buildCombinedEntries}from'../lib/session-merge.js'
vi.mock('../lib/api.js',()=>({api:vi.fn(()=>Promise.resolve({}))}))
vi.mock('../lib/sound.js',()=>({beep:vi.fn(),vibrate:vi.fn(),unlock:vi.fn()}))
globalThis.IS_REACT_ACT_ENVIRONMENT=true
let root,host
beforeEach(()=>{bindUI(useUI);useUI.setState({sheets:[],timer:null,work:null});host=document.createElement('div');document.body.appendChild(host);root=createRoot(host)})
afterEach(()=>{act(()=>root.unmount());host.remove();useUI.getState().stopRest()})
const row=i=>host.querySelectorAll('.setrow')[i]
const increaseLoad=i=>act(()=>row(i).querySelector('.stp button[aria-label="Increase"]').click())
it.each(['cards','list','compact'])('uses original live ramps in actual %s controls while preserving manual/completed rows and all metadata',async view=>{
 const S=structuredClone(DEF)
 Object.assign(S,{unit:'kg',workouts:[],customEx:[],warmupAuto:'compounds',routines:[{id:'r',name:'Plan',ex:[{id:'0025',mode:'reps',sets:3,reps:8,weight:140,inc:2.5,note:'א'.repeat(500)}]}]})
 const entries=buildCombinedEntries(S,['r']).entries
 entries[0].sets[1].note='keep manual';entries[0].sets[1].media=[{hash:'keep'}];entries[0].sets[2].done=true
 S.active={id:'new',d:'2026-11-19',start:Date.now(),cur:0,routineIds:['r'],workoutView:view,entries}
 const savedRoutine=structuredClone(S.routines)
 useStore.setState({S,user:null});act(()=>root.render(<MemoryRouter><Workout/><Modals/></MemoryRouter>))
 expect(host.querySelectorAll('.setrow')).toHaveLength(7)
 increaseLoad(1);const before=structuredClone(useStore.getState().S.active.entries[0].sets)
 expect(before[1]).toMatchObject({w:57.5,edited:true,weightOrigin:'manual',note:'keep manual',media:[{hash:'keep'}]})
 increaseLoad(4)
 const after=useStore.getState().S.active.entries[0].sets
 expect(after[0].w).toBe(20);expect(after[1]).toEqual(before[1]);expect(after[2]).toEqual(before[2]);expect(after[3].w).toBe(112.5)
 expect(after.slice(4).map(s=>s.w)).toEqual([142.5,142.5,142.5]);expect(useStore.getState().S.routines).toEqual(savedRoutine)
 const active=structuredClone(useStore.getState().S.active)
 await act(async()=>host.querySelector('button[aria-label="More"]').click())
 const keep=[...document.querySelectorAll('.menu-item')].find(e=>e.querySelector('.tt')?.textContent==='Keep these warm-ups')
 expect(keep).toBeTruthy();await act(async()=>keep.click())
 expect(useStore.getState().S.active).toEqual(active)
 expect(useStore.getState().S.routines[0].ex[0]).toMatchObject({weight:140,note:'א'.repeat(500),warmup:'own',warmupRows:[{wb:true,r:10},{wp:40,r:5},{wp:58,r:3},{wp:79,r:1}]})
})
