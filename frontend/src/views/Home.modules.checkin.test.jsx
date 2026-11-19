// @vitest-environment happy-dom
import React, { act } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
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

const mount = extra => {
  useStore.setState(s => ({
    S: { ...s.S, routines: [], workouts: [], bodyweight: [], active: null, dayPlan: {}, week: {}, checkIn: true, modules: undefined, ...extra },
    user: null,
  }))
  act(() => root.render(<Home />))
}

describe('openGym Modules reads original IronLog Home check-in card without re-skinning', () => {
  it('keeps the old Home check-in, greeting and existing cards for legacy profiles', () => {
    mount({})
    expect(host.querySelector('.home-checkin')).toBeTruthy()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-checkin .lbl2')?.textContent).toBe('At the gym')
  })
  it('retains the older checkIn opt-out when a profile has no Modules preference', () => {
    mount({ checkIn: false })
    expect(host.querySelector('.home-checkin')).toBeNull()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
  })
  it('honors the original openGym explicit per-module choice without mutating user data', () => {
    mount({ checkIn: true, modules: { checkin: false } })
    expect(host.querySelector('.home-checkin')).toBeNull()
    expect(useStore.getState().S.modules).toEqual({ checkin: false })
    mount({ checkIn: false, modules: { checkin: true } })
    expect(host.querySelector('.home-checkin')).toBeTruthy()
    expect(useStore.getState().S.checkIn).toBe(false)
  })
})
