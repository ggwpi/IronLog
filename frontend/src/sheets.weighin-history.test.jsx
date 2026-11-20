// @vitest-environment happy-dom
// Discord 'Weight': "click on the body weight log to see the weight history and weekly average".
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { bwSheet, weighInsSheet } from './sheets.jsx'
import { readingsOf } from './lib/weigh-ins.js'

const clone = v => JSON.parse(JSON.stringify(v))
const mounted = []
function mountTopSheet() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}
const button = (host, text) => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text)

// Two Monday-started weeks: 31 Aug – 6 Sep and 7 – 13 Sep 2026.
const LOG = [
  { d: '2026-09-01', w: 81, t: 1 }, { d: '2026-09-03', w: 80, t: 2 },
  { d: '2026-09-07', w: 80.5, t: 3 }, { d: '2026-09-09', w: 79.5, t: 4 }, { d: '2026-09-13', w: 79, t: 5 },
]
function install(extra = {}) {
  const S = clone(DEF)
  Object.assign(S, { unit: 'kg', bodyweight: clone(LOG), weekStart: 1, targetW: null }, extra)
  useStore.setState({ S, user: null })
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [] })
  document.body.innerHTML = ''
  install()
})
afterEach(() => { act(() => { mounted.splice(0).forEach(root => root.unmount()) }) })

describe('weigh-ins sheet', () => {
  it('keeps all timed readings visible and deletes/undoes only the selected one', () => {
    const bodyweight = [{ d: '2026-09-13', w: 80, t: 200, custom: 'keep', ins: [
      { id: 'am', at: '07:00', w: 80, t: 100, custom: 'keep', media: [{ hash: 'reading' }] }, { id: 'pm', at: '19:00', w: 82, t: 200 },
    ] }]
    install({ bodyweight })
    weighInsSheet()
    const list = mountTopSheet()
    expect(list.textContent).toContain('2 weigh-ins')
    expect(list.querySelectorAll('[data-reading]')).toHaveLength(2)
    expect(list.textContent).toContain('07:00'); expect(list.textContent).toContain('19:00')
    act(() => list.querySelector('[data-reading="am"] button[aria-label^="Delete weigh-in"]').click())
    const confirm = mountTopSheet()
    act(() => button(confirm, 'Delete').click())
    expect(useStore.getState().S.bodyweight[0].ins.map(r => r.id)).toEqual(['pm'])
    act(() => useUI.getState().toastAction.run())
    expect(useStore.getState().S.bodyweight[0].ins[0]).toMatchObject({ ...bodyweight[0].ins[0], t: expect.any(Number) })
    expect(useStore.getState().S.bodyweight[0].ins[0].t).toBeGreaterThan(200)
    expect(useStore.getState().S.bodyweight[0].custom).toBe('keep')
  })
  it('lists every weigh-in under its week, newest first, with the week\'s average and change', () => {
    weighInsSheet()
    const host = mountTopSheet()
    expect(host.querySelector('h3').textContent).toBe('Weigh-ins')
    expect(host.textContent).toContain('5 weigh-ins')
    expect(host.querySelector('.chart svg')).toBeTruthy()
    const weeks = [...host.querySelectorAll('[data-week]')]
    expect(weeks.map(w => w.dataset.week)).toEqual(['2026-09-07', '2026-08-31'])
    expect(weeks[0].textContent).toContain('Average 79.7 kg')
    expect(weeks[0].textContent).toContain('0.8')             // down from 80.5 the week before
    expect(weeks[1].textContent).toContain('Average 80.5 kg')
    expect(weeks[0].querySelectorAll('button[aria-label="Delete weigh-in"]')).toHaveLength(3)
    expect(weeks[1].querySelectorAll('button[aria-label="Delete weigh-in"]')).toHaveLength(2)
  })

  it('follows a Sunday week start', () => {
    install({ weekStart: 0 })
    weighInsSheet()
    expect([...mountTopSheet().querySelectorAll('[data-week]')].map(w => w.dataset.week)).toEqual(['2026-09-13', '2026-09-06', '2026-08-30'])
  })

  // The list is months of history scrolled on a phone: a stray tap on a trash button there must
  // not take a past weigh-in with it, so the list asks first.
  it('deletes a weigh-in from the list once that is confirmed', () => {
    weighInsSheet()
    const host = mountTopSheet()
    act(() => { host.querySelector('[data-week="2026-08-31"] button[aria-label="Delete weigh-in"]').click() })
    expect(useStore.getState().S.bodyweight).toHaveLength(5)
    expect(useUI.getState().sheets).toHaveLength(2)
    const ask = mountTopSheet()
    expect(ask.querySelector('h3').textContent).toBe('Delete weigh-in?')
    expect(ask.textContent).toContain('80 kg')
    act(() => { button(ask, 'Delete').click() })
    expect(useStore.getState().S.bodyweight.map(b => b.d)).toEqual(['2026-09-01', '2026-09-07', '2026-09-09', '2026-09-13'])
    expect(host.textContent).toContain('4 weigh-ins')
  })

  it('keeps the weigh-in when the question is cancelled', () => {
    weighInsSheet()
    const host = mountTopSheet()
    act(() => { host.querySelector('[data-week="2026-08-31"] button[aria-label="Delete weigh-in"]').click() })
    const ask = mountTopSheet()
    act(() => { button(ask, 'Cancel').click() })
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(useStore.getState().S.bodyweight).toHaveLength(5)
  })

  // The log sheet's recent three are the ones just typed: a typo there still goes in one tap.
  it('still deletes one of the log sheet\'s recent weigh-ins in one tap', () => {
    bwSheet()
    const log = mountTopSheet()
    act(() => { log.querySelector('button[aria-label="Delete weigh-in"]').click() })
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(useStore.getState().S.bodyweight).toHaveLength(4)
  })

  it('has an empty state', () => {
    install({ bodyweight: [] })
    weighInsSheet()
    const host = mountTopSheet()
    expect(host.querySelector('.empty')).toBeTruthy()
    expect(host.querySelector('.chart')).toBeNull()
  })

  it('is reached from the log sheet once there are more weigh-ins than its recent three', () => {
    bwSheet()
    const log = mountTopSheet()
    expect(log.querySelectorAll('button[aria-label="Delete weigh-in"]')).toHaveLength(3)
    const all = button(log, 'All weigh-ins')
    expect(all).toBeTruthy()
    act(() => { all.click() })
    expect(mountTopSheet().querySelector('h3').textContent).toBe('Weigh-ins')

    useUI.setState({ sheets: [] })
    install({ bodyweight: clone(LOG).slice(0, 2) })
    bwSheet()
    expect(button(mountTopSheet(), 'All weigh-ins')).toBeUndefined()
  })
})

