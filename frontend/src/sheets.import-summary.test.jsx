// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { importFromApp } from './sheets.jsx'
import { fmtDateRange } from './lib/format.js'

// The import summary's date range said "Sun, 3 Feb – Sun, 21 Dec" for a history that ran over
// two years: without the year, a span across a new year read as a few months.
const HEAD = 'Date,Exercise,Weight,Reps'
const csv = (...days) => [HEAD, ...days.map(d => `${d},Bench Press,60,5`)].join('\n')
let root, host

async function summaryFor(text) {
  const file = new File([text], 'export.csv', { type: 'text/csv' })
  importFromApp(file)
  for (let i = 0; i < 50 && !useUI.getState().sheets.length; i++) await new Promise(r => setTimeout(r, 5))
  const sheet = useUI.getState().sheets.at(-1)
  expect(sheet).toBeTruthy()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(sheet.render(() => {})))
  return host.querySelector('.muted.small').textContent
}

describe('the import summary’s dates', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    useUI.setState({ sheets: [], toasts: [] })
    useStore.setState(s => ({ S: { ...s.S, unit: 'kg', workouts: [], bodyweight: [] } }))
  })
  afterEach(() => { if (root) act(() => root.unmount()); root = null; document.body.innerHTML = '' })

  it('carry the year when the history spans two years', async () => {
    const text = await summaryFor(csv('2025-02-03', '2026-01-21'))
    expect(text).toContain('2025')
    expect(text).toContain('2026')
  })

  it('carry the year for a range that is not this year', () => {
    const now = new Date('2026-09-28T12:00:00')
    expect(fmtDateRange('2024-03-01', '2024-05-01', false, now)).toContain('2024')
    expect(fmtDateRange('2026-03-01', '2026-05-01', false, now)).not.toContain('2026')
    expect(fmtDateRange('2026-03-01', '2026-03-01', false, now)).not.toContain('–')
  })
})

// QA 10-06: the summary never said how many rows it had left out, and every count read "1 workouts
// imported", "1 sets bring an RPE".
describe('the import summary’s counts', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    useUI.setState({ sheets: [], toasts: [], toastMsg: '' })
    useStore.setState(s => ({ S: { ...s.S, unit: 'kg', workouts: [], bodyweight: [], wc: { ...s.S.wc, effort: 'rpe' } } }))
  })
  afterEach(() => { if (root) act(() => root.unmount()); root = null; document.body.innerHTML = '' })
  const lines = () => [...host.querySelectorAll('.small.dim')].map(d => d.textContent)

  it('offers an additional timed reading on a day already stored and previews without mutation', async () => {
    useStore.setState(s => ({ S: { ...s.S, weighInTimes: true, bodyweight: [{ d: '2026-10-01', w: 80, t: 100, ins: [{ id: 'am', at: '07:00', w: 80, t: 100, future: 'keep' }] }] } }))
    const before = structuredClone(useStore.getState().S)
    await summaryFor('date,weight_kg\n2026-10-01T07:00,80\n2026-10-01T19:00,82')
    expect(useStore.getState().S).toEqual(before)
    const importBtn = [...host.querySelectorAll('button')].find(b => b.textContent === 'Import')
    expect(importBtn.disabled).toBe(false)
    act(() => importBtn.click())
    expect(useStore.getState().S.bodyweight[0].ins.map(r => r.w)).toEqual([80, 82])
    expect(useStore.getState().S.bodyweight[0].ins[0].future).toBe('keep')
    expect(useUI.getState().toastMsg).toBe('1 weigh-in imported')
  })
  it('accepts a measurement-only own export without requiring a weight or rewriting existing measurement days', async () => {
    useStore.setState(s => ({ S: { ...s.S, customMeasurements: [], measurements: [{ d: '2026-10-01', waist: 99, future: 'keep', other: [] }] } }))
    const before = structuredClone(useStore.getState().S)
    await summaryFor('date,weight_kg,waist_cm\n2026-10-01,,85\n2026-10-02,,86')
    expect(useStore.getState().S).toEqual(before)
    const importBtn = [...host.querySelectorAll('button')].find(b => b.textContent === 'Import')
    expect(importBtn.disabled).toBe(false)
    act(() => importBtn.click())
    expect(useStore.getState().S.measurements[0]).toEqual(before.measurements[0])
    expect(useStore.getState().S.measurements[1]).toMatchObject({ d: '2026-10-02', waist: 86 })
    expect(useUI.getState().toastMsg).toBe('1 measurement')
  })

  it('says how many rows were skipped, singular and plural, and nothing when none were', async () => {
    await summaryFor([HEAD, '2026-01-02,Bench Press,60,5', 'not a date,Bench Press,60,5'].join('\n'))
    expect(lines()).toContain('1 row skipped (couldn’t read it)')
    act(() => root.unmount()); document.body.innerHTML = ''; useUI.setState({ sheets: [] })
    await summaryFor([HEAD, '2026-01-02,Bench Press,60,5', 'nope,Bench Press,60,5', '2026-01-03,,60,5'].join('\n'))
    expect(lines()).toContain('2 rows skipped (couldn’t read them)')
    act(() => root.unmount()); document.body.innerHTML = ''; useUI.setState({ sheets: [] })
    await summaryFor(csv('2026-01-02'))
    expect(lines().some(l => /skipped/.test(l))).toBe(false)
  })

  it('counts one workout and one rated set in the singular', async () => {
    await summaryFor(['Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Seconds,RPE', '2026-01-02 10:00:00,Push,Bench Press (Barbell),1,60,5,0,8'].join('\n'))
    expect(lines().join(' ')).toMatch(/\b1 set brings an RPE with it\./)
    const importBtn = [...host.querySelectorAll('button')].find(b => b.textContent === 'Import')
    act(() => importBtn.click())
    expect(useUI.getState().toastMsg).toBe('1 workout imported')
  })
})
