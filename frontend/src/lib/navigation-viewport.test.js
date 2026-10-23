// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startNavigationViewport, navigationBottom } from './navigation-viewport.js'
let stop
const setup = (standalone = false) => {
  const viewport = Object.assign(new EventTarget(), {height:800,offsetTop:0})
  const win = Object.assign(new EventTarget(), {innerHeight:844, visualViewport:viewport,
    navigator:{standalone},document:Object.assign(new EventTarget(),{activeElement:{tagName:'BODY'},documentElement:document.createElement('html')}),
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
  const {bottom,win}=setup(true);expect(bottom()).toBe('844px')
  expect(win.document.documentElement.style.getPropertyValue('--navigation-installed-height')).toBe('844px')
  stop();expect(win.document.documentElement.style.getPropertyValue('--navigation-installed-height')).toBe('')
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


describe('installed-app cold launch with both browser heights stale',()=>{
 const phone = () => ({innerWidth:390,innerHeight:810,visualViewport:{height:810,offsetTop:0},navigator:{standalone:true,userAgent:'iPhone'},screen:{width:390,height:844,orientation:{type:'portrait-primary'}}})
 it('anchors to the full screen immediately even if both heights stay short and no event fires',()=>{
  expect(navigationBottom(phone())).toBe(844)
 })
 it('does not use screen bounds in a desktop installed window',()=>{
  const win=phone();win.navigator.userAgent='Mozilla/5.0 Desktop';expect(navigationBottom(win)).toBe(810)
 })
 it('does not include Safari browser chrome in a normal tab',()=>{
  const win=phone();win.navigator.standalone=false
  expect(navigationBottom(win)).toBe(810)
 })
 it('does not use the physical screen bounds for an iPad split-screen window',()=>{
  const win=phone();win.innerWidth=500;win.innerHeight=700;win.visualViewport.height=700;win.screen={width:1024,height:1366}
  expect(navigationBottom(win)).toBe(700)
 })
 it('handles landscape screen APIs that retain portrait dimensions',()=>{
  const win=phone();win.innerWidth=844;win.innerHeight=356;win.visualViewport.height=356;win.screen.orientation.type='landscape-primary'
  expect(navigationBottom(win)).toBe(390)
 })
 it('ignores portrait heights left behind during a full-screen landscape rotation',()=>{
  const win=phone();win.innerWidth=844;win.screen.orientation.type='landscape-primary'
  expect(navigationBottom(win)).toBe(390)
 })
 it('handles the legacy iPhone orientation API',()=>{
  const win=phone();win.innerWidth=844;win.innerHeight=356;win.visualViewport.height=356;win.screen.orientation=undefined;win.orientation=90
  expect(navigationBottom(win)).toBe(390)
 })
})
