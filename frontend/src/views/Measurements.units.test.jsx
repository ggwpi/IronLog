// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DEF, useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import Measurements, { measurementLogSheet, manageMeasurementsSheet } from './Measurements.jsx'
import { toMeasurementDisplay } from '../lib/measurements.js'
let host, root
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-20T12:00:00') })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [] })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers() })
const click = label => act(() => [...host.querySelectorAll('button,.menu-item')].find(b => b.textContent === label || b.querySelector('.tt')?.textContent === label).click())
function renderTop() {
  const sheet = useUI.getState().sheets.at(-1)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
}
function input(selector, value) {
  const element = host.querySelector(selector)
  act(() => {
    Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value').set.call(element, String(value))
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
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
it.each([[120, '', 65, 'both numbers'], [70, 80, 65, 'higher one'], [300, 80, 65, 'pressure looks off'], [120, 80, 250, 'pulse looks off']])('uses original paired/range validation for %s/%s and pulse %s without writing', (sys, dia, pulse, message) => {
  const S = { ...structuredClone(DEF), unit: 'lb', measurementEnabled: ['pair:bp'], measurements: [], customMeasurements: [] }
  useStore.setState({ S, user: null }); measurementLogSheet(); renderTop()
  input('input[aria-label="Systolic"]', sys)
  input('input[aria-label="Diastolic"]', dia)
  input('input[aria-label="Resting pulse"]', pulse)
  click('Save')
  expect(useStore.getState().S).toEqual(S)
  expect(useUI.getState().toastMsg).toContain(message)
})
it('saves the original BP/pulse values under lb, retains the pair flag and displays both traces through IronLog charts', () => {
  const S = { ...structuredClone(DEF), unit: 'lb', measurementEnabled: ['pair:bp'], measurements: [], customMeasurements: [] }
  useStore.setState({ S, user: null }); measurementLogSheet(); renderTop()
  input('input[aria-label="Systolic"]', 125)
  input('input[aria-label="Diastolic"]', 85)
  input('input[aria-label="Resting pulse"]', 65)
  click('Save')
  const after = useStore.getState().S
  expect(after.measurements[0]).toMatchObject({ bpSys: 125, bpDia: 85, pulse: 65 })
  expect(after.measurementEnabled).toEqual(['pair:bp'])
  act(() => root.render(<MemoryRouter><Measurements /></MemoryRouter>))
  const card = host.querySelector('[data-blood-pressure]')
  expect(card.textContent).toContain('125/85')
  expect(card.querySelector('bdi').dir).toBe('ltr')
  expect(card.textContent).toContain('65 bpm')
  expect(card.querySelectorAll('.chart svg').length).toBe(2)
})
it('keeps an open form in the length unit it displayed while another device changes the preference', () => {
  const S = { ...structuredClone(DEF), unit: 'lb', measureUnit: 'cm', measurementEnabled: ['waist'], customMeasurements: [], measurements: [{ d: '2026-10-01', waist: 85, t: 100, other: [] }] }
  useStore.setState({ S, user: null }); measurementLogSheet('2026-10-01'); renderTop()
  expect(host.querySelector('.measure-field i').textContent).toBe('cm')
  act(() => useStore.getState().update(s => { s.measureUnit = 'in' }))
  expect(host.querySelector('.measure-field i').textContent).toBe('cm')
  input('.measure-field input', 86)
  click('Save')
  expect(useStore.getState().S.measurements[0].waist).toBe(86)
  expect(useStore.getState().S.measureUnit).toBe('in')
})
it('offers only original compatible units for a populated field and changes display without converting its stored value', () => {
  const S = { ...structuredClone(DEF), unit: 'kg', measurementEnabled: [], customMeasurements: [{ id: 'mass', name: 'Mass', unit: 'kg', enabled: true }], measurements: [{ d: '2026-10-01', t: 100, future: 'keep', other: [{ id: 'mass', unit: 'kg', name: 'Mass', value: 12.345 }] }] }
  useStore.setState({ S, user: null }); manageMeasurementsSheet(); renderTop()
  click('kg'); renderTop()
  const labels = [...host.querySelectorAll('.menu-item .tt')].map(e => e.textContent)
  expect(labels).toEqual(['kg', 'lb'])
  click('lb')
  expect(useStore.getState().S.customMeasurements[0].unit).toBe('lb')
  expect(useStore.getState().S.measurements[0]).toMatchObject({ future: 'keep', other: [{ id: 'mass', unit: 'kg', value: 12.345 }] })
})
it('keeps a typed field in its displayed unit while its preference changes on another device', () => {
  const S = { ...structuredClone(DEF), measurementEnabled: [], customMeasurements: [{ id: 'mass', name: 'Mass', unit: 'kg', enabled: true }], measurements: [{ d: '2026-10-01', t: 100, other: [{ id: 'mass', name: 'Mass', unit: 'kg', value: 12.345 }] }] }
  useStore.setState({ S, user: null }); measurementLogSheet('2026-10-01'); renderTop()
  act(() => useStore.getState().update(s => { s.customMeasurements[0].unit = 'lb' }))
  expect(host.querySelector('.measure-field i').textContent).toBe('kg')
  input('.measure-field input', 13)
  click('Save')
  expect(useStore.getState().S.measurements[0].other[0]).toMatchObject({ unit: 'kg', value: 13 })
  expect(useStore.getState().S.customMeasurements[0].unit).toBe('lb')
})
it('uses the original 500-character note boundary and retains unrelated raw BP precision on a no-op save', () => {
  const S = { ...structuredClone(DEF), measurementEnabled: ['pair:bp'], customMeasurements: [], measurements: [{ d: '2026-10-01', t: 100, bpSys: 120.6, bpDia: 80.2, pulse: 65.2, future: 'keep', other: [] }] }
  useStore.setState({ S, user: null }); measurementLogSheet('2026-10-01'); renderTop()
  const area = host.querySelector('textarea')
  expect(area.maxLength).toBe(500)
  expect(area.dir).toBe('auto')
  input('textarea', 'א'.repeat(600))
  click('Save')
  expect(useStore.getState().S.measurements[0]).toMatchObject({ bpSys: 120.6, bpDia: 80.2, pulse: 65.2, future: 'keep', note: 'א'.repeat(500) })
})
