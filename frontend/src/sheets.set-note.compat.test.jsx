// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { setNoteSheet } from './sheets.jsx'

let host, root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [] })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); useUI.setState({ sheets: [] }) })
it('retains the actual IronLog 500-character editor, field data and saved history', () => {
  const note = 'א'.repeat(500)
  const row = { w: 60, r: 8, done: false, tag: 'blue', note, media: [{ hash: 'fixture-hash' }] }
  const S = { ...structuredClone(DEF), active: { id: 'fixture', entries: [{ id: '0025', sets: [row] }] }, workouts: [{ id: 'keep', d: '2026-10-01', entries: [] }] }
  useStore.setState({ S, user: null })
  act(() => setNoteSheet(0, 0))
  const sheet = useUI.getState().sheets.at(-1)
  act(() => root.render(sheet.render(() => {})))
  const textarea = host.querySelector('textarea')
  expect(textarea.maxLength).toBe(500)
  expect(textarea.value).toBe(note)
  act(() => [...host.querySelectorAll('button')].find(b => b.textContent === 'Save').click())
  expect(useStore.getState().S.active.entries[0].sets[0]).toEqual(row)
  expect(useStore.getState().S.workouts).toEqual(S.workouts)
})
