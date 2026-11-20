// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Workout from './Workout.jsx'
import { DEF, useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { auditCompleteProfilePreservation } from '../lib/migration-audit.js'

vi.mock('../lib/sound.js', () => ({ beep: vi.fn(), vibrate: vi.fn(), unlock: vi.fn(), queueTones: vi.fn(() => vi.fn()) }))
vi.mock('../lib/api.js', () => ({ api: vi.fn(() => Promise.resolve({})) }))

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const clone = value => JSON.parse(JSON.stringify(value))
const SQUAT = '0043'

let root, container, sheetRoot, sheetContainer

function mount(entry, over = {}) {
  const S = clone(DEF)
  S.unit = 'lb'
  Object.assign(S, over)
  S.active = {
    id: 'focus-test', d: '2026-09-28', start: Date.now(), routineId: null,
    name: 'Focus', bw: null, cur: 0, workoutView: 'focus', entries: [entry],
  }
  useStore.setState({ S, user: null })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<MemoryRouter><Workout /></MemoryRouter>))
}

function openMenu() {
  act(() => container.querySelector('button[aria-label="More"]').click())
  const sheet = useUI.getState().sheets.at(-1)
  sheetContainer = document.createElement('div')
  document.body.appendChild(sheetContainer)
  sheetRoot = createRoot(sheetContainer)
  act(() => sheetRoot.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return sheetContainer
}

function renderLatestSheet() {
  if (sheetRoot) act(() => sheetRoot.unmount())
  if (sheetContainer) sheetContainer.remove()
  const sheet = useUI.getState().sheets.at(-1)
  sheetContainer = document.createElement('div')
  document.body.appendChild(sheetContainer)
  sheetRoot = createRoot(sheetContainer)
  act(() => sheetRoot.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return sheetContainer
}

function setMenuAction(label) {
  act(() => container.querySelector('button[aria-label="Set menu"]').click())
  const menu = renderLatestSheet()
  const action = [...menu.querySelectorAll('.menu-item')].find(b => b.querySelector('.tt')?.textContent === label)
  expect(action).toBeTruthy()
  act(() => action.click())
  return renderLatestSheet()
}

beforeEach(() => {
  useUI.setState({ sheets: [], toastMsg: '', timer: null, work: null })
})

afterEach(() => {
  if (sheetRoot) act(() => sheetRoot.unmount())
  if (sheetContainer) sheetContainer.remove()
  if (root) act(() => root.unmount())
  if (container) container.remove()
  sheetRoot = sheetContainer = root = container = null
  useUI.getState().stopRest()
})

describe('Focus workout view', () => {
  it('completes the tempo guide through the existing Focus Done behavior and retains set metadata', () => {
    vi.useFakeTimers()
    try {
      const row = { w: 60, r: 1, done: false, note: 'א'.repeat(500), tag: 'blue', media: [{ hash: 'keep' }] }
      mount({ id: '0025', target: { sets: 1, reps: 1, weight: 60, tempo: '1-0-1-0' }, sets: [row] }, { unit: 'kg' })
      let editor = setMenuAction('Tempo')
      act(() => [...editor.querySelectorAll('button')].find(b => b.textContent === 'Tempo 1-0-1-0, start the guide').click())
      const guide = renderLatestSheet()
      act(() => [...guide.querySelectorAll('button')].find(b => b.textContent === 'Start').click())
      act(() => vi.advanceTimersByTime(5100))
      act(() => [...guide.querySelectorAll('button')].find(b => b.textContent === 'Tick the set').click())
      expect(useStore.getState().S.active.entries[0].sets[0]).toMatchObject({ ...row, done: true })
    } finally { useUI.getState().stopRest(); vi.useRealTimers() }
  })
  it('edits an opted-in cardio level while preserving notes, media and old default controls', () => {
    const row = { min: 30, speed: 10, level: 8, done: false, note: 'א'.repeat(500), tag: 'blue', media: [{ hash: 'keep' }] }
    mount({ id: '2138', target: { sets: 1, min: 30, speed: 10 }, sets: [row] }, { unit: 'kg', showCardioLevel: true })
    const increase = container.querySelector('button[aria-label="Increase level"]')
    expect(increase).toBeTruthy()
    act(() => increase.click())
    expect(useStore.getState().S.active.entries[0].sets[0]).toEqual({ ...row, level: 9 })
    act(() => useStore.getState().update(s => { s.active.entries[0].sets[0].level = 30 }))
    act(() => container.querySelector('button[aria-label="Increase level"]').click())
    expect(useStore.getState().S.active.entries[0].sets[0].level).toBe(30)
    act(() => useStore.getState().update(s => { s.active.entries[0].sets[0].level = 1 }))
    act(() => container.querySelector('button[aria-label="Decrease level"]').click())
    expect(useStore.getState().S.active.entries[0].sets[0]).toEqual({ ...row, level: undefined })
  })
  it('keeps resistance hidden by default and locks completed cardio rows', () => {
    mount({ id: '2138', target: { mode: 'cardio' }, sets: [{ min: 30, speed: 10, level: 8, done: true }] })
    expect(container.querySelector('button[aria-label="Increase level"]')).toBeNull()
    expect(useStore.getState().S.active.entries[0].sets[0].level).toBe(8)
    act(() => useStore.getState().update(s => { s.showCardioLevel = true }))
    const increase = container.querySelector('button[aria-label="Increase level"]')
    expect(increase).toBeTruthy()
    expect(increase.disabled).toBe(true)
  })
  it('omits a plan that repeats the prescription and keeps plate guidance in the badge row', () => {
    mount({
      id: SQUAT,
      target: { sets: 1, reps: 5, weight: 95 },
      planned: { sets: 1, reps: 5, weight: 95 },
      plan: { kind: 'up' },
      sets: [{ w: 95, r: 5, done: false }],
    })

    const summary = container.querySelector('.focus-prescription')
    expect(summary.textContent).not.toContain('Plan:')
    const plate = summary.querySelector('.focus-badge.plate')
    expect(plate).toBeTruthy()
    expect(plate.textContent).toContain('25 per side')
    expect(container.querySelector('.plateline')).toBeNull()
  })

  it('shows only a changed plan as a badge because the prescription already shows today', () => {
    mount({
      id: SQUAT,
      target: { sets: 4, reps: 8, weight: 95 },
      planned: { sets: 3, reps: 5, weight: 95 },
      plan: { kind: 'up' },
      sets: Array.from({ length: 4 }, () => ({ w: 95, r: 8, done: false })),
    })

    const summary = container.querySelector('.focus-prescription')
    const plan = summary.querySelector('.focus-badge.plan')
    expect(plan).toBeTruthy()
    expect(plan.textContent).toBe('Plan: 3 × 5')
    expect(summary.textContent).toContain('8 Reps')
    expect(summary.textContent).not.toContain('today')
  })

  it('offers the per-exercise progression switch and marks the current exercise', () => {
    mount({ id: SQUAT, target: { sets: 1, reps: 5, weight: 95 }, sets: [{ w: 95, r: 5, done: false }] })

    const item = [...openMenu().querySelectorAll('.menu-item')]
      .find(el => el.querySelector('.tt')?.textContent === 'Don’t count for progression')
    expect(item).toBeTruthy()
    act(() => item.click())

    expect(useStore.getState().S.active.entries[0].noProg).toBe(true)
    const status = container.querySelector('.focus-prescription .focus-badge.warning')
    expect(status).toBeTruthy()
    expect(status.textContent).toContain('Not counted for progression')
    expect(container.querySelector('.noprog')).toBeNull()
  })

  it('uses the exercise rest-pause duration for a new burst', () => {
    mount({
      id: SQUAT,
      target: { sets: 1, reps: 5, weight: 95, intensifier: { type: 'restpause', restSec: 7 } },
      sets: [{ w: 95, r: 5, done: false }],
    })

    act(() => container.querySelector('button[aria-label="Set menu"]').click())
    const sheet = useUI.getState().sheets.at(-1)
    sheetContainer = document.createElement('div')
    document.body.appendChild(sheetContainer)
    sheetRoot = createRoot(sheetContainer)
    act(() => sheetRoot.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
    const item = [...sheetContainer.querySelectorAll('.menu-item')]
      .find(el => el.querySelector('.tt')?.textContent === 'Add burst')
    act(() => item.click())

    expect(useStore.getState().S.active.entries[0].sets[0].clusters[0].restSec).toBe(7)
  })
})

// The speed stepper follows the profile's speed unit like the set row does (lib/speed.js): shown,
// stepped and typed in mph, stored in km/h. It used to say km/h whatever the setting.
describe('Focus view cardio distance', () => {
  const BIKE = '2138'
  const bike = () => ({ id: BIKE, target: { sets: 1, min: 30, speed: 10 }, sets: [{ min: 30, speed: 10, done: false, note: 'א'.repeat(500), tag: 'blue', media: [{ hash: 'keep' }] }] })
  const row = () => useStore.getState().S.active.entries[0].sets[0]
  const cell = () => container.querySelector('button[aria-label="Increase distance"]').closest('.stp-w')

  it('uses original kilometre conversion and derived speed with the existing Focus controls', () => {
    mount(bike(), { unit: 'kg', cardioBy: { [BIKE]: 'distance' } })
    const metadata = { note: row().note, tag: row().tag, media: clone(row().media) }
    expect(cell().querySelector('input').value).toBe('5')
    act(() => container.querySelector('button[aria-label="Increase distance"]').click())
    expect(row()).toMatchObject({ min: 30, km: 5.5, speed: 11, ...metadata })
    act(() => container.querySelector('button[aria-label="Increase duration"]').click())
    expect(row()).toMatchObject({ min: 31, km: 5.5, speed: 10.65, ...metadata })
  })

  it('shows miles independently of weight units while keeping kilometres in the saved row', () => {
    mount(bike(), { unit: 'kg', speedUnit: 'mph', cardioBy: { [BIKE]: 'distance' } })
    expect(cell().querySelector('.stp-l').textContent).toBe('Distance (mi)')
    expect(cell().querySelector('input').value).toBe('3.11')
    act(() => container.querySelector('button[aria-label="Increase distance"]').click())
    expect(row()).toMatchObject({ km: 5.166, speed: 10.33 })
    expect(useStore.getState().S.unit).toBe('kg')
  })

  it('switches logging mode in the actual menu without rewriting the active row or existing choices', () => {
    mount(bike(), { unit: 'kg', cardioBy: { future: 'preserve' } })
    const before = clone(row())
    const beforeProfile = clone(useStore.getState().S)
    const menu = openMenu()
    act(() => [...menu.querySelectorAll('.menu-item')].find(b => b.querySelector('.tt')?.textContent === 'Log distance instead').click())
    expect(useStore.getState().S.cardioBy).toEqual({ future: 'preserve', [BIKE]: 'distance' })
    expect(row()).toEqual(before)
    expect(auditCompleteProfilePreservation(beforeProfile, useStore.getState().S).ok).toBe(true)
    expect(cell().querySelector('input').value).toBe('5')
  })

  it('retains the existing lock on completed sets', () => {
    const entry = bike(); entry.sets[0].done = true
    mount(entry, { unit: 'kg', cardioBy: { [BIKE]: 'distance' } })
    const before = clone(row())
    expect(cell().querySelector('input').disabled).toBe(true)
    act(() => container.querySelector('button[aria-label="Increase distance"]').click())
    expect(row()).toEqual(before)
  })
})

describe('Focus existing set metadata controls', () => {
  const note = 'א'.repeat(500)
  const entry = () => ({ id: SQUAT, target: { mode: 'reps', tempo: '2-0-1-0' }, sets: [{ w: 60, r: 8, done: false, note, tag: 'blue', media: [{ hash: 'keep' }] }] })
  const row = () => useStore.getState().S.active.entries[0].sets[0]
  const button = (sheet, text) => [...sheet.querySelectorAll('button')].find(b => b.textContent === text)

  it('opens the actual 500-character IronLog note editor and saves without changing set fields', () => {
    mount(entry())
    const before = clone(row())
    const sheet = setMenuAction('Edit note')
    expect(sheet.querySelector('textarea').maxLength).toBe(500)
    expect(sheet.querySelector('textarea').value).toBe(note)
    act(() => button(sheet, 'Save').click())
    expect(row()).toEqual(before)
    expect(JSON.parse(localStorage.getItem('gym_state_v1')).active.entries[0].sets[0]).toEqual(before)
  })

  it('sets and clears the original tag through the actual picker without losing metadata', () => {
    const e = entry(); e.sets[0].done = true
    mount(e)
    const before = clone(row())
    let sheet = setMenuAction('Colour tag')
    act(() => [...sheet.querySelectorAll('.menu-item')].find(b => b.textContent.includes('Orange')).click())
    expect(row()).toEqual({ ...before, tag: 'orange' })
    sheet = setMenuAction('Colour tag')
    act(() => [...sheet.querySelectorAll('.menu-item')].find(b => b.querySelector('.tt')?.textContent === 'None').click())
    const { tag, ...untagged } = before
    expect(row()).toEqual(untagged)
  })

  it('sets an original tempo preset and clears back to the exercise without changing other fields', () => {
    mount(entry())
    const before = clone(row())
    let sheet = setMenuAction('Tempo')
    act(() => button(sheet, '3-1-1-0').click())
    act(() => button(sheet, 'Save').click())
    expect(row()).toEqual({ ...before, tempo: '3-1-1-0' })
    sheet = setMenuAction('Tempo')
    act(() => button(sheet, 'Like the exercise (2-0-1-0)').click())
    expect(row()).toEqual(before)
  })

  it.each(['warmup', 'cardio'])('does not offer rep tempo on a %s row', kind => {
    const e = entry()
    if (kind === 'warmup') e.sets[0].warmup = true
    else { e.id = '2138'; e.target.mode = 'cardio'; e.sets[0] = { min: 30, speed: 10, done: false } }
    mount(e)
    act(() => container.querySelector('button[aria-label="Set menu"]').click())
    const sheet = renderLatestSheet()
    expect([...sheet.querySelectorAll('.menu-item .tt')].map(b => b.textContent)).not.toContain('Tempo')
  })
})

describe('Focus view cardio speed', () => {
  const BIKE = '2138'   // stationary bike, cardio
  const bike = () => ({ id: BIKE, target: { sets: 1, min: 20, speed: 8 }, sets: [{ min: 20, speed: 8, done: false }] })
  const cell = () => container.querySelector('button[aria-label="Increase speed"]').closest('.stp-w')
  const stored = () => useStore.getState().S.active.entries[0].sets[0].speed
  const type = value => {
    const input = cell().querySelector('input')
    act(() => {
      Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  it('reads, steps and takes typing in mph for a profile in pounds, and stores km/h', () => {
    mount(bike())
    expect(cell().querySelector('.stp-l').textContent).toBe('Speed (mph)')
    expect(cell().querySelector('input').value).toBe('4.97')   // 8 km/h
    act(() => container.querySelector('button[aria-label="Increase speed"]').click())
    expect(stored()).toBe(8.8)
    type('6')
    expect(stored()).toBe(9.66)
  })

  it('follows a chosen unit over the weight unit, and leaves km/h as it was', () => {
    mount(bike(), { unit: 'kg', speedUnit: 'mph' })
    expect(cell().querySelector('.stp-l').textContent).toBe('Speed (mph)')
    act(() => root.unmount()); container.remove()
    mount(bike(), { speedUnit: 'kmh' })
    expect(cell().querySelector('.stp-l').textContent).toBe('Speed (km/h)')
    expect(cell().querySelector('input').value).toBe('8')
    act(() => container.querySelector('button[aria-label="Increase speed"]').click())
    expect(stored()).toBe(8.5)
  })
})
