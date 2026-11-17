// @vitest-environment happy-dom
// Integration coverage for the *existing* IronLog workout row, not a copied openGym card.
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Workout from './Workout.jsx'
import { DEF, useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'

vi.mock('../lib/sound.js', () => ({ beep: vi.fn(), chime: vi.fn(), vibrate: vi.fn(), alertBuzz: vi.fn(), unlock: vi.fn() }))
vi.mock('../lib/api.js', () => ({ api: vi.fn(() => Promise.resolve({})), appBase: () => '/' }))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const clone = x => JSON.parse(JSON.stringify(x))
let host, root
const render = enabled => {
  const S = clone(DEF)
  if (enabled !== undefined) S.setTrend = enabled
  S.workouts = [{ id: 'old', d: '2026-10-01', start: new Date('2026-10-01T10:00:00').getTime(), entries: [{ id: '0025', target: { mode: 'reps' }, sets: [{ w: 60, r: 8, done: true }] }] }]
  S.active = { id: 'current', d: '2026-10-08', start: Date.now(), routineId: null, name: 'Bench day', bw: null, cur: 0, entries: [{ id: '0025', target: { mode: 'reps', sets: 2 }, sets: [{ w: 65, r: 8, done: true }, { w: 65, r: 8, done: false }] }] }
  const saved = JSON.stringify(S.workouts)
  useStore.setState({ S, user: null })
  act(() => root.render(<MemoryRouter><Workout /></MemoryRouter>))
  return saved
}
beforeEach(() => {
  localStorage.clear()
  useUI.setState({ sheets: [], toastMsg: '', timer: null, work: null })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  useUI.getState().stopRest()
  useUI.getState().stopWork()
})
describe('opt-in set trends preserve IronLog workout row design and historical data', () => {
  it('keeps the existing card and set controls intact for pre-feature profiles', () => {
    const original = render(undefined)
    expect(host.querySelector('.setrow')).toBeTruthy()
    expect(host.querySelector('button.n')).toBeTruthy()
    expect(host.querySelector('[data-set-trend]')).toBeNull()
    expect(JSON.stringify(useStore.getState().S.workouts)).toBe(original)
  })
  it('adds only the trend mark inside an existing set-number button when enabled', () => {
    const original = render(true)
    const mark = host.querySelector('.setrow button.n [data-set-trend="↑"]')
    expect(mark).toBeTruthy()
    expect(host.querySelectorAll('[data-set-trend]')).toHaveLength(1)
    expect(host.querySelector('button.n')?.getAttribute('aria-label')).toMatch(/more than last time/)
    expect(JSON.stringify(useStore.getState().S.workouts)).toBe(original)
  })
})
