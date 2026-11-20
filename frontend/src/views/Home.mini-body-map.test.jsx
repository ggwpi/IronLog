// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import { previewMuscleLoad } from '../components/MiniBodyMap.jsx'
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

const plan = [{ id: 'today-mini', name: 'Strength', ex: [
  { id: '0025', sets: 3, reps: 8, weight: 60 },
  { id: '0043', sets: 4, reps: 6, weight: 75 },
] }]
const mountWith = (setting, options = {}) => {
  useStore.setState(state => ({
    S: {
      ...state.S, workouts: [], bodyweight: [], active: null,
      routines: plan, week: { [new Date().getDay()]: ['today-mini'] }, dayPlan: {},
      body: 'male', showWorkoutMusclePreview: setting, ...options,
    },
    user: null,
  }))
  act(() => root.render(<Home />))
}

describe('openGym mini muscle map in the original IronLog Today row', () => {
  it('preserves the original Start tag and Home cards for an existing profile', () => {
    mountWith(undefined)
    expect(host.querySelector('[data-workout-muscle-preview]')).toBeNull()
    expect(host.querySelector('.home-workout-hero > .tag.home-workout-action')).toBeTruthy()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
  })
  it('adds a noninteractive decorative preview only after explicit opt-in', () => {
    mountWith(true)
    const preview = host.querySelector('[data-workout-muscle-preview]')
    expect(preview).toBeTruthy()
    expect(preview.getAttribute('aria-hidden')).toBe('true')
    expect(preview.querySelector('.bodymap')).toBeTruthy()
    expect(host.querySelector('.home-workout-hero .home-workout-action')).toBeTruthy()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
  })
  it('does not add a preview for the explicit off choice or a rest day', () => {
    mountWith(false)
    expect(host.querySelector('[data-workout-muscle-preview]')).toBeNull()
    mountWith(true, { week: {} })
    expect(host.querySelector('[data-workout-muscle-preview]')).toBeNull()
  })
  it('projects multiple routine exercises read-only and ignores invalid/empty entries', () => {
    const original = structuredClone(plan)
    const load = previewMuscleLoad([...plan, { id: 'empty', ex: [] }, null])
    expect(load.chest).toBeGreaterThan(0)
    expect(load.quadriceps).toBeGreaterThan(0)
    expect(plan).toEqual(original)
    expect(previewMuscleLoad([])).toEqual({})
  })
})
