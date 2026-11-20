// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import { useStore, DEF } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { bindUI } from './ui.jsx'
import Modals from './Modals.jsx'
import { dumbbellInventorySheet, exerciseDetailSheet } from '../sheets.jsx'
import { EXDB } from '../lib/exercises-data.js'
import { ownedWeightsFor } from '../lib/dumbbells.js'
import { syncGymInventory, switchGym } from '../lib/gym-inventory.js'
globalThis.IS_REACT_ACT_ENVIRONMENT = true
it('copies inventory through the actual IronLog sheet and picker without altering the source gym', () => {
  const S = structuredClone(DEF)
  Object.assign(S, { activeEquipId: 'home', equipProfiles: [{ id: 'home', name: 'בית', equipment: [] }, { id: 'gym', name: 'חדר כושר', equipment: [], dumbbells: { kg: { weights: [8, 16], _ts: 10 } } }], dumbbells: { kg: { weights: [5, 10], _ts: 1 } } })
  syncGymInventory(S)
  useStore.setState({ S, user: null }); useUI.setState({ sheets: [] }); bindUI(useUI)
  const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host)
  try {
    act(() => root.render(<Modals />)); act(() => dumbbellInventorySheet())
    expect(document.querySelector('.sheet').textContent).toContain('בית')
    const row = [...document.querySelectorAll('button.lrow')].find(x => x.querySelector('.lrow-t')?.textContent === 'Copy from')
    expect(row).toBeTruthy(); act(() => row.click())
    const target = [...document.querySelectorAll('button.lrow')].find(x => x.querySelector('.lrow-t')?.textContent === 'חדר כושר')
    expect(target).toBeTruthy(); act(() => target.click())
    expect(useStore.getState().S.dumbbells.kg.weights).toEqual([8, 16])
    act(() => useStore.getState().update(s => switchGym(s, 'gym'), false))
    expect(useStore.getState().S.dumbbells.kg.weights).toEqual([8, 16])
  } finally { act(() => root.unmount()); host.remove(); useUI.setState({ sheets: [] }) }
})
it('edits an actual machine stack in IronLog exercise detail and clears it without losing metadata', () => {
  const ex = EXDB.find(e => e.eq === 'cable' && /row/.test(e.n))
  const S = structuredClone(DEF)
  S.stackWeights = { [ex.id]: { unit: 'kg', weights: [5], _ts: 1, custom: 'keep' } }
  useStore.setState({ S, user: null }); useUI.setState({ sheets: [] }); bindUI(useUI)
  const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host)
  try {
    act(() => root.render(<Modals />)); act(() => exerciseDetailSheet(ex))
    const editor = document.querySelector('[data-machine-stack]'); expect(editor).toBeTruthy()
    const field = editor.querySelector('input[aria-label="Weight stack: Weight (kg)"]')
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, '11.3'); field.dispatchEvent(new Event('input', { bubbles: true })) })
    act(() => [...editor.querySelectorAll('button')].find(x => x.textContent === 'Add').click())
    expect(ownedWeightsFor(useStore.getState().S, { id: ex.id })).toEqual([5, 11.3])
    act(() => [...editor.querySelectorAll('button')].find(x => x.textContent === 'Clear the list').click())
    expect(useStore.getState().S.stackWeights[ex.id].custom).toBe('keep')
    expect(ownedWeightsFor(useStore.getState().S, { id: ex.id })).toBeNull()
  } finally { act(() => root.unmount()); host.remove(); useUI.setState({ sheets: [] }) }
})
