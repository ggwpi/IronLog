// @vitest-environment happy-dom
// The tab bar is fixed on screen and re-renders on every store write — once a second for the
// whole of a rest. Its buttons must survive that: a component declared inside the render body is
// a new function each time, which React reads as a different type and rebuilds from scratch.
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TabBar from './TabBar.jsx'
import { DEF, useStore } from '../store/useStore.js'
import { AnimateUIProvider } from '@animate-ui/react/provider'

const router = vi.hoisted(() => ({ pathname: '/home', navigate: vi.fn() }))
const transition = vi.hoisted(() => ({ pending: null, cancel: vi.fn() }))
vi.mock('../lib/lightning-transition.js', () => ({
  lightningTransition: (_source, action) => { transition.pending = action; return transition.cancel },
}))
vi.mock('../lib/screen-ready.js', () => ({ waitForScreenReady: vi.fn(), waitForWorkoutScreen: vi.fn() }))
vi.mock('react-router-dom', () => ({
  useNavigate: () => router.navigate,
  useLocation: () => ({ pathname: router.pathname }),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let host, root, originalS, originalUser

beforeEach(() => {
  router.pathname = '/home'
  router.navigate.mockClear()
  transition.pending = null
  transition.cancel.mockClear()
  const store = useStore.getState()
  originalS = store.S
  originalUser = store.user
  useStore.setState({ S: JSON.parse(JSON.stringify(DEF)), user: { id: 1, name: 'test' } })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  useStore.setState({ S: originalS, user: originalUser })
})

const tabs = () => [...host.querySelectorAll('#tabbar button')]
const start = () => host.querySelector('#tabbar .start')

describe('the tab bar across a store write', () => {
  it('keeps the very same buttons instead of rebuilding them every tick', () => {
    act(() => { root.render(<TabBar onStart={() => {}} />) })
    const before = tabs()
    expect(before).toHaveLength(5)

    // What a rest does once a second: S is replaced, so everything reading it re-renders.
    act(() => { useStore.getState().update(s => { s.restSec = 91 }, false) })

    const after = tabs()
    expect(after).toHaveLength(before.length)
    after.forEach((el, i) => expect(el).toBe(before[i]))
  })

  it('still lights the tab for the route it is on, and follows a change of state', () => {
    act(() => { root.render(<TabBar onStart={() => {}} />) })
    expect(tabs()[0].className).toBe('on')
    expect(tabs()[1].className).toBe('')
    expect(start().className).toBe('start')

    act(() => { useStore.getState().update(s => { s.active = { id: 'a', entries: [], cur: 0 } }, false) })
    expect(start().className).toBe('start rec')
    expect(tabs()[0].className).toBe('on')
  })
})

// Settings → "Show connection status" off (#369, #330): a stuck sync shows as a dot on Home, the
// tab Settings opens from, and the tab's name says it.
describe('the connection dot on Home', () => {
  const home = () => tabs()[0]
  it('is there for a sync problem only while the banner is switched off', () => {
    const original = useStore.getState().sync
    try {
      useStore.setState({ sync: { status: 'error', lastError: { status: 502 }, pending: true } })
      act(() => { root.render(<TabBar onStart={() => {}} />) })
      expect(home().querySelector('.tab-dot')).toBeNull()
      act(() => { useStore.getState().update(s => { s.connStatus = false }, false) })
      expect(home().querySelector('.tab-dot')).not.toBeNull()
      expect(home().getAttribute('aria-label')).toBe('Home, Connection problem')
      act(() => { useStore.setState({ sync: { status: 'ok', lastError: null, pending: false } }) })
      expect(home().querySelector('.tab-dot')).toBeNull()
      expect(home().getAttribute('aria-label')).toBe('Home')
    } finally { useStore.setState({ sync: original }) }
  })
})

// Start is a separate lightning action; its accessible name and session clock remain intact.
describe('the tab icons and labels', () => {
  const icon = el => el.querySelector('svg')?.getAttribute('data-icon')
  const label = el => el.querySelector('span:last-child').textContent
  it('labels every tab and uses one icon per concept', () => {
    act(() => { root.render(<TabBar onStart={() => {}} />) })
    expect(tabs().map(icon)).toEqual(['house', 'calendar', 'chart', 'dumbbell', 'bolt'])
    expect(tabs().map(label)).toEqual(['Home', 'Plan', 'Stats', 'Exercises', 'Start'])

    act(() => { useStore.getState().update(s => { s.active = { id: 'a', entries: [], cur: 0 } }, false) })
    expect(icon(start())).toBe('bolt')
    expect(label(start())).toBe('Resume')
  })

  it('shows a minimized session’s running time, still named Resume', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2026, 9, 5, 18, 0, 0))
      act(() => { useStore.getState().update(s => { s.active = { id: 'a', entries: [], cur: 0, start: Date.now() - 754_000 } }, false) })
      act(() => { root.render(<TabBar onStart={() => {}} />) })
      const action = start()
      expect(label(action)).toBe('12:34')
      expect(action.getAttribute('aria-label')).toBe('Resume')
      act(() => { vi.advanceTimersByTime(2000) })
      expect(label(action)).toBe('12:36')
      expect(start()).toBe(action)   // the same button, only its text ticks
      act(() => action.click())
      expect(router.navigate).not.toHaveBeenCalled()
      act(() => transition.pending()) // the screen-covering effect commits the same action
      expect(router.navigate).toHaveBeenLastCalledWith('/workout')

      // a past workout being edited has no clock running
      act(() => { useStore.getState().update(s => { s.active.editingWorkoutId = 'w1' }, false) })
      expect(label(start())).toBe('Edit workout')
    } finally { vi.useRealTimers() }
  })
})

