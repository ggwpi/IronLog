// @vitest-environment happy-dom
import React,{act}from'react'
import{createRoot}from'react-dom/client'
import{beforeEach,afterEach,expect,it,vi}from'vitest'
import{DEF,useStore}from'../store/useStore.js'
import{useUI}from'../store/useUI.js'
import{bindUI}from'./ui.jsx'
import Modals from './Modals.jsx'
import{warmupPlanSheet}from'./WarmupPlanSheet.jsx'
import{exConfigSheet}from'../sheets.jsx'
import{EXIDX}from'../lib/exercises.js'
vi.mock('../lib/api.js',()=>({api:vi.fn(()=>Promise.resolve({}))}))
globalThis.IS_REACT_ACT_ENVIRONMENT=true
let root,host
const top=()=>[...document.querySelectorAll('#modal-root .sheet')].at(-1)
const row=text=>[...top().querySelectorAll('.lrow')].find(e=>e.querySelector('.lrow-t')?.textContent===text)
const button=text=>[...top().querySelectorAll('button')].find(e=>e.textContent.trim()===text)
const click=async el=>{expect(el).toBeTruthy();await act(async()=>el.click())}
const cfg=()=>({sets:3,reps:8,weight:140,warmupSets:2,note:'א'.repeat(500),tempo:'3-1-1-0'})
beforeEach(()=>{bindUI(useUI);useUI.setState({sheets:[],toastMsg:'',toasts:[]});useStore.setState({S:{...structuredClone(DEF),unit:'kg',active:null,customEx:[],workouts:[],routines:[]},user:null});host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);act(()=>root.render(<Modals/>))})
afterEach(()=>{act(()=>root.unmount());host.remove();useUI.getState().stopRest()})
it('uses the original full editor with actual pickers, Bar display, add/remove and Save',async()=>{
 const done=vi.fn(),value=cfg(),before=structuredClone(useStore.getState().S)
 act(()=>warmupPlanSheet({st:useStore.getState().S,ex:EXIDX['0025'],value,onDone:done}))
 await click(row('Warm-ups'));await click(row('My own'))
 expect(top().querySelectorAll('.warmup-row')).toHaveLength(4);expect(top().querySelector('.stp-word').textContent).toBe('Bar')
 await click(top().querySelector('button[aria-label="Increase Warm-up 1: Bar"]'))
 await click(button('Add a warm-up'));expect(top().querySelectorAll('.warmup-row')).toHaveLength(5)
 await click(top().querySelector('button[aria-label="Remove warm-up 5"]'));expect(top().querySelectorAll('.warmup-row')).toHaveLength(4)
 await click(button('Save'))
 expect(done).toHaveBeenCalledOnce();expect(done.mock.calls[0][0]).toMatchObject({warmup:'own',note:value.note,tempo:value.tempo})
 expect(done.mock.calls[0][0].warmupRows[0]).toEqual({wp:5,r:10});expect(done.mock.calls[0][0]).not.toHaveProperty('warmupSets')
 expect(useStore.getState().S).toEqual(before)
})
it('Cancel discards all editor changes and leaves the complete profile and original config exact',async()=>{
 const done=vi.fn(),value=cfg(),before=structuredClone(value),profile=structuredClone(useStore.getState().S)
 act(()=>warmupPlanSheet({st:useStore.getState().S,ex:EXIDX['0025'],value,onDone:done}))
 await click(row('Warm-ups'));await click(row('Auto'));await click(button('Cancel'))
 expect(done).not.toHaveBeenCalled();expect(value).toEqual(before);expect(useStore.getState().S).toEqual(profile)
})
it('describes the actual IronLog volume behavior while retaining an imported future preference unchanged',()=>{
 useStore.setState(s=>({S:{...s.S,volumeWarmups:true}}));const before=structuredClone(useStore.getState().S)
 act(()=>warmupPlanSheet({st:useStore.getState().S,ex:EXIDX['0025'],value:cfg(),onDone:vi.fn()}))
 expect(top().textContent).toContain('left out of volume, records and progression')
 expect(useStore.getState().S).toEqual(before)
})
it('keeps the existing count control and saves new own rows through actual ExConfig without losing note/tempo',async()=>{
 const done=vi.fn(),value=cfg(),profile=structuredClone(useStore.getState().S)
 act(()=>exConfigSheet(EXIDX['0025'],value,done))
 expect([...top().querySelectorAll('.stp-l')].some(e=>e.textContent==='Warm-up sets')).toBe(true)
 await click(row('Warm-ups'));await click(row('Warm-ups'));await click(row('My own'));await click(button('Save'))
 expect(done).not.toHaveBeenCalled();expect(useStore.getState().S).toEqual(profile)
 await click(button('Save'))
 expect(done).toHaveBeenCalledOnce();expect(done.mock.calls[0][0]).toMatchObject({warmup:'own',note:value.note,tempo:value.tempo,weight:140,reps:8,sets:3})
 expect(done.mock.calls[0][0].warmupRows).toHaveLength(4)
})
