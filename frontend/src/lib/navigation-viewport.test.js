// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startNavigationViewport } from './navigation-viewport.js'
let stop
const setup = (standalone = false) => {
  const viewport = Object.assign(new EventTarget(), {height:800,offsetTop:0})
  const win = Object.assign(new EventTarget(), {innerHeight:844, visualViewport:viewport,
    navigator:{standalone},document:Object.assign(new EventTarget(),{activeElement:{tagName:'BODY'}}),
    requestAnimationFrame:cb=>setTimeout(cb,16),cancelAnimationFrame:clearTimeout,
    setTimeout,clearTimeout})
  const el=document.createElement('nav');stop=startNavigationViewport(el,win)
  const bottom=()=>el.style.getPropertyValue('--navigation-viewport-bottom')
  return {viewport,win,bottom}
}
afterEach(()=>{stop?.();vi.useRealTimers()})
describe('compact navigation viewport anchoring',()=>{
 it('measures immediately and corrects a first-load viewport resize without navigation',()=>{
  vi.useFakeTimers();const {viewport,bottom}=setup()
  expect(bottom()).toBe('800px')
  viewport.height=844;viewport.dispatchEvent(new Event('resize'));vi.advanceTimersByTime(16)
  expect(bottom()).toBe('844px')
 })
 it('uses the full installed-app viewport when Safari initially reports a stale visual height',()=>{
  const {bottom}=setup(true);expect(bottom()).toBe('844px')
 })
 it('remeasures a late cold-launch correction even when no resize event was emitted',()=>{
  vi.useFakeTimers();const {viewport,bottom}=setup()
  vi.advanceTimersByTime(20);viewport.height=844;vi.advanceTimersByTime(260)
  expect(bottom()).toBe('844px')
 })
 it('does not lift the dock above the keyboard while editing',()=>{
  vi.useFakeTimers();const {viewport,win,bottom}=setup()
  win.document.activeElement={tagName:'INPUT'};viewport.height=400
  viewport.dispatchEvent(new Event('resize'));vi.advanceTimersByTime(16)
  expect(bottom()).toBe('800px')
  win.document.activeElement={tagName:'BODY'};viewport.height=844
  win.document.dispatchEvent(new Event('focusout'));vi.advanceTimersByTime(16)
  expect(bottom()).toBe('844px')
 })
 it('removes measurements, listeners and pending startup work on unmount',()=>{
  vi.useFakeTimers();const {viewport,bottom}=setup()
  stop();expect(bottom()).toBe('');viewport.height=900
  viewport.dispatchEvent(new Event('resize'));vi.advanceTimersByTime(2000)
  expect(bottom()).toBe('')
 })
})
