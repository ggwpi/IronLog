// @vitest-environment happy-dom
import React, { act } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import { todayISO } from '../lib/format.js'
import Home from './Home.jsx'

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../sheets.jsx', () => ({
  starterPlanSheet: vi.fn(), bwSheet: vi.fn(), goalSheet: vi.fn(), dayOverrideSheet: vi.fn(),
  calendarSheet: vi.fn(), startFlow: vi.fn(), bwDeltaColor: () => '', weighInsSheet: vi.fn(),
}))

let host, root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })

const mountWith = showWeeklySetsHome => {
  useStore.setState(state => ({
    S: {
      ...state.S, routines: [], bodyweight: [], active: null, week: {}, dayPlan: {},
      workouts: [{ id: 'weekly-test', d: todayISO(), start: Date.now(),
        entries: [{ id: '0025', sets: [{ w: 60, r: 8, done: true }] }] }],
      showWeeklySetsHome,
    },
    user: null,
  }))
  act(() => root.render(<Home />))
}

describe('openGym weekly target Home summary uses IronLog appearance and opt-in', () => {
  it('never adds a Home card for existing users without an opt-in setting', () => {
    mountWith(undefined)
    expect(host.querySelector('[data-weekly-targets-home]')).toBeNull()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
  })
  it('adds an IronLog-styled card without replacing the greeting or other cards', () => {
    mountWith(true)
    const card = host.querySelector('[data-weekly-targets-home]')
    expect(card).toBeTruthy()
    expect(card.classList.contains('card')).toBe(true)
    expect(card.classList.contains('tappable')).toBe(true)
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
  })
  it('respects the explicit off choice', () => {
    mountWith(false)
    expect(host.querySelector('[data-weekly-targets-home]')).toBeNull()
  })
})
