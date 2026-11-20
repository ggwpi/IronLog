// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, expect, it } from 'vitest'
import ModulesSettings, { IRONLOG_MODULE_IDS } from './ModulesSettings.jsx'
import { useStore, DEF } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import Modals from './Modals.jsx'
import { bindUI } from './ui.jsx'
import { searchSettings, pageVisible } from '../views/settings-pages.js'
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root, host
function Screen() {
  const S = useStore(s => s.S), update = useStore(s => s.update)
  return <><ModulesSettings S={S} update={update} /><Modals /></>
}
beforeEach(() => {
  bindUI(useUI); useUI.setState({ sheets: [] })
  const S = structuredClone(DEF)
  S.workouts = [{ id: 'keep', note: 'א'.repeat(500), entries: [], media: [{ hash: 'keep' }] }]
  S.bodyweight = [{ d: '2026-11-20', w: 80 }]; S.measurements = [{ d: '2026-11-20', waist: 85 }]
  S.modules = { future: false }
  useStore.setState({ S, user: null })
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host)
  act(() => root.render(<Screen />))
})
afterEach(() => { act(() => root.unmount()); host.remove() })
it('toggles every integrated module off and back on without deleting or converting data', () => {
  expect(host.querySelectorAll('[role=switch]')).toHaveLength(IRONLOG_MODULE_IDS.length)
  const before = structuredClone(useStore.getState().S)
  for (const button of [...host.querySelectorAll('[role=switch]')]) {
    act(() => button.click()); expect(button.getAttribute('aria-checked')).toBe('false')
    act(() => button.click()); expect(button.getAttribute('aria-checked')).toBe('true')
  }
  const after = useStore.getState().S
  for (const key of ['workouts', 'bodyweight', 'measurements', 'routines', 'customEx']) expect(after[key]).toEqual(before[key])
  expect(after.modules.future).toBe(false)
})
it('applies original presets through the actual IronLog picker while retaining profiles and unknown choices', () => {
  const before = structuredClone(useStore.getState().S.workouts)
  const row = [...host.querySelectorAll('button.lrow')].find(x => x.textContent.includes('Start from'))
  act(() => row.click())
  const choice = [...document.querySelectorAll('button.lrow')].find(x => x.textContent.includes('Just training'))
  expect(choice).toBeTruthy(); act(() => choice.click())
  expect(useStore.getState().S.modules).toMatchObject({ body: false, health: false, motivation: false, effort: true, future: false })
  expect(useStore.getState().S.workouts).toEqual(before)
})
it('hides paused pages and rows from Settings search while legacy contexts retain their entries', () => {
  const ctx = { mobile: true, ios: true, bodyOn: false, healthOn: false, effortOn: false, platesOn: false, coachOn: false, watchOn: false }
  expect(pageVisible('coach', ctx)).toBe(false); expect(pageVisible('watch', ctx)).toBe(false)
  expect(searchSettings('weigh in before', ctx)).toEqual([])
  expect(searchSettings('effort per set', ctx)).toEqual([])
  expect(searchSettings('daily form', ctx)).toEqual([])
  expect(searchSettings('weigh in before', { mobile: true }).length).toBeGreaterThan(0)
})
