// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { lightningTransition } from './lightning-transition.js'

let source, animations, cancel, originalAnimate
beforeEach(() => {
  source = document.createElement('button')
  source.getBoundingClientRect = () => ({ left: 20, top: 700, width: 48, height: 48 })
  document.body.appendChild(source)
  animations = []
  originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate')
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, writable: true, value: vi.fn(function (keyframes, options) {
    let finish, abort
    const finished = new Promise((resolve, reject) => { finish = resolve; abort = reject })
    const animation = { finished, finish, abort, cancel: vi.fn() }
    animations.push({ ...animation, target: this, keyframes, options })
    return animation
  }) })
})
afterEach(async () => {
  cancel?.()
  animations.forEach(a => a.finish())
  await Promise.resolve()
  document.body.innerHTML = ''
  if (originalAnimate) Object.defineProperty(Element.prototype, 'animate', originalAnimate)
  else delete Element.prototype.animate
  vi.restoreAllMocks()
})

it('covers from the button, performs the original action once, then reveals and removes the screen', async () => {
  const action = vi.fn()
  cancel = lightningTransition(source, action)
  expect(document.querySelector('.lightning-action')).not.toBeNull()
  expect(animations[0].keyframes[0].transform).toContain('translate(44px,724px)')
  expect(action).not.toHaveBeenCalled()
  lightningTransition(source, action) // repeated presses must not start another session/effect
  expect(animations).toHaveLength(1)

  animations[0].finish()
  await Promise.resolve()
  expect(action).toHaveBeenCalledOnce()
  expect(animations).toHaveLength(2)
  cancel() // the destination can unmount the dock while its reveal still finishes
  expect(document.querySelector('.lightning-action')).not.toBeNull()
  animations[1].finish()
  await Promise.resolve()
  expect(document.querySelector('.lightning-action')).toBeNull()
  expect(action).toHaveBeenCalledOnce()
})

it('cancels a pending action on unmount, including after a repeated press', async () => {
  const action = vi.fn()
  lightningTransition(source, action)
  cancel = lightningTransition(source, action)
  cancel()
  animations[0].finish()
  await Promise.resolve()
  expect(action).not.toHaveBeenCalled()
  expect(document.querySelector('.lightning-action')).toBeNull()
})

it('holds the full cover until the destination reports ready, then fades once', async () => {
  let ready
  const loading = new Promise(resolve => { ready = resolve })
  const action = vi.fn(() => loading)
  cancel = lightningTransition(source, action)
  animations[0].finish()
  await Promise.resolve()
  expect(action).toHaveBeenCalledOnce()
  expect(document.querySelector('.lightning-action.waiting')).not.toBeNull()
  expect(animations).toHaveLength(1)
  cancel() // navigation has already committed: unmount must not expose an unfinished screen
  ready()
  await Promise.resolve()
  expect(animations).toHaveLength(2)
  animations[1].finish()
  await Promise.resolve()
  expect(document.querySelector('.lightning-action')).toBeNull()
})

it('removes the cover if destination preparation fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  cancel = lightningTransition(source, () => Promise.reject(new Error('failed destination')))
  animations[0].finish()
  await vi.waitFor(() => expect(document.querySelector('.lightning-action')).toBeNull())
})

it('zooms out through the white logo when it has become visible during loading', async () => {
  let ready
  cancel = lightningTransition(source, () => new Promise(resolve => { ready = resolve }))
  animations[0].finish()
  await Promise.resolve()
  const hold = document.querySelector('.lightning-hold')
  hold.getBoundingClientRect = () => ({ left: 180, top: 360, width: 36, height: 56 })
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({ opacity: '.8' })
  ready()
  await Promise.resolve()

  const hole = document.querySelector('clipPath path[clip-rule="evenodd"]')
  expect(hole).not.toBeNull()
  expect(animations[1].target).toBe(hole)
  expect(animations[1].keyframes[0].transform).toContain('translate(198px,388px) scale(0.15)')
  expect(document.querySelector('.lightning-iris path')).not.toBeNull()
  expect(animations).toHaveLength(4) // entrance, expanding hole, white geometry, white ink fade
  expect(animations.some(a => a.target.classList?.contains('lightning-action'))).toBe(false)

  animations[1].finish()
  await Promise.resolve()
  expect(document.querySelector('.lightning-action')).toBeNull()
  expect(animations.every(a => a.cancel.mock.calls.length === 1)).toBe(true)
})

it('keeps the normal fade if readiness arrives before the white logo is visible', async () => {
  let ready
  cancel = lightningTransition(source, () => new Promise(resolve => { ready = resolve }))
  animations[0].finish()
  await Promise.resolve()
  const hold = document.querySelector('.lightning-hold')
  hold.getBoundingClientRect = () => ({ left: 180, top: 360, width: 36, height: 56 })
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({ opacity: '0' })
  ready()
  await Promise.resolve()
  expect(document.querySelector('.lightning-iris')).toBeNull()
  expect(animations).toHaveLength(2)
  expect(animations[1].target.classList.contains('lightning-action')).toBe(true)
  animations[1].finish()
  await Promise.resolve()
})

it('keeps the action working if the browser interrupts the covering animation', async () => {
  const action = vi.fn()
  cancel = lightningTransition(source, action)
  animations[0].abort()
  await Promise.resolve()
  expect(action).toHaveBeenCalledOnce()
  expect(document.querySelector('.lightning-action')).toBeNull()
})

it('does not leave an invisible input blocker when the reveal is cancelled', async () => {
  cancel = lightningTransition(source, () => {})
  animations[0].finish()
  await Promise.resolve()
  animations[1].abort()
  await Promise.resolve()
  expect(document.querySelector('.lightning-action')).toBeNull()
})

it('runs immediately without an overlay for reduced motion', () => {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
  const action = vi.fn()
  cancel = lightningTransition(source, action)
  expect(action).toHaveBeenCalledOnce()
  expect(animations).toHaveLength(0)
  expect(document.querySelector('.lightning-action')).toBeNull()
})

it('falls back to the original action when animation is unavailable', () => {
  const action = vi.fn()
  source.animate = undefined
  cancel = lightningTransition(source, action)
  expect(action).toHaveBeenCalledOnce()
  expect(document.querySelector('.lightning-action')).toBeNull()
})

it('cleans up and keeps the control working if animation creation fails', () => {
  Element.prototype.animate.mockImplementation(() => { throw new Error('Animation unavailable') })
  const action = vi.fn()
  cancel = lightningTransition(source, action)
  expect(action).toHaveBeenCalledOnce()
  expect(document.querySelector('.lightning-action')).toBeNull()
})