// A weigh-in can be logged for an earlier day, the way measurements can.
describe('log sheet date', () => {
  const setDate = (host, value) => act(() => {
    const el = host.querySelector('input[type="date"]')
    Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })

  it('logs a weigh-in for an earlier day, in date order', () => {
    bwSheet()
    const log = mountTopSheet()
    setDate(log, '2026-09-05')
    act(() => { button(log, 'Save').click() })
    const bw = useStore.getState().S.bodyweight
    expect(bw.map(b => b.d)).toEqual(['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-07', '2026-09-09', '2026-09-13'])
    expect(bw.find(b => b.d === '2026-09-05')).toMatchObject({ w: 79 })
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('adds a timed reading to an existing day through the actual editor without replacing its first reading', () => {
    install({ weighInTimes: true, bodyweight: [{ d: '2026-09-13', w: 80, t: new Date('2026-09-13T07:00:00').getTime(), future: 'keep' }] })
    bwSheet()
    const log = mountTopSheet()
    setDate(log, '2026-09-13')
    const input = log.querySelector('input[type="time"]')
    expect(input.dir).toBe('ltr')
    act(() => {
      Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value').set.call(input, '19:00')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => button(log, '+1').click())
    act(() => button(log, 'Save').click())
    const day = useStore.getState().S.bodyweight[0]
    expect(day.w).toBe(80)
    expect(readingsOf(day).map(r => [r.at, r.w])).toEqual([['07:00', 80], ['19:00', 81]])
    expect(day.future).toBe('keep')
  })

  it('edits one reading while keeping the other reading and all metadata', () => {
    const bodyweight = [{ d: '2026-09-13', w: 80, t: 200, ins: [{ id: 'am', at: '07:00', w: 80, t: 100, future: 'keep' }, { id: 'pm', at: '19:00', w: 82, t: 200, media: [{ hash: 'keep' }] }] }]
    install({ bodyweight })
    bwSheet({ edit: { d: '2026-09-13', id: 'pm' } })
    const log = mountTopSheet()
    act(() => button(log, '+1').click())
    act(() => button(log, 'Save').click())
    const result = useStore.getState().S.bodyweight[0]
    expect(result.ins[0]).toEqual(bodyweight[0].ins[0])
    expect(result.ins[1]).toMatchObject({ ...bodyweight[0].ins[1], w: 83, t: expect.any(Number) })
    expect(result.w).toBe(80)
  })

  it('leaves an earlier day that already has a weigh-in as it is', () => {
    bwSheet()
    const log = mountTopSheet()
    setDate(log, '2026-09-03')
    act(() => { button(log, 'Save').click() })
    expect(useStore.getState().S.bodyweight).toEqual(LOG)
    expect(useUI.getState().toastMsg).toBe('That date already has a weigh-in. Delete it first.')
    expect(useUI.getState().sheets).toHaveLength(1)
  })

  it('does not take a day after today', () => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    bwSheet()
    const log = mountTopSheet()
    setDate(log, d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))
    act(() => { button(log, 'Save').click() })
    expect(useStore.getState().S.bodyweight).toEqual(LOG)
    expect(useUI.getState().toastMsg).toBe('Choose a valid date')
  })

  it('has no date on the weigh-in before a workout', () => {
    bwSheet({ required: true })
    expect(mountTopSheet().querySelector('input[type="date"]')).toBeNull()
  })
})
