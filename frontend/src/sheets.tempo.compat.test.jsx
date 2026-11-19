// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { EXIDX } from './lib/exercises.js'
import { exConfigSheet } from './sheets.jsx'

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
