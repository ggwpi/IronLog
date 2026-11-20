// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, afterEach, expect, it } from 'vitest'
import Programmes, { ProgrammeEdit } from './Programmes.jsx'
import Modals from '../components/Modals.jsx'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { DEF } from '../store/useStore.js'
import { bindUI } from '../components/ui.jsx'
import { setLang } from '../lib/i18n.js'
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root, before
beforeEach(async () => {
  bindUI(useUI); await setLang('en'); useUI.setState({ sheets: [] })
  const S = structuredClone(DEF)
  Object.assign(S, { programmes: {}, programme: null, workouts: [], week: { 1: ['r'] }, routines: [{ id: 'r', name: 'Existing', ex: [{ id: '0025', sets: 3, reps: 5, weight: 60, note: 'א'.repeat(500) }] }] })
  before = structuredClone(S.routines)
  useStore.setState({ S, user: null, ready: true })
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
const click = text => { const el = [...document.querySelectorAll('button')].findLast(x => x.textContent === text || x.querySelector('.lrow-t')?.textContent === text); expect(el, text).toBeTruthy(); act(() => el.click()) }
const mount = async () => act(async () => root.render(<MemoryRouter initialEntries={['/plan/programmes']}><Routes><Route path="/plan/programmes" element={<Programmes />} /><Route path="/plan/prog/:id" element={<ProgrammeEdit />} /></Routes><Modals /></MemoryRouter>))
it('creates, edits a week, starts, pauses, resumes and ends through actual IronLog sheets', async () => {
  await mount(); click('New programme'); click('Week 1')
  const toggle = document.querySelector('[role="switch"]'); expect(toggle).toBeTruthy(); act(() => toggle.click()); click('Done')
  click('Start programme'); click('Start programme')
  expect(useStore.getState().S.programme).toBeTruthy()
  click('Pause'); expect(useStore.getState().S.programme.pausedOn).toBeTruthy()
  click('Resume'); expect(useStore.getState().S.programme.pausedOn).toBeUndefined()
  click('End programme'); click('End programme')
  expect(useStore.getState().S.programme).toBeNull(); expect(useStore.getState().S.week).toEqual({ 1: ['r'] })
  expect(useStore.getState().S.routines).toEqual(before)
})
it('renders Hebrew RTL and adds a starter without changing existing routines or schedule', async () => {
  await setLang('he'); await mount(); expect(document.documentElement.dir).toBe('rtl')
  click('תוכנית כוח, 4 שבועות')
  const S = useStore.getState().S
  expect(S.routines.slice(0, 1)).toEqual(before); expect(S.week).toEqual({ 1: ['r'] }); expect(S.programme).toBeNull()
  expect(Object.values(S.programmes)[0].weeks).toHaveLength(4)
})
it('refreshes percentage inputs after copying the previous week through the actual sheet', async () => {
  await mount(); click('Strength block, 4 weeks'); click('Week 2')
  const input = () => document.querySelector('input[aria-label^="%1RM for"]')
  expect(input().value).toBe('77.5')
  click('Same as last week, a bit heavier')
  expect(input().value).toBe('75')
})
