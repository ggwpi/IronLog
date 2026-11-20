// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import CircuitSheetHost, { routineCircuitSheet } from './CircuitSheets.jsx'
import Modals from './Modals.jsx'
import Workout from '../views/Workout.jsx'
import { bindUI } from './ui.jsx'
import { useStore, DEF } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { useCircuit } from '../store/useCircuit.js'
import { buildCombinedEntries } from '../lib/session-merge.js'
import { finishWorkoutNow } from '../sheets.jsx'
vi.mock('../lib/api.js', () => ({ api: vi.fn(() => Promise.resolve({})), beacon: vi.fn() }))
vi.mock('../lib/sound.js', () => ({ beep: vi.fn(), chime: vi.fn(), vibrate: vi.fn(), unlock: vi.fn() }))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const BASE = Date.UTC(2026, 10, 20, 10)
let root, host
beforeEach(() => {
  vi.useFakeTimers({ now: BASE, toFake: ['Date'] }); bindUI(useUI)
  useUI.setState({ sheets: [], timer: null, work: null }); useCircuit.getState().reset()
  const S = structuredClone(DEF)
  Object.assign(S, { sound: false, spokenCues: false, workouts: [], active: null, routines: [{ id: 'r', name: 'Plan', ex: [{ id: '0025', mode: 'reps', sets: 2, reps: 10, weight: 20, note: 'א'.repeat(500), future: { keep: true } }] }] })
  useStore.setState({ S, user: null, ready: true })
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host)
})
afterEach(() => { act(() => { useCircuit.getState().reset(); root.unmount() }); host.remove(); useUI.getState().stopRest(); vi.useRealTimers() })
const mount = async workout => { await act(async () => root.render(<MemoryRouter>{workout && <Workout />}<CircuitSheetHost /><Modals /></MemoryRouter>)) }
const click = (selector, text) => { const el = [...document.querySelectorAll(selector)].find(x => x.textContent === text); expect(el).toBeTruthy(); act(() => el.click()) }
const type = (label, value) => act(() => {
  const input = document.querySelector(`input[aria-label="${label}"]`)
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(value)); input.dispatchEvent(new Event('input', { bubbles: true }))
})
const pickType = text => {
  const row = [...document.querySelectorAll('button.lrow')].find(x => x.querySelector('.lrow-t')?.textContent === 'Routine type')
  expect(row).toBeTruthy(); act(() => row.click())
  const item = [...document.querySelectorAll('button.lrow')].find(x => x.querySelector('.lrow-t')?.textContent === text)
  expect(item).toBeTruthy(); act(() => item.click())
}
it.each([['Circuit', 'circuit'], ['AMRAP', 'amrap'], ['EMOM', 'emom'], ['Intervals', 'intervals'], ['Tabata', 'intervals']])('selects %s through the real routine picker', async (label, mode) => {
  await mount(false)
  act(() => routineCircuitSheet('r')); pickType(label); click('.sheet button', 'Save')
  const cfg = useStore.getState().S.routines[0].ex[0].sgCircuit
  expect(cfg.mode).toBe(mode)
  if (label === 'Tabata') expect(cfg).toEqual({ mode: 'intervals', work: 20, rest: 10, rounds: 8 })
})
it('configures a single-station EMOM and restores the previous routine without losing metadata or Hebrew notes', async () => {
  await mount(false)
  const before = structuredClone(useStore.getState().S.routines[0].ex[0])
  act(() => routineCircuitSheet('r')); pickType('EMOM'); type('Time', 10); type('Rounds', 2)
  click('[data-circuit-player] button, .sheet button', 'Save')
  const configured = useStore.getState().S.routines[0].ex[0]
  expect(configured.sg).toBeTruthy(); expect(configured.sgCircuit).toEqual({ mode: 'emom', every: 10, count: 2 })
  expect(configured.note).toBe(before.note); expect(configured.future).toEqual(before.future)
  act(() => routineCircuitSheet('r')); pickType('Regular'); click('.sheet button', 'Save')
  const restored = useStore.getState().S.routines[0].ex[0]
  for (const key of Object.keys(before)) expect(restored[key]).toEqual(before[key])
  expect(restored).not.toHaveProperty('sgCircuit'); expect(restored).not.toHaveProperty('preType')
})
it.each(['cards', 'list', 'compact', 'focus'])('runs and saves the original clock through the actual %s workout controls', async view => {
  const S = useStore.getState().S
  S.routines[0].ex[0] = { ...S.routines[0].ex[0], sg: 'clock', sgCircuit: { mode: 'emom', every: 10, count: 2 } }
  const built = buildCombinedEntries(S, ['r'])
  built.entries[0].note = 'ב'.repeat(500)
  built.entries[0].sets[0].note = 'ג'.repeat(500)
  S.active = { id: 'w', name: 'Clock', d: '2026-11-20', start: BASE, cur: 0, routineIds: ['r'], workoutView: view, entries: built.entries }
  await mount(true)
  const card = document.querySelector('[data-circuit-card]'); expect(card).toBeTruthy()
  act(() => card.querySelector('button').click())
  expect(document.querySelector('[data-circuit-player]')).toBeTruthy()
  click('[data-circuit-player] button', 'Start')
  expect(document.querySelector('[data-circuit-player] bdi').getAttribute('dir')).toBe('ltr')
  act(() => { vi.setSystemTime(BASE + 10000); useCircuit.getState().tick() })
  click('[data-circuit-player] button', 'Done')
  act(() => { vi.setSystemTime(BASE + 20000); useCircuit.getState().tick() })
  click('[data-circuit-player] button', 'Done')
  act(() => { vi.setSystemTime(BASE + 30000); useCircuit.getState().tick() })
  expect(useStore.getState().S.active.circuits[0]).toMatchObject({ mode: 'emom', ended: 'done' })
  await act(async () => finishWorkoutNow())
  const saved = useStore.getState().S.workouts[0]
  expect(saved.circuits[0]).toMatchObject({ mode: 'emom', ended: 'done' })
  expect(saved.entries[0].target.note).toBe('א'.repeat(500)); expect(saved.entries[0].note).toBe('ב'.repeat(500))
  expect(saved.entries[0].sets[0].note).toBe('ג'.repeat(500)); expect(saved.entries[0].sets.every(s => s.done)).toBe(true)
  expect(document.querySelector('[data-circuit-results]')).toBeTruthy()
  expect(useStore.getState().S.active).toBeNull()
})
it('creates the original run/walk preset and advances only after saving a completed session', async () => {
  useStore.getState().S.routines[0].ex = []
  await mount(false)
  act(() => routineCircuitSheet('r')); pickType('Run/walk program'); click('.sheet button', 'Save')
  let S = useStore.getState().S
  expect(S.routines[0].ex[0]).toMatchObject({ id: '0685', sgCircuit: { program: 'runwalk', level: 1, n: 0 } })
  const entries = buildCombinedEntries(S, ['r']).entries
  act(() => useStore.setState({ S: { ...S, active: { id: 'run', name: 'Run', d: '2026-11-20', start: BASE, cur: 0, routineIds: ['r'], entries } } }))
  act(() => { useCircuit.getState().openAt(0); useCircuit.getState().start() })
  act(() => { vi.setSystemTime(BASE + 60 * 60 * 1000); useCircuit.getState().tick() })
  expect(useStore.getState().S.routines[0].ex[0].sgCircuit.n).toBe(0)
  expect(useStore.getState().S.active.circuits[0].ended).toBe('done')
  await act(async () => finishWorkoutNow())
  S = useStore.getState().S
  expect(S.routines[0].ex[0].sgCircuit.n).toBe(1)
  expect(S.workouts[0].circuits[0]).not.toHaveProperty('advance')
})
it('keeps a paused clock with its owner across account changes and refuses stale exercise positions', async () => {
  const S = useStore.getState().S
  S.routines[0].ex[0] = { ...S.routines[0].ex[0], sg: 'clock', sgCircuit: { mode: 'emom', every: 10, count: 2 } }
  S.active = { id: 'owner-one', name: 'Clock', d: '2026-11-20', start: BASE, cur: 0, routineIds: ['r'], entries: buildCombinedEntries(S, ['r']).entries }
  await mount(true)
  act(() => { useCircuit.getState().openAt(0); useCircuit.getState().start(); useCircuit.getState().pause() })
  const ownerOne = structuredClone(useStore.getState().S)
  expect(ownerOne.active.ironlogCircuitRun).toMatchObject({ wid: 'owner-one', paused: BASE })
  await act(async () => useStore.setState({ S: { ...structuredClone(DEF), active: null } }))
  expect(useCircuit.getState().run).toBeNull()
  await act(async () => useStore.setState({ S: ownerOne }))
  expect(useCircuit.getState().run).toMatchObject({ wid: 'owner-one', paused: BASE })
  const rows = structuredClone(useStore.getState().S.active.entries[0].sets)
  await act(async () => useStore.getState().update(s => { s.active.entries[0].id = '0043' }))
  expect(useCircuit.getState().run).toBeNull()
  expect(useStore.getState().S.active.entries[0].sets).toEqual(rows)
})
