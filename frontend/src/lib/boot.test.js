// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'
import { hideBoot } from './boot.js'

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers() })

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
