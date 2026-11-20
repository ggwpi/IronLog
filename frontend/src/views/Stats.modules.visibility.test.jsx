// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ S: null }))
vi.mock('../store/useStore.js', () => ({ useStore: selector => selector({ S: mocks.S }) }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../sheets.jsx', () => ({
  bwSheet: vi.fn(), goalSheet: vi.fn(), calendarSheet: vi.fn(), dayOverrideSheet: vi.fn(),
  workoutDetailSheet: vi.fn(), exerciseHistorySheet: vi.fn(), weighInsSheet: vi.fn(),
  WorkoutRow: () => null, bwDeltaColor: () => '',
}))
vi.mock('../components/Heatmap.jsx', () => ({ default: () => React.createElement('div', { 'data-core-heatmap': true }) }))
vi.mock('../components/LineChart.jsx', () => ({ default: () => null }))
vi.mock('../components/BodyMap.jsx', () => ({ default: () => null, BodyMapLegend: () => null }))
vi.mock('../components/StrengthLevelsCard.jsx', () => ({ default: () => React.createElement('div', { 'data-strength-levels-test': true }) }))
vi.mock('../components/RelativeStrengthCard.jsx', () => ({ default: () => null }))
vi.mock('../components/DailyFormStatsCard.jsx', () => ({ default: () => React.createElement('div', { 'data-daily-form-test': true }) }))
import Stats from './Stats.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root, host
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })

const workout = { id: 'w1', d: '2026-11-18', start: 1794950000000, end: 1794953600000,
  entries: [{ id: '0025', target: { mode: 'reps', id: '0025' }, sets: [{ w: 60, r: 8, done: true }] }] }
const original = { unit: 'kg', body: 'male', targetW: null, effort: 'none',
  bodyweight: [{ d: '2026-11-18', w: 80 }], measurements: [], dayPhotos: {}, workouts: [workout],
  routines: [], exWeights: {}, customEx: [], week: {}, dayPlan: {}, active: null }
const mount = (modules, extra = {}) => {
  mocks.S = { ...structuredClone(original), ...(modules === undefined ? {} : { modules }), ...extra }
  const untouched = structuredClone(mocks.S)
  act(() => root.render(<Stats />))
  expect(mocks.S).toEqual(untouched)
}
const card = title => [...host.querySelectorAll('.card')].find(el => el.querySelector('h2')?.textContent === title)
const tile = title => [...host.querySelectorAll('.stats-summary .tile')].find(el => el.querySelector('.l')?.textContent === title)

describe('original openGym Modules control only the native IronLog Stats surfaces', () => {
  it('Effort and Health opt-outs hide their cards while retaining ratings and daily form', () => {
    const effortCard = () => [...host.querySelectorAll('.card h2')].find(el => el.textContent.startsWith('Effort'))
    const workouts = structuredClone(original.workouts)
    workouts[0].entries[0].sets[0].rir = 2
    const extra = { workouts, dayForm: { '2026-11-18': { energy: 4, _ts: 1 } } }
    mount(undefined, extra)
    expect(effortCard()).toBeTruthy()
    expect(host.querySelector('[data-daily-form-test]')).toBeTruthy()
    mount({ effort: false, health: false }, extra)
    expect(effortCard()).toBeFalsy()
    expect(host.querySelector('[data-daily-form-test]')).toBeFalsy()
    expect(mocks.S.workouts).toEqual(workouts)
    expect(mocks.S.dayForm).toEqual(extra.dayForm)
    mount({ effort: true, health: true }, extra)
    expect(effortCard()).toBeTruthy()
    expect(host.querySelector('[data-daily-form-test]')).toBeTruthy()
  })
  it('keeps original Stats visuals and history for all legacy profiles', () => {
    mount()
    expect(tile('Week streak')).toBeTruthy()
    expect(tile('Weight 30d')).toBeTruthy()
    expect(card('Body weight')).toBeTruthy()
    expect(card('Body measurements')).toBeTruthy()
    expect(card('Progress photos')).toBeTruthy()
    expect(host.querySelector('[data-strength-levels-test]')).toBeTruthy()
    expect(tile('Workouts')).toBeTruthy()
    expect(host.querySelector('[data-core-heatmap]')).toBeTruthy()
  })
  it('explicit Body, Motivation and Strength opt-outs hide only their surfaces and never delete data', () => {
    mount({ body: false, motivation: false, strength: false })
    expect(tile('Week streak')).toBeFalsy()
    expect(tile('Weight 30d')).toBeFalsy()
    expect(card('Body weight')).toBeFalsy()
    expect(card('Body measurements')).toBeFalsy()
    expect(card('Progress photos')).toBeFalsy()
    expect(host.querySelector('[data-strength-levels-test]')).toBeFalsy()
    expect(card('Exercise progress')).toBeTruthy()
    expect(tile('Workouts')).toBeTruthy()
    expect(host.querySelector('[data-core-heatmap]')).toBeTruthy()
    expect(mocks.S.workouts).toEqual(original.workouts)
    expect(mocks.S.bodyweight).toEqual(original.bodyweight)
    expect(mocks.S.workouts[0].id).toBe('w1')
  })
  it('re-enabling original modules makes the same native cards return', () => {
    mount({ body: true, motivation: true, strength: true })
    expect(card('Body weight')).toBeTruthy()
    expect(card('Body measurements')).toBeTruthy()
    expect(tile('Week streak')).toBeTruthy()
    expect(host.querySelector('[data-strength-levels-test]')).toBeTruthy()
  })
})
