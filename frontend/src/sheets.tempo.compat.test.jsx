// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { EXIDX } from './lib/exercises.js'
import { exConfigSheet } from './sheets.jsx'
import { setTempoSheet } from './components/TempoSheet.jsx'

vi.mock('./lib/sound.js', async original => ({ ...await original(), queueTones: vi.fn(() => vi.fn()), unlock: vi.fn(), vibrate: vi.fn() }))

let host, root
beforeEach(() => {
 globalThis.IS_REACT_ACT_ENVIRONMENT = true
 useStore.setState({ S: structuredClone(DEF), user: null })
 useUI.setState({ sheets: [] })
 host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); useUI.setState({ sheets: [] }) })
it('the existing exercise configuration saves planned tempo without changing its prescribed loads or reps', () => {
 const save = vi.fn()
 const existing = { sets: 3, reps: 8, weight: 60, mode: 'reps', tempo: '3-1-X-0' }
 act(() => exConfigSheet(EXIDX['0025'], existing, save))
 act(() => root.render(useUI.getState().sheets.at(-1).render(() => {})))
 expect([...host.querySelectorAll('.lrow')].find(r => r.querySelector('.lrow-t')?.textContent === 'Tempo')?.textContent).toContain('3-1-X-0')
 act(() => [...host.querySelectorAll('button')].find(b => b.textContent === 'Save').click())
 expect(save).toHaveBeenCalledWith(expect.objectContaining({ sets: 3, reps: 8, weight: 60, mode: 'reps', tempo: '3-1-X-0' }))
 expect(existing).toEqual({ sets: 3, reps: 8, weight: 60, mode: 'reps', tempo: '3-1-X-0' })
})

function renderSheet() {
 const sheet = useUI.getState().sheets.at(-1)
 act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
}
function click(text) { act(() => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text).click()) }
function guide(onTick = vi.fn()) {
 const row = { w: 60, r: 1, done: false, note: 'א'.repeat(500), tag: 'blue', media: [{ hash: 'keep' }] }
 useStore.setState({ S: { ...structuredClone(DEF), active: { id: 'tempo-active', entries: [{ id: '0025', target: { sets: 1, reps: 1, tempo: '1-0-1-0' }, sets: [row] }] } } })
 setTempoSheet(0, 0, { onTick }); renderSheet(); click('Tempo 1-0-1-0, start the guide'); renderSheet()
 return { onTick, before: structuredClone(useStore.getState().S) }
}
it('runs the original guide and returns completion to IronLog without rewriting set metadata', () => {
 vi.useFakeTimers()
 try {
  const { onTick, before } = guide()
  expect(host.querySelector('.ironlog-tempo-guide [role="timer"]')).toBeTruthy()
  click('Start')
  act(() => vi.advanceTimersByTime(5100))
  click('Tick the set')
  expect(onTick).toHaveBeenCalledOnce()
  expect(useStore.getState().S).toEqual(before)
 } finally { vi.useRealTimers() }
})
it.each(['row', 'session', 'target'])('rejects a stale guide completion after the %s changes', kind => {
 vi.useFakeTimers()
 try {
  const { onTick } = guide()
  click('Start')
  act(() => useStore.getState().update(s => {
   if (kind === 'row') s.active.entries[0].sets[0].note = 'new note'
   if (kind === 'session') s.active.id = 'another-session'
   if (kind === 'target') s.active.entries[0].target.tempo = '3-1-1-0'
  }))
  act(() => vi.advanceTimersByTime(5100))
  click('Tick the set')
  expect(onTick).not.toHaveBeenCalled()
 } finally { vi.useRealTimers() }
})
