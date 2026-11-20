// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const today = () => todayISO()
const mount = (enabled, extra = {}) => {
  useStore.setState(state => ({
    S: {
      ...state.S,
      routines: [{ id: 'r1', name: 'Push', ex: [{ id: '0025', sets: 3, reps: 8 }] }],
      workouts: [], bodyweight: [], active: null, dayPlan: {},
      week: { [new Date().getDay()]: ['r1'] },
      queue: null, rotation: null, scheduleMode: 'week', weekTarget: null,
      showWorkoutsLeftHome: enabled, ...extra,
    },
    user: null,
  }))
  act(() => root.render(<Home />))
}

describe('openGym v1.4.5 weekly countdown keeps IronLog Home unchanged until enabled', () => {
  it('leaves all original Home visuals untouched for existing profiles', () => {
    mount(undefined)
    expect(host.querySelector('[data-workouts-left-home]')).toBeNull()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-workout-hero')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
  })
  it('shows the right countdown without replacing the IronLog week, hero or streak', () => {
    mount(true)
    const countdown = host.querySelector('[data-workouts-left-home]')
    expect(countdown).toBeTruthy()
    expect(countdown.textContent).toContain('1 of 1 left this week')
    expect(host.querySelector('.home-training .week')).toBeTruthy()
    expect(host.querySelector('.home-workout-hero')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
  })
  it('shows the completed state when the logged routine covers today', () => {
    mount(true, { workouts: [{
      id: 'logged', d: today(), routineIds: ['r1'],
      entries: [{ id: '0025', sets: [{ w: 60, r: 8, done: true }] }],
    }] })
    expect(host.querySelector('[data-workouts-left-home]')?.textContent).toContain('All done this week')
  })
  it('shows nothing with no plan, explicit opt-out or rotation without a target', () => {
    mount(true, { week: {} })
    expect(host.querySelector('[data-workouts-left-home]')).toBeNull()
    mount(false)
    expect(host.querySelector('[data-workouts-left-home]')).toBeNull()
    mount(true, { scheduleMode: 'rotation', week: {}, weekTarget: null })
    expect(host.querySelector('[data-workouts-left-home]')).toBeNull()
  })
  it('uses the configured rotation target without changing stored workouts', () => {
    mount(true, { scheduleMode: 'rotation', week: {}, weekTarget: 4 })
    expect(host.querySelector('[data-workouts-left-home]')?.textContent).toContain('4 of 4 left this week')
    expect(useStore.getState().S.workouts).toEqual([])
  })
})
