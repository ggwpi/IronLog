import { describe, expect, it, vi } from 'vitest'
import { openModalLayer } from './modal-layer.js'
describe('modal top layer',()=>{
 it('enters the native modal layer and releases it on unmount',()=>{
  const d={open:false,showModal:vi.fn(function(){this.open=true}),close:vi.fn(function(){this.open=false})}
  const stop=openModalLayer(d);expect(d.showModal).toHaveBeenCalledOnce()
  stop();expect(d.close).toHaveBeenCalledOnce();expect(d.open).toBe(false)
 })
 it('can mount again after StrictMode cleanup without leaving a stale native dialog',()=>{
  const d={open:false,showModal(){this.open=true},close(){this.open=false}}
  openModalLayer(d)();const stop=openModalLayer(d);expect(d.open).toBe(true);stop();expect(d.open).toBe(false)
 })
 it('blurs a field behind the modal before the browser captures its focus-return target',()=>{
  const a={tagName:'INPUT',blur:vi.fn()},d={ownerDocument:{activeElement:a},contains:()=>false,showModal:vi.fn(),open:false}
  openModalLayer(d);expect(a.blur).toHaveBeenCalledOnce()
  expect(a.blur.mock.invocationCallOrder[0]).toBeLessThan(d.showModal.mock.invocationCallOrder[0])
 })
 it('leaves a field inside the modal focused',()=>{
  const a={tagName:'TEXTAREA',blur:vi.fn()},d={ownerDocument:{activeElement:a},contains:()=>true,showModal:vi.fn(),open:false}
  openModalLayer(d);expect(a.blur).not.toHaveBeenCalled()
 })
 it('retains the positioned overlay when native dialogs are unsupported',()=>{
  const d={setAttribute:vi.fn(),removeAttribute:vi.fn()};const stop=openModalLayer(d)
  expect(d.setAttribute).toHaveBeenCalledWith('open','');stop();expect(d.removeAttribute).toHaveBeenCalledWith('open')
 })
})
