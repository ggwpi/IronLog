// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { modalViewport, startModalViewport } from './modal-viewport.js'
const phone = (installed = true) => Object.assign(new EventTarget(), {
  innerWidth:390, innerHeight:810,
  navigator:{standalone:installed,userAgent:'iPhone'},
  screen:{width:390,height:844,orientation:{type:'portrait-primary'}},
  visualViewport:Object.assign(new EventTarget(),{height:810,offsetTop:0}),
  document:new EventTarget(),
  requestAnimationFrame:cb=>setTimeout(cb,16),cancelAnimationFrame:clearTimeout,setTimeout,clearTimeout,
})
let stop
// No dependence on a mounted navigation bar, a particular sheet or a route change.
afterEach(()=>{stop?.();vi.useRealTimers()})
describe('shared modal viewport',()=>{
 it('fills installed iPhone bounds even with both viewport heights stale',()=>{
  expect(modalViewport(phone())).toEqual({height:844,bottom:0,available:844,top:0})
 })
 it('keeps ordinary tabs inside their layout viewport',()=>{
  expect(modalViewport(phone(false))).toEqual({height:810,bottom:0,available:810,top:0})
 })
 it('does not mistake the initial 34px inset for a keyboard',()=>{
  expect(modalViewport(phone()).bottom).toBe(0)
 })
 it('moves all sheets above the keyboard and centres dialogs in its visible area',()=>{
  const win=phone();Object.assign(win.visualViewport,{height:450,offsetTop:40})
  expect(modalViewport(win)).toEqual({height:844,bottom:354,available:450,top:40})
 })
 it('handles resized non-iOS keyboards without subtracting their height twice',()=>{
  const win=phone(false);win.innerHeight=450;win.visualViewport.height=450
  expect(modalViewport(win)).toEqual({height:450,bottom:0,available:450,top:0})
 })
 it('uses iPad split window dimensions instead of the physical display',()=>{
  const win=phone();win.innerWidth=500;win.innerHeight=700;win.visualViewport.height=700
  win.screen={width:1024,height:1366}
  expect(modalViewport(win).height).toBe(700)
 })
 it('updates immediately, through keyboard dismissal and on rotation while open',()=>{
  vi.useFakeTimers();const win=phone(),el=document.createElement('div')
  stop=startModalViewport(el,win)
  expect(el.style.getPropertyValue('--modal-height')).toBe('844px')
  win.visualViewport.height=450;win.visualViewport.dispatchEvent(new Event('resize'));vi.advanceTimersByTime(16)
  expect(el.style.getPropertyValue('--modal-keyboard-bottom')).toBe('394px')
  win.visualViewport.height=810;win.visualViewport.dispatchEvent(new Event('resize'));vi.advanceTimersByTime(16)
  expect(el.style.getPropertyValue('--modal-keyboard-bottom')).toBe('0px')
  win.innerWidth=844;win.innerHeight=356;win.visualViewport.height=356;win.screen.orientation.type='landscape-primary'
  win.dispatchEvent(new Event('orientationchange'));vi.advanceTimersByTime(16)
  expect(el.style.getPropertyValue('--modal-height')).toBe('390px')
 })
 it('catches late viewport settling and removes listeners and pending frames on close',()=>{
  vi.useFakeTimers();const win=phone(false),el=document.createElement('div')
  stop=startModalViewport(el,win);vi.advanceTimersByTime(20)
  win.innerHeight=844;vi.advanceTimersByTime(260)
  expect(el.style.getPropertyValue('--modal-height')).toBe('844px')
  stop();win.innerHeight=900;win.dispatchEvent(new Event('resize'));vi.advanceTimersByTime(2000)
  expect(el.style.getPropertyValue('--modal-height')).toBe('')
 })
})
