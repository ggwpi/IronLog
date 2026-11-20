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

describe('openGym Body and Motivation visibility through native IronLog Home cards', () => {
  const logged = { id: 'preserved-workout', d: '2026-11-18', entries: [{ id: '0025', sets: [{ w: 50, r: 6, done: true }] }], media: [{ hash: 'original-media' }] }
  const weighIn = { d: '2026-11-18', w: 80 }
  it('does not change any legacy card or data when newer Module choices are missing', () => {
    mount({ workouts: [logged], bodyweight: [weighIn] })
    expect(host.querySelector('.home-weight-card')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-checkin')).toBeTruthy()
    expect(useStore.getState().S.workouts).toEqual([logged])
    expect(useStore.getState().S.bodyweight).toEqual([weighIn])
  })
  it('hides only the selected Body and Motivation cards, not history, media, or the Home greeting', () => {
    mount({ modules: { body: false, motivation: false }, workouts: [logged], bodyweight: [weighIn] })
    expect(host.querySelector('.home-weight-card')).toBeNull()
    expect(host.querySelector('.home-streak')).toBeNull()
    expect(host.querySelector('.home-greeting')).toBeTruthy()
    expect(host.querySelector('.home-checkin')).toBeTruthy()
    expect(useStore.getState().S.workouts).toEqual([logged])
    expect(useStore.getState().S.bodyweight).toEqual([weighIn])
    expect(useStore.getState().S.workouts[0].media).toEqual(logged.media)
  })
  it('switching back on restores the original IronLog card structures and respects the older Home-specific preference', () => {
    mount({ modules: { body: true, motivation: true } })
    expect(host.querySelector('.home-weight-card')).toBeTruthy()
    expect(host.querySelector('.home-streak')).toBeTruthy()
    mount({ modules: { body: true, motivation: true }, showWeightCard: false })
    expect(host.querySelector('.home-weight-card')).toBeNull()
    expect(host.querySelector('.home-streak')).toBeTruthy()
  })
})
