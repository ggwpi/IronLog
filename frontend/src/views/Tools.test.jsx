// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it } from 'vitest'
import Tools from './Tools.jsx'
import { useStore, DEF } from '../store/useStore.js'
import { setLang } from '../lib/i18n.js'
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root, before
beforeEach(async () => {
  await setLang('en')
  const S = structuredClone(DEF)
  Object.assign(S, { workouts: [], heightCm: 180, unit: 'kg', lenUnit: 'cm', bodyweight: [{ d: '2026-11-20', w: 80 }], futureSetting: { keep: true } })
  useStore.setState({ S, user: null, ready: true }); before = structuredClone(S)
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
const mount = async () => act(async () => root.render(<MemoryRouter><Tools /></MemoryRouter>))
const stepper = label => [...document.querySelectorAll('.stp-w')].find(x => x.querySelector('.stp-l')?.textContent === label)
const increase = label => { const row = stepper(label); expect(row, label).toBeTruthy(); act(() => row.querySelector('button:last-child').click()) }
it('calculates with actual IronLog controls without saving temporary calculator values', async () => {
  await mount()
  expect(document.querySelector('[aria-labelledby="tools-pct"] table').textContent).toContain('75 kg')
  expect(document.querySelector('[aria-labelledby="tools-pace"] .tools-big').textContent).toContain('5:00')
  increase('1RM (kg)'); increase('Reps')
  expect(useStore.getState().S).toEqual(before)
  increase('Height (cm)')
  const after = structuredClone(useStore.getState().S)
  expect(after.heightCm).toBe(181); after.heightCm = before.heightCm
  // update stamps the intentional height edit; all existing content stays.
  delete after._ts; delete after.edited; delete after._wid; delete after._wids
  const original = structuredClone(before); delete original._ts; delete original.edited; delete original._wid; delete original._wids
  expect(after).toEqual(original)
})
it('renders Hebrew RTL and uses pounds and inches at the existing profile boundary', async () => {
  useStore.setState({ S: { ...before, unit: 'lb', lenUnit: 'in' } }); await setLang('he'); await mount()
  expect(document.documentElement.dir).toBe('rtl')
  expect(document.querySelector('h1').textContent).toBe('כלי אימון')
  expect(stepper('1RM (lb)')).toBeTruthy(); expect(stepper('גובה (in)')).toBeTruthy()
  expect(useStore.getState().S.bodyweight).toEqual(before.bodyweight)
})
