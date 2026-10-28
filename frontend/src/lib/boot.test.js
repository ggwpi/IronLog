// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'
import { hideBoot } from './boot.js'

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

it('dismisses once and releases animation resources before removing the overlay', () => {
  vi.useFakeTimers()
  document.body.innerHTML = '<div id="boot"></div>'
  const boot = document.getElementById('boot')
  const cleanup = vi.fn(() => expect(boot.isConnected).toBe(true))
  boot.addEventListener('ironlog:boot-remove', cleanup)
  hideBoot()
  hideBoot()
  expect(boot.classList.contains('out')).toBe(true)
  vi.advanceTimersByTime(259)
  expect(cleanup).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(cleanup).toHaveBeenCalledOnce()
  expect(document.getElementById('boot')).toBeNull()
  expect(() => hideBoot()).not.toThrow()
})

function introAt(currentTime) {
  vi.useFakeTimers()
  document.body.innerHTML = '<div id="boot"><div class="boot-stage"></div></div>'
  const boot = document.getElementById('boot')
  const stage = boot.querySelector('.boot-stage')
  stage.getAnimations = vi.fn(() => [{ animationName: 'boot-arrive', currentTime, effect: { getTiming: () => ({ duration: 820 }) } }])
  return { boot, stage }
}

it('lets an early-ready app finish the visible intro, contract, and reveal exactly once', () => {
  const { boot } = introAt(200)
  const cleanup = vi.fn()
  boot.addEventListener('ironlog:boot-remove', cleanup)
  hideBoot()
  hideBoot()
  expect(boot.classList.contains('finishing')).toBe(false)
  vi.advanceTimersByTime(619)
  expect(boot.classList.contains('finishing')).toBe(false)
  vi.advanceTimersByTime(1)
  expect(boot.classList.contains('finishing')).toBe(true)
  hideBoot()
  vi.advanceTimersByTime(219)
  expect(boot.classList.contains('out')).toBe(false)
  vi.advanceTimersByTime(1)
  expect(boot.classList.contains('out')).toBe(true)
  hideBoot()
  vi.advanceTimersByTime(649)
  expect(boot.isConnected).toBe(true)
  vi.advanceTimersByTime(1)
  expect(boot.isConnected).toBe(false)
  expect(cleanup).toHaveBeenCalledOnce()
})

it('starts the reveal immediately when loading has already outlasted the intro', () => {
  const { boot } = introAt(3000)
  hideBoot()
  expect(boot.classList.contains('finishing')).toBe(true)
  vi.advanceTimersByTime(220)
  expect(boot.classList.contains('out')).toBe(true)
  vi.advanceTimersByTime(650)
  expect(boot.isConnected).toBe(false)
})

it('skips the contraction and screen-sized wipe for reduced motion', () => {
  const { boot, stage } = introAt(0)
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
  hideBoot()
  expect(stage.getAnimations).not.toHaveBeenCalled()
  expect(boot.classList.contains('finishing')).toBe(false)
  expect(boot.classList.contains('out')).toBe(true)
  vi.advanceTimersByTime(260)
  expect(boot.isConnected).toBe(false)
})

it('still dismisses on browsers without animation timing APIs', () => {
  const { boot, stage } = introAt(0)
  stage.getAnimations = undefined
  hideBoot()
  vi.runAllTimers()
  expect(boot.isConnected).toBe(false)
})
