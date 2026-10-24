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
  delayA: null,
}))
const saved = [
  {
    id: 'a',
    name: 'API Alpha',
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'model-a',
    revision: 0,
  },
  {
    id: 'b',
    name: 'API Beta',
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'model-b',
    revision: 0,
  },
]
vi.mock('react-router-dom', () => ({ useNavigate: () => mock.nav }))
vi.mock('../store/useUI.js', () => ({ useUI: (f) => f({ toast: mock.toast }) }))
vi.mock('../lib/api.js', () => ({
  api: async (path, opts = {}) => {
    const body = opts.body ? JSON.parse(opts.body) : null
    mock.calls.push({ path, body })
    if (path.endsWith('/connections'))
      return { connections: saved, activeId: 'a', model: 'model-a' }
    if (path.endsWith('/models')) {
      if (body.connectionId === 'a' && mock.delayA) await mock.delayA
      return {
        ok: true,
        models:
          body.connectionId === 'a'
            ? ['model-a', 'alternate-a']
            : ['model-b', 'alternate-b'],
      }
    }
    return {
      id: body.connectionId,
      model: body.model || saved.find((c) => c.id === body.connectionId).model,
    }
  },
}))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root
const tick = () => new Promise((r) => setTimeout(r, 0))
beforeEach(() => {
  setCoachChoice('picker-user', {})
  mock.calls = []
  mock.delayA = null
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
const mount = (disabled) =>
  act(async () => {
    root.render(
      <CoachConnectionPicker userId="picker-user" disabled={disabled} />
    )
    await tick()
    await tick()
  })
const select = (label, value) =>
  act(async () => {
    const el = host.querySelector(`[aria-label="${label}"]`)
    Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(
      el,
      value
    )
    el.dispatchEvent(new Event('change', { bubbles: true }))
    await tick()
    await tick()
  })
it('selects separately named keys of one provider and the model for the next message', async () => {
  await mount(false)
  expect(host.textContent).toContain('API Alpha')
  expect(host.textContent).toContain('API Beta')
  await select('AI connection', 'b')
  await select('Model', 'alternate-b')
  expect(coachChoice('picker-user')).toEqual({
    connectionId: 'b',
    model: 'alternate-b',
  })
  expect(
    mock.calls.filter((c) => c.path.endsWith('/selection')).at(-1).body
  ).toMatchObject({
    accountId: 'picker-user',
    connectionId: 'b',
    model: 'alternate-b',
  })
  expect(
    mock.calls.filter((c) => c.path.endsWith('/models')).at(-1).body
      .connectionId
  ).toBe('b')
})
it('ignores a late model list from a previously selected key', async () => {
  let release
  mock.delayA = new Promise((r) => {
    release = r
  })
  await mount(false)
  await select('AI connection', 'b')
  await act(async () => {
    release()
    await tick()
  })
  const el = host.querySelector('[aria-label="Model"]')
  expect(el.textContent).toContain('alternate-b')
  expect(el.textContent).not.toContain('alternate-a')
})
it('locks the selectors during an active request and keeps selections scoped to the signed-in account', async () => {
  setCoachChoice('somebody-else', {
    connectionId: 'other-private-id',
    model: 'other-model',
  })
  await mount(true)
  expect([...host.querySelectorAll('select')].every((s) => s.disabled)).toBe(
    true
  )
  expect(host.textContent).not.toContain('other-model')
  expect(coachChoice('picker-user').connectionId).toBe('a')
})