describe('navigation destinations', () => {
  it('passes today’s same planned routines to the existing Start flow after coverage', () => {
    const onStart = vi.fn()
    act(() => useStore.getState().update(s => {
      s.routines = [{ id: 'a', ex: [{ id: 'squat' }] }, { id: 'b', ex: [{ id: 'row' }] }]
      s.week[new Date().getDay()] = ['a', 'b']
    }, false))
    const state = useStore.getState().S
    act(() => root.render(<TabBar onStart={onStart} />))
    act(() => start().click())
    expect(onStart).not.toHaveBeenCalled()
    act(() => transition.pending())
    expect(onStart).toHaveBeenCalledExactlyOnceWith(['a', 'b'])
    expect(router.navigate).not.toHaveBeenCalled()
    expect(useStore.getState().S).toBe(state)
  })

  it('uses current session state when the wipe finishes, without starting a second workout', () => {
    const onStart = vi.fn()
    act(() => root.render(<TabBar onStart={onStart} />))
    act(() => start().click())
    // A session arriving from the watch/sync while the screen is covering wins.
    act(() => useStore.getState().update(s => { s.active = { id: 'watch', entries: [], cur: 0 } }, false))
    act(() => transition.pending())
    expect(onStart).not.toHaveBeenCalled()
    expect(router.navigate).toHaveBeenLastCalledWith('/workout')
  })

  it('keeps the four routes and moves the highlight with the current page', () => {
    const destinations = ['/home', '/plan', '/stats', '/library']
    destinations.forEach((pathname, index) => {
      router.pathname = pathname
      act(() => root.render(<TabBar onStart={() => {}} />))
      const items = [...host.querySelectorAll('.navigation-track button')]
      act(() => items[index].click())
      expect(router.navigate).toHaveBeenLastCalledWith(pathname)
      expect(items.filter(b => b.getAttribute('aria-current') === 'page')).toEqual([items[index]])
      expect(items[index].getAttribute('data-state')).toBe('active')
      expect(start().closest('.navigation-track')).toBeNull()
    })
  })

  it('minimizes on downward scroll and expands on upward scroll or a tab press, keeping the names', () => {
    let scrollTop = 0
    // happy-dom's global Window differs from this window's constructor; the primitive
    // uses instanceof Window to distinguish window scrolling from an element.
    vi.stubGlobal('Window', window.constructor)
    const scrollY = vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollTop)
    try {
      act(() => root.render(<AnimateUIProvider reducedMotion="always"><TabBar onStart={() => {}} /></AnimateUIProvider>))
      const dock = host.querySelector('#tabbar')
      const labels = () => [...host.querySelectorAll('[data-slot="bottom-navigation-label"]')]
      const scrollTo = top => act(() => { scrollTop = top; window.dispatchEvent(new Event('scroll')) })

      scrollTo(120)
      expect(dock.hasAttribute('data-minimized')).toBe(true)
      expect(labels().every(el => el.hasAttribute('data-folded'))).toBe(true)
      expect(tabs()[0].getAttribute('aria-label')).toBe('Home')
      expect(start().querySelector('[data-icon="bolt"]')).toBeTruthy()

      scrollTo(100)
      expect(dock.hasAttribute('data-minimized')).toBe(false)
      expect(labels().every(el => !el.hasAttribute('data-folded'))).toBe(true)

      scrollTo(200)
      act(() => tabs()[0].click())
      expect(dock.hasAttribute('data-minimized')).toBe(false)
      expect(router.navigate).toHaveBeenLastCalledWith('/home')
    } finally { scrollY.mockRestore(); vi.unstubAllGlobals() }
  })
})
