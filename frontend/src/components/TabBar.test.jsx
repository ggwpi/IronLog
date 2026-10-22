// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TabBar from './TabBar.jsx'
import { DEF, useStore } from '../store/useStore.js'
import { menuSheet } from '../sheets.jsx'
import { todayISO } from '../lib/format.js'

const mocks = vi.hoisted(() => ({ nav:vi.fn(), path:'/home' }))
vi.mock('react-router-dom', () => ({ useNavigate:()=>mocks.nav, useLocation:()=>({pathname:mocks.path}) }))
vi.mock('../sheets.jsx', () => ({menuSheet:vi.fn()}))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root, original, onStart
const tabs=()=>[...host.querySelectorAll('#tabbar > button')]
const mount=()=>act(()=>root.render(<TabBar onStart={onStart} />))
const click=button=>act(()=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})))
const items=()=>menuSheet.mock.calls.at(-1)[0].items
beforeEach(()=>{
 original=useStore.getState();mocks.path='/home';mocks.nav.mockClear();menuSheet.mockClear();onStart=vi.fn()
 useStore.setState({S:structuredClone(DEF),user:{id:1,name:'test'},sync:{status:'ok',pending:false}})
 host=document.createElement('div');document.body.appendChild(host);root=createRoot(host)
})
afterEach(()=>{act(()=>root.unmount());host.remove();useStore.setState(original)})

describe('original IronLog four-tab navigation over upstream actions',()=>{
 it('shows the original four concepts and icons, with one selected tab',()=>{
  mount()
  expect(tabs().map(b=>b.querySelector('svg').dataset.icon)).toEqual(['house','dumbbell','chart','person'])
  expect(tabs().map(b=>b.textContent)).toEqual(['Home','Workouts','Stats','Account'])
  expect(tabs()[0].getAttribute('aria-current')).toBe('page')
  expect(tabs().filter(b=>b.hasAttribute('aria-current'))).toHaveLength(1)
 })
 it('retains the same DOM buttons across profile writes',()=>{
  mount();const before=tabs()
  act(()=>useStore.getState().update(s=>{s.restSec=91},false))
  tabs().forEach((button,i)=>expect(button).toBe(before[i]))
 })
 it.each([['/settings','Account'],['/plan','Workouts'],['/library','Workouts'],['/history','Stats']])('selects the parent for %s',(path,label)=>{
  mocks.path=path;mount();expect(host.querySelector('[aria-current=page]').textContent).toBe(label)
 })
 it('keeps native Plan, Exercises and Start reachable from Workouts',()=>{
  mount();click(tabs()[1]);expect(items().map(i=>i.label)).toEqual(['Start workout','Plan','Exercises'])
  act(()=>items()[1].onClick());expect(mocks.nav).toHaveBeenLastCalledWith('/plan')
  act(()=>items()[2].onClick());expect(mocks.nav).toHaveBeenLastCalledWith('/library')
  act(()=>items()[0].onClick());expect(mocks.nav).toHaveBeenLastCalledWith('/workout');expect(onStart).not.toHaveBeenCalled()
 })
 it('starts today through the upstream callback, never creates its own session',()=>{
  const day=new Date(todayISO()+'T12:00:00').getDay()
  useStore.setState(s=>({S:{...s.S,routines:[{id:'r',name:'Routine',ex:[{id:'0025'}]}],week:{[day]:['r']}}}))
  mount();click(tabs()[1]);act(()=>items()[0].onClick());expect(onStart).toHaveBeenCalledWith(['r'])
 })
 it('resumes an active session, including a saved workout edit, rather than overwriting it',()=>{
  useStore.setState(s=>({S:{...s.S,active:{id:'a',entries:[],cur:0}}}))
  mount();click(tabs()[1]);expect(items()[0].label).toBe('Resume');act(()=>items()[0].onClick())
  expect(mocks.nav).toHaveBeenLastCalledWith('/workout');expect(onStart).not.toHaveBeenCalled()
  act(()=>useStore.getState().update(s=>{s.active.editingWorkoutId='w'},false))
  click(tabs()[1]);expect(items()[0].label).toBe('Edit workout')
 })
 it('keeps the upstream connection warning accessible on Home',()=>{
  useStore.setState(s=>({S:{...s.S,connStatus:false},sync:{status:'error',lastError:{status:502},pending:true}}))
  mount();expect(tabs()[0].querySelector('.tab-dot')).toBeTruthy()
  expect(tabs()[0].getAttribute('aria-label')).toBe('Home, Connection problem')
 })
})
