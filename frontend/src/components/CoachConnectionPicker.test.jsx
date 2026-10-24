// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import CoachConnectionPicker from './CoachConnectionPicker.jsx'
import { coachChoice, setCoachChoice } from '../lib/coach-choice.js'
const mock = vi.hoisted(() => ({
  calls: [],
  nav: vi.fn(),
  toast: vi.fn(),
  selecting: vi.fn(),
  fail: false,
}))
const saved = [
  {
    id: 'a',
    name: 'API Alpha',
    provider: 'gemini',
    model: 'configured-model-a',
  },
  {
    id: 'b',
    name: 'API Beta',
    provider: 'gemini',
    model: 'configured-model-b',
  },
]
vi.mock('react-router-dom', () => ({ useNavigate: () => mock.nav }))
vi.mock('../store/useUI.js', async () => {
  const { create } = await import('zustand')
  let n = 0
  const useUI = create((set, get) => ({
    sheets: [],
    toast: (...args) => mock.toast(...args),
    openSheet(render) {
      const id = ++n
      set((s) => ({ sheets: [...s.sheets, { id, render }] }))
      return { close: () => get().closeSheet(id) }
    },
    closeSheet(id) {
      set((s) => ({ sheets: s.sheets.filter((x) => x.id !== id) }))
    },
  }))
  return { useUI }
})
const { useUI } = await import('../store/useUI.js')
function Sheets() {
  const sheets = useUI((s) => s.sheets)
  return (
    <>
      {sheets.map((s) => (
        <div key={s.id} className="sheet">
          {s.render(() => useUI.getState().closeSheet(s.id))}
        </div>
      ))}
    </>
  )
}
vi.mock('../lib/api.js', () => ({
  api: async (path, opts = {}) => {
    const body = opts.body ? JSON.parse(opts.body) : null
    mock.calls.push({ path, body })
    if (path.endsWith('/connections'))
      return { connections: saved, activeId: 'a', model: 'configured-model-a' }
    if (mock.fail) throw new Error('Could not connect')
    return {
      id: body.connectionId,
      model: saved.find((c) => c.id === body.connectionId).model,
    }
  },
}))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root
const tick = () => new Promise((r) => setTimeout(r, 0))
beforeEach(() => {
  setCoachChoice('picker-user', {})
  useUI.setState({ sheets: [] })
  mock.calls = []
  mock.fail = false
  mock.selecting.mockReset()
  mock.nav.mockReset()
  mock.toast.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
})
const mount = (disabled = false) =>
  act(async () => {
    root.render(
      <>
        <CoachConnectionPicker userId="picker-user" disabled={disabled} onSelecting={mock.selecting} />
        <Sheets />
      </>
    )
    await tick()
  })
const click = (el) =>
  act(async () => {
    expect(el).toBeTruthy()
    el.click()
    await tick()
  })
const row = (name) =>
  [...host.querySelectorAll('button')].find((b) => b.textContent.includes(name))
it('uses an icon and shared sliding selector for named connections, not model editing', async () => {
  await mount()
  expect(host.textContent).not.toContain('API Alpha')
  const trigger = host.querySelector('[aria-label="AI connection"]')
  expect(trigger.textContent).toBe('')
  expect(trigger.querySelector('svg')).toBeTruthy()
  await click(trigger)
  expect(useUI.getState().sheets).toHaveLength(1)
  expect(host.querySelector('.sheet').textContent).toContain(
    'configured-model-b'
  )
  expect(host.querySelectorAll('select')).toHaveLength(0)
  await click(row('API Beta'))
  expect(useUI.getState().sheets).toHaveLength(0)
  expect(coachChoice('picker-user')).toEqual({
    connectionId: 'b',
    model: 'configured-model-b',
  })
  expect(mock.calls.at(-1)).toEqual({
    path: '/api/coach/selection',
    body: { accountId: 'picker-user', connectionId: 'b' },
  })
  expect(mock.calls.some((c) => c.path.endsWith('/models'))).toBe(false)
  expect(mock.selecting.mock.calls).toEqual([[true], [false]])
})
it('takes the configured model from Settings over stale chat model choices', async () => {
  setCoachChoice('picker-user', {
    connectionId: 'b',
    model: 'stale-chat-model',
  })
  await mount()
  expect(coachChoice('picker-user')).toEqual({
    connectionId: 'b',
    model: 'configured-model-b',
  })
})
it('disables switching during a request and scopes choices to the signed-in account', async () => {
  setCoachChoice('other-user', {
    connectionId: 'private',
    model: 'other-model',
  })
  await mount(true)
  expect(host.querySelector('[aria-label="AI connection"]').disabled).toBe(true)
  expect(coachChoice('picker-user').connectionId).toBe('a')
  expect(host.textContent).not.toContain('other-model')
})
it('keeps the current connection if switching fails', async () => {
  await mount()
  await click(host.querySelector('[aria-label="AI connection"]'))
  mock.fail = true
  await click(row('API Beta'))
  expect(coachChoice('picker-user').connectionId).toBe('a')
  expect(mock.toast).toHaveBeenCalled()
})
it('closes the menu and opens settings to change a connection model', async () => {
  await mount()
  await click(host.querySelector('[aria-label="AI connection"]'))
  await click(row('Manage AI connections'))
  expect(useUI.getState().sheets).toHaveLength(0)
  expect(mock.nav).toHaveBeenCalledWith('/coach/setup')
})
