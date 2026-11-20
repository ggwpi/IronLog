// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import Workout from './Workout.jsx'
import { DEF, useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { setKnownBands } from '../lib/bands.js'
import { bindUI } from '../components/ui.jsx'
import { exConfigSheet } from '../sheets.jsx'
import { exOr } from '../lib/exercises.js'
vi.mock('../lib/api.js', () => ({ api: vi.fn(() => Promise.resolve({})) }))
vi.mock('../lib/sound.js', () => ({ beep: vi.fn(), vibrate: vi.fn(), unlock: vi.fn() }))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove(); useUI.getState().stopRest() })

it('saves selected starting bands through the actual exercise configuration sheet', () => {
  const S = structuredClone(DEF)
  Object.assign(S, { bands: [{ id: 'r', name: 'Red', color: '#eb5757' }], bandEx: { '0025': true } })
  useStore.setState({ S, user: null }); useUI.setState({ sheets: [] }); bindUI(useUI)
  const save = vi.fn()
  act(() => exConfigSheet(exOr('0025'), { mode: 'reps', sets: 2, reps: 12, weight: 20, note: 'א'.repeat(500) }, save))
  act(() => root.render(useUI.getState().sheets.at(-1).render(() => {})))
  act(() => host.querySelector('.bandchips button[aria-pressed]').click())
  const button = [...host.querySelectorAll('button')].find(b => b.textContent === 'Save')
  expect(button).toBeTruthy(); act(() => button.click())
  expect(save.mock.calls[0][0]).toMatchObject({ bands: ['r'], sets: 2, reps: 12, weight: 20, note: 'א'.repeat(500) })
})

it.each(['cards', 'list', 'compact', 'focus'])('logs bands in the actual %s layout without changing existing values or metadata', view => {
  const S = structuredClone(DEF)
  Object.assign(S, { bands: [{ id: 'r', name: 'אדומה', color: '#eb5757', future: { keep: true } }], bandEx: { '0025': true },
    workouts: [], routines: [], active: { id: 'keep', d: '2026-11-20', start: Date.now(), name: 'Bands', cur: 0, workoutView: view,
      entries: [{ id: '0025', note: 'א'.repeat(500), media: [{ hash: 'keep' }], target: { mode: 'reps', sets: 1, reps: 12, weight: 20 }, sets: [{ w: 20, r: 12, note: 'שמור', custom: { keep: true }, done: false }] }] } })
  const original = structuredClone(S.active.entries[0])
  setKnownBands(S.bands)
  useStore.setState({ S, user: null })
  act(() => root.render(<MemoryRouter><Workout /></MemoryRouter>))
  const chip = host.querySelector('.bandchips button[aria-pressed]')
  expect(chip).toBeTruthy(); expect(chip.textContent).toContain('אדומה')
  act(() => chip.click())
  expect(useStore.getState().S.active.entries[0]).toEqual({ ...original, sets: [{ ...original.sets[0], bands: ['r'] }] })
  act(() => host.querySelector('.bandchips button[aria-pressed]').click())
  expect(useStore.getState().S.active.entries[0].sets[0].bands || []).toEqual([])
  expect(useStore.getState().S.bands).toEqual(S.bands)
})
