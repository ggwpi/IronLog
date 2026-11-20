// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEF, useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { CsvExportSheet, saveCSV } from './CsvExportSheet.jsx'
import { parseCSV } from '../lib/import-csv.js'

const mocks = vi.hoisted(() => ({ mobile: false, share: vi.fn() }))
vi.mock('../lib/mobile.js', async original => ({ ...await original(), get MOBILE() { return mocks.mobile }, shareExport: mocks.share }))

let host, root, blobs, downloads, close, saved
const button = text => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text)
const date = (label, value) => {
  const el = host.querySelector(`input[aria-label="${label}"]`)
  Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-20T12:00:00'))
  mocks.mobile = false; mocks.share.mockReset(); blobs = []; downloads = []; close = vi.fn()
  const OriginalURL = globalThis.URL
  vi.stubGlobal('URL', class extends OriginalURL {
    static createObjectURL(blob) { blobs.push(blob); return 'blob:csv-fixture' }
    static revokeObjectURL = vi.fn()
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { downloads.push(this.download) })
  const S = { ...structuredClone(DEF), workouts: [{ id: 'kept', d: '2026-10-01', start: new Date('2026-10-01T18:00:00').getTime(), name: 'Fixture', entries: [{ id: '0025', sets: [{ w: 60, r: 8, done: true, tag: 'blue', note: 'keep me' }] }] }],
    bodyweight: [{ d: '2026-10-01', w: 80 }], measurements: [{ d: '2026-10-01', waist: 85 }], active: { id: 'local-draft' }, mediaPending: ['owed-file'] }
  saved = structuredClone(S)
  useStore.setState({ S, user: null })
  useUI.setState({ sheets: [], toastMsg: '' })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  act(() => root.render(<CsvExportSheet close={close} />))
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('CSV through original IronLog controls', () => {
  it('uses original inclusive four-week and three-month ranges without changing profile data', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    act(() => button('4 weeks').click())
    expect(host.querySelector('[data-csv-count="workouts"]').textContent).toContain('0 workouts')
    expect(host.querySelector('[data-csv-count="body"]').textContent).toContain('0 weigh-ins')
    act(() => button('3 months').click())
    expect(host.querySelector('[data-csv-count="workouts"]').textContent).toContain('1 workout')
    expect(host.querySelector('[data-csv-count="body"]').textContent).toContain('1 weigh-in')
    await act(async () => button('Workouts (CSV)').click())
    expect(parseCSV(await blobs[0].text())).toHaveLength(2)
    expect(useStore.getState().S).toEqual(saved)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('keeps legacy open-ended custom dates and ignores an inverted draft when a preset is selected', () => {
    act(() => button('Custom').click())
    expect(host.querySelector('[data-csv-count="workouts"]').textContent).toContain('1 workout')
    act(() => { date('From', '2026-11-10'); date('To', '2026-11-01') })
    expect(button('Workouts (CSV)').disabled).toBe(true)
    act(() => button('3 months').click())
    expect(button('Workouts (CSV)').disabled).toBe(false)
    act(() => button('All').click())
    expect(host.querySelector('[data-csv-count="workouts"]').textContent).toContain('1 workout')
    expect(useStore.getState().S).toEqual(saved)
  })
  it('downloads original workout CSV with an IronLog filename and never updates stored state', async () => {
    expect(host.querySelector('[data-csv-count="workouts"]').textContent).toContain('1 workout')
    await act(async () => button('Workouts (CSV)').click())
    expect(downloads[0]).toMatch(/^ironlog-workouts-.*\.csv$/)
    const rows = parseCSV(await blobs[0].text())
    expect(rows[1][rows[0].indexOf('set_color')]).toBe('blue')
    expect(rows[1][rows[0].indexOf('set_note')]).toBe('keep me')
    expect(blobs[0].type).toBe('text/csv;charset=utf-8')
    expect(close).toHaveBeenCalledOnce()
    expect(useStore.getState().S).toEqual(saved)
  })
  it('exports the original canonical body CSV independently of workout counts', async () => {
    await act(async () => button('Body weight & measurements (CSV)').click())
    expect(downloads[0]).toMatch(/^ironlog-body-.*\.csv$/)
    expect(parseCSV(await blobs[0].text())).toEqual([['date', 'weight_kg', 'waist_cm'], ['2026-10-01', '80', '85']])
    expect(useStore.getState().S).toEqual(saved)
  })
  it('filters output with existing date fields and prevents inverted ranges', async () => {
    act(() => button('Custom').click())
    act(() => { date('From', '2026-10-02'); date('To', '2026-10-03') })
    expect(host.querySelector('[data-csv-count="workouts"]').textContent).toContain('0 workouts')
    await act(async () => button('Workouts (CSV)').click())
    expect(parseCSV(await blobs[0].text())).toHaveLength(1)
    act(() => date('From', '2026-10-04'))
    expect(button('Workouts (CSV)').disabled).toBe(true)
    expect(button('Body weight & measurements (CSV)').disabled).toBe(true)
    expect(useStore.getState().S).toEqual(saved)
  })
  it('reads the current unsynced store when tapped rather than a captured initial snapshot', async () => {
    const updated = structuredClone(saved); updated.workouts[0].entries[0].sets[0].w = 77.5
    act(() => useStore.setState({ S: updated }))
    await act(async () => button('Workouts (CSV)').click())
    const rows = parseCSV(await blobs[0].text())
    expect(rows[1][rows[0].indexOf('weight')]).toBe('77.5')
    expect(useStore.getState().S).toEqual(updated)
  })
  it('uses the existing mobile share boundary without constructing browser download URLs', async () => {
    mocks.mobile = true
    await saveCSV('fixture CSV', 'ironlog-workouts-fixture.csv')
    expect(mocks.share).toHaveBeenCalledWith('fixture CSV', 'ironlog-workouts-fixture.csv')
    expect(blobs).toEqual([])
    expect(downloads).toEqual([])
  })
})
