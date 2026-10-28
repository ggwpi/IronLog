// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { waitForScreenReady, waitForWorkoutScreen } from './screen-ready.js'

let frames, fontsDescriptor
const paint = (count = 1) => {
  for (let i = 0; i < count; i++) {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach(fn => fn(0))
  }
}
const mount = () => {
  const screen = document.createElement('main')
  document.body.appendChild(screen)
  return screen
}
beforeEach(() => {
  vi.useFakeTimers()
  frames = new Map()
  let id = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(fn => { frames.set(++id, fn); return id })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => frames.delete(id))
  fontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts')
  Object.defineProperty(document, 'fonts', { configurable: true, value: { status: 'loaded' } })
})
afterEach(() => {
  document.body.innerHTML = ''
  if (fontsDescriptor) Object.defineProperty(document, 'fonts', fontsDescriptor)
  else delete document.fonts
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('waits for the destination to mount and settle rather than relying on elapsed animation time', async () => {
  let screen
  const ready = vi.fn()
  const waiting = waitForScreenReady(() => screen).then(ready)
  paint(30)
  expect(ready).not.toHaveBeenCalled()
  screen = mount()
  paint(2)
  await Promise.resolve()
  expect(ready).not.toHaveBeenCalled()
  paint()
  await waiting
  expect(ready).toHaveBeenCalledOnce()
  expect(frames.size).toBe(0)
})

it('keeps the cover while the visible image loads and decodes', async () => {
  const screen = mount()
  const image = document.createElement('img')
  image.src = '/exercise.gif'
  image.getBoundingClientRect = () => ({ width: 180, height: 180, top: 80, bottom: 260, left: 20, right: 200 })
  let loaded = false, decoded
  Object.defineProperties(image, { complete: { get: () => loaded }, naturalWidth: { get: () => 180 } })
  image.decode = vi.fn(() => new Promise(resolve => { decoded = resolve }))
  screen.appendChild(image)
  const ready = vi.fn()
  const waiting = waitForScreenReady(() => screen).then(ready)
  paint(8)
  expect(ready).not.toHaveBeenCalled()
  loaded = true
  paint()
  await vi.advanceTimersByTimeAsync(0)
  paint(4)
  expect(ready).not.toHaveBeenCalled()
  decoded()
  await vi.advanceTimersByTimeAsync(0)
  paint(3)
  await waiting
  expect(image.decode).toHaveBeenCalledOnce()
})

it('waits for fonts and entry animations, while ignoring repeating decorative animations', async () => {
  const screen = mount()
  const entry = { playState: 'running', effect: { getTiming: () => ({ iterations: 1 }) } }
  screen.getAnimations = () => [entry, { playState: 'running', effect: { getTiming: () => ({ iterations: Infinity }) } }]
  document.fonts.status = 'loading'
  const ready = vi.fn()
  const waiting = waitForScreenReady(() => screen).then(ready)
  paint(6)
  document.fonts.status = 'loaded'
  paint(6)
  await Promise.resolve()
  expect(ready).not.toHaveBeenCalled()
  entry.playState = 'finished'
  paint(3)
  await waiting
  expect(ready).toHaveBeenCalledOnce()
})

it('does not wait for lazy media below the viewport', async () => {
  const screen = mount()
  const image = document.createElement('img')
  image.getBoundingClientRect = () => ({ width: 180, height: 180, top: 10000, bottom: 10180, left: 20, right: 200 })
  Object.defineProperty(image, 'complete', { value: false })
  screen.appendChild(image)
  const waiting = waitForScreenReady(() => screen)
  paint(3)
  await waiting
  expect(frames.size).toBe(0)
})

it('waits for the first visible video frame rather than just its DOM element', async () => {
  const screen = mount()
  const video = document.createElement('video')
  video.getBoundingClientRect = () => ({ width: 180, height: 180, top: 80, bottom: 260, left: 20, right: 200 })
  let readyState = 0
  Object.defineProperty(video, 'readyState', { get: () => readyState })
  screen.appendChild(video)
  const ready = vi.fn()
  const waiting = waitForScreenReady(() => screen).then(ready)
  paint(6)
  readyState = 1 // metadata alone cannot paint a frame
  paint(6)
  await Promise.resolve()
  expect(ready).not.toHaveBeenCalled()
  readyState = 2
  paint(3)
  await waiting
  expect(ready).toHaveBeenCalledOnce()
})

it('releases a failed or missing destination without leaving a permanent cover', async () => {
  const waiting = waitForScreenReady(() => null)
  paint(5)
  await vi.advanceTimersByTimeAsync(8000)
  await waiting
  expect(frames.size).toBe(0)
})

it('waits for the actual session instead of accepting the old workout picker or a back preview', async () => {
  document.body.innerHTML = '<div id="app"><div class="page" data-path="/workout"></div><div class="page under" data-path="/workout"><div data-workout-id="session"></div></div></div>'
  const ready = vi.fn()
  const waiting = waitForWorkoutScreen('session').then(ready)
  paint(5)
  await Promise.resolve()
  expect(ready).not.toHaveBeenCalled()
  document.querySelector('.page:not(.under)').innerHTML = '<div data-workout-id="session"></div>'
  paint(3)
  await waiting
  expect(ready).toHaveBeenCalledOnce()
})
