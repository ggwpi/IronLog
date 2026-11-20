// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, it, expect } from 'vitest'
import { DEF, useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { measurementLogSheet } from './Measurements.jsx'
import { toMeasurementDisplay } from '../lib/measurements.js'
let host, root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [] })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
it('keeps untouched canonical centimetres when an lb profile displays rounded inches', () => {
  const S = { ...structuredClone(DEF), unit: 'lb', measurementEnabled: ['waist'], customMeasurements: [],
    measurements: [{ d: '2026-10-01', t: 100, waist: 85, future: 'keep', other: [] }] }
  useStore.setState({ S, user: null }); measurementLogSheet('2026-10-01')
  const sheet = useUI.getState().sheets.at(-1)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  expect(Number(host.querySelector('.measure-field input').value)).toBe(33.5)
  act(() => [...host.querySelectorAll('button')].find(b => b.textContent === 'Save').click())
  expect(useStore.getState().S.measurements[0]).toMatchObject({ waist: 85, future: 'keep' })
})
it.each([['%', 0], ['kg', 12.345], ['none', 0]])('keeps a %s reading in its original unit under an lb profile', (unit, value) => {
  const S = { ...structuredClone(DEF), unit: 'lb', measurementEnabled: [],
    customMeasurements: [{ id: 'typed', name: 'Ratio', unit, enabled: true, future: 'keep' }],
    measurements: [{ d: '2026-10-01', t: 100, future: 'keep', note: 'א'.repeat(500), other: [{ id: 'typed', name: 'Ratio', unit, value, future: { media: 'keep' } }] }] }
  useStore.setState({ S, user: null })
  measurementLogSheet('2026-10-01')
  const sheet = useUI.getState().sheets.at(-1)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  expect(host.querySelector('.measure-field i').textContent).toBe(unit === 'none' ? '' : unit)
  expect(Number(host.querySelector('.measure-field input').value)).toBe(toMeasurementDisplay(value, 'lb', { unit }))
  act(() => [...host.querySelectorAll('button')].find(b => b.textContent === 'Save').click())
  const after = useStore.getState().S
  expect(after.measurements[0]).toMatchObject({ future: 'keep', note: S.measurements[0].note,
    other: [{ id: 'typed', unit, value, future: { media: 'keep' } }] })
  expect(after.customMeasurements[0]).toEqual(S.customMeasurements[0])
})
