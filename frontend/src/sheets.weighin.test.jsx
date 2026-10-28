// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { bwSheet, startFlow } from './sheets.jsx'
import Modals from './components/Modals.jsx'
import { setNav } from './lib/nav.js'

vi.mock('./lib/lightning-transition.js', () => ({ lightningTransition: (_source, action) => { action(); return () => {} } }))
vi.mock('./lib/screen-ready.js', () => ({ waitForWorkoutScreen: () => Promise.resolve() }))

// Start opens the quick weigh-in unless Settings → During a workout → "Weigh in before
// workouts" is off (issue #137) — then the session begins at once, with no body weight on it.

describe('the weigh-in before a workout is a setting', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    useUI.setState({ sheets: [], toasts: [] })
    useStore.setState(s => ({ S: { ...s.S, active: null, routines: [], workouts: [], bodyweight: [], weighIn: true } }))
  })

  it('on (the default): Start opens the weigh-in and the session waits for it', () => {
    act(() => startFlow([]))
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(useUI.getState().sheets[0].locked).toBe(true)   // the required weigh-in, not a plain sheet
    expect(useUI.getState().sheets[0].kind).toBe('screen')
    expect(useStore.getState().S.active).toBeNull()
  })

  it('a profile written before the setting existed still asks', () => {
    useStore.setState(s => { const S = { ...s.S }; delete S.weighIn; return { S } })
    act(() => startFlow([]))
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(useUI.getState().sheets[0].locked).toBe(true)
    expect(useStore.getState().S.active).toBeNull()
  })

  it('off: Start begins the session at once, with no sheet and no body weight', () => {
    useStore.setState(s => ({ S: { ...s.S, weighIn: false } }))
    act(() => startFlow([]))
    expect(useUI.getState().sheets).toHaveLength(0)
    const { active } = useStore.getState().S
    expect(active).not.toBeNull()
    expect(active.bw).toBeNull()
    expect(active.routineIds).toEqual([])
  })
})

describe('the full-screen pre-workout weigh-in keeps the original actions', () => {
  let root, host, navigate
  const button = text => [...host.ownerDocument.querySelectorAll('#modal-root button')].find(el => (el.getAttribute('aria-label') || el.textContent).trim() === text)
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    navigate = vi.fn()
    setNav(navigate)
    useUI.setState({ sheets: [], toasts: [] })
    useStore.setState(s => ({ S: { ...s.S, active: null, routines: [], workouts: [], bodyweight: [], weighIn: true, unit: 'kg' } }))
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    act(() => { root.render(<Modals />); startFlow([]) })
  })
  afterEach(() => {
    act(() => { root.unmount(); useUI.setState({ sheets: [] }) })
    host.remove()
    setNav(() => {})
  })

  it('fills a screen without a backdrop or grab handle, and Cancel creates no session or weigh-in', () => {
    expect(document.querySelector('.screen-sheet [role="dialog"]')).not.toBeNull()
    expect(document.querySelector('#modal-root .mback, #modal-root .grab')).toBeNull()
    const before = useStore.getState().S
    act(() => button('Cancel').click())
    expect(useUI.getState().sheets).toEqual([])
    expect(useStore.getState().S).toBe(before)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('saves the entered weight and starts the same session', () => {
    const input = document.querySelector('.bw-read input')
    act(() => {
      Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set.call(input, '82.5')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => button('Save & start workout').click())
    const { active, bodyweight } = useStore.getState().S
    expect(active.bw).toBe(82.5)
    expect(active.routineIds).toEqual([])
    expect(bodyweight).toHaveLength(1)
    expect(bodyweight[0].w).toBe(82.5)
    expect(useUI.getState().sheets).toEqual([])
    expect(navigate.mock.calls.at(-1)[0]).toBe('/workout')
  })

  it('starts without saving weight when the user skips weighing', () => {
    act(() => button('Start without weighing in').click())
    expect(useStore.getState().S.active.bw).toBeNull()
    expect(useStore.getState().S.bodyweight).toEqual([])
    expect(useUI.getState().sheets).toEqual([])
  })

  it('still opens the routine picker without starting a session', () => {
    act(() => button('Choose a different workout').click())
    expect(useStore.getState().S.active).toBeNull()
    expect(navigate.mock.calls.at(-1)[0]).toBe('/workout')
  })

  it('keeps ordinary body-weight logging in a sheet', () => {
    act(() => button('Cancel').click())
    act(() => bwSheet())
    expect(useUI.getState().sheets.at(-1).kind).toBe('sheet')
    expect(document.querySelector('.screen-sheet')).toBeNull()
  })
})
