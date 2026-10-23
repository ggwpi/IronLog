// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { lockPage, pageIsPinned, pinnedPageStyle } from './page-scroll-lock.js'
const setup = () => {
  const doc = document.implementation.createHTMLDocument('')
  const root=doc.createElement('div');root.id='root';doc.body.append(root)
  return {root,doc,win:{document:doc,scrollY:343}}
}
describe('page content scroll lock',()=>{
 it('leaves the body drawing surface unchanged and freezes only application content',()=>{
  const {root,doc,win}=setup();doc.body.style.background='black'
  const before=doc.body.style.cssText,lock=lockPage(win)
  expect(doc.body.style.cssText).toBe(before)
  expect(root.style.position).toBe('fixed');expect(root.style.top).toBe('-343px')
  expect(root.hasAttribute('inert')).toBe(true)
  expect(pageIsPinned(win)).toBe(true);expect(pinnedPageStyle(win)).toBe(root.style)
  root.style.top='-240px';expect(-parseFloat(lock.style.top)).toBe(240)
  lock.release();expect(pageIsPinned(win)).toBe(false);expect(root.hasAttribute('inert')).toBe(false)
  expect(doc.body.style.cssText).toBe(before)
 })
 it('captures the scroll position before fixing the root collapses the page scroll range',()=>{
  const {root,win}=setup()
  Object.defineProperty(win,'scrollY',{get:()=>root.style.position==='fixed'?0:343})
  const lock=lockPage(win);expect(lock.style.top).toBe('-343px');lock.release()
 })
 it('preserves pre-existing page styles and inert state on release',()=>{
  const {root,win}=setup();root.style.position='relative';root.style.width='90%';root.setAttribute('inert','')
  const lock=lockPage(win);lock.release();lock.release()
  expect(root.style.position).toBe('relative');expect(root.style.width).toBe('90%')
  expect(root.hasAttribute('inert')).toBe(true)
 })
 it('never makes a modal or toast portalled to body inert',()=>{
  const {doc,win}=setup();const modal=doc.createElement('div');doc.body.append(modal)
  const lock=lockPage(win);expect(modal.closest('[inert]')).toBeNull();lock.release()
 })
})
