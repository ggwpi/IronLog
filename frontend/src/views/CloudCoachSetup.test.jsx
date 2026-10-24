// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import CloudCoachSetup from './CloudCoachSetup.jsx'
import { _setLangState } from '../lib/i18n-core.js'
import he from '../locales/he.js'
const mock = vi.hoisted(() => ({
  nav: vi.fn(),
  toast: vi.fn(),
  refreshConfig: vi.fn(),
  requests: [],
  saved: {},
  modelsOK: true,
  saveOK: true,
}))
vi.mock('react-router-dom', () => ({ useNavigate: () => mock.nav }))
vi.mock('../store/useStore.js', () => ({
  useStore: (f) =>
    f({
      ready: true,
      user: { id: 'alice' },
      refreshConfig: mock.refreshConfig,
    }),
}))
vi.mock('../store/useUI.js', () => ({ useUI: (f) => f({ toast: mock.toast }) }))
vi.mock('../components/CoachConsentSheet.jsx', () => ({
  AiConsentSection: () => null,
}))
vi.mock('../lib/api.js', () => ({
  api: async (path, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null
    mock.requests.push({ path, method: options.method || 'GET', body })
    if (path.endsWith('/models'))
      return mock.modelsOK
        ? { ok: true, models: ['real-model-from-provider'] }
        : { ok: false, error: 'API key rejected', code: 'auth' }
    if (options.method === 'POST') {
      if (!mock.saveOK) throw new Error('Could not save')
      return { ...body, apiKey: undefined, connected: true, hasKey: true }
    }
    if (options.method === 'DELETE') return { ok: true }
    return mock.saved
  },
}))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root
beforeEach(() => {
  _setLangState('en', null, null, null)
  mock.requests = []
  mock.saved = {}
  mock.modelsOK = true
  mock.saveOK = true
  mock.nav.mockReset()
  mock.toast.mockReset()
  mock.refreshConfig.mockReset().mockResolvedValue(undefined)
  localStorage.clear()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  _setLangState('en', null, null, null)
})
const mount = () =>
  act(async () => {
    root.render(<CloudCoachSetup />)
    await new Promise((r) => setTimeout(r, 0))
  })
const btn = (name) =>
  [...host.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === name
  )
const click = (el) =>
  act(async () => {
    expect(el).toBeTruthy()
    el.click()
    await new Promise((r) => setTimeout(r, 0))
  })
const type = (el, value, event = 'input') =>
  act(() => {
    Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(
      el,
      value
    )
    el.dispatchEvent(new Event(event, { bubbles: true }))
  })
describe('Cloud Coach personal provider setup', () => {
  it('lists models, saves the personal key through the API, refreshes availability and opens Coach', async () => {
    await mount()
    await click(btn('OpenAI API'))
    type(host.querySelector('input[type=password]'), 'not-a-real-key')
    await click(btn('List models'))
    const modelsRequest = mock.requests.at(-1)
    expect(modelsRequest).toMatchObject({
      path: '/api/coach/models',
      body: { provider: 'openai', apiKey: 'not-a-real-key' },
    })
    type(host.querySelector('select'), 'real-model-from-provider', 'change')
    await click(btn('Save and use the Coach'))
    expect(mock.requests.at(-1)).toMatchObject({
      path: '/api/coach/settings',
      method: 'POST',
      body: {
        provider: 'openai',
        model: 'real-model-from-provider',
        apiKey: 'not-a-real-key',
      },
    })
    expect(mock.refreshConfig).toHaveBeenCalled()
    expect(mock.nav).toHaveBeenCalledWith('/coach')
    expect(host.querySelector('input[type=password]').value).toBe('')
    expect(JSON.stringify({ ...localStorage })).not.toContain('not-a-real-key')
  })
  it('uses an existing write-only saved key and removes stale models after a provider change', async () => {
    mock.saved = {
      provider: 'openai',
      baseUrl: 'https://api.openai.com',
      model: 'real-model-from-provider',
      hasKey: true,
      connected: true,
    }
    await mount()
    await click(btn('List models'))
    expect(mock.requests.at(-1).body).not.toHaveProperty('apiKey')
    expect(host.querySelector('select')).toBeTruthy()
    await click(btn('Google Gemini'))
    expect(host.querySelector('select')).toBeNull()
    expect(host.querySelector('input[type=password]').value).toBe('')
    expect(btn('List models').disabled).toBe(true)
  })
  it('keeps the screen usable after provider rejection and does not offer saving an unlisted model', async () => {
    mock.modelsOK = false
    await mount()
    type(host.querySelector('input[type=password]'), 'bad-key')
    await click(btn('List models'))
    expect(mock.toast).toHaveBeenCalledWith(
      expect.stringContaining('Your AI provider rejected the key')
    )
    expect(btn('List models').disabled).toBe(false)
    expect(btn('Save and use the Coach')).toBeUndefined()
  })
  it('disconnects the cloud account and refreshes the feature gate', async () => {
    mock.saved = {
      provider: 'openai',
      model: 'some-model',
      hasKey: true,
      connected: true,
    }
    await mount()
    const row = [...host.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Disconnect')
    )
    await click(row)
    expect(mock.requests.at(-1)).toMatchObject({
      path: '/api/coach/settings',
      method: 'DELETE',
    })
    expect(mock.refreshConfig).toHaveBeenCalled()
    expect(host.textContent).not.toContain('Open the Coach')
  })
  it('uses the Hebrew locale for cloud security and billing disclosures', async () => {
    _setLangState('he', he, null, null)
    await mount()
    expect(host.textContent).toContain('מפתח ה־API שלך נשמר מוצפן בשרת')
    expect(host.textContent).toContain('מחויבות בחשבון שלך אצל ספק ה־AI')
    expect(host.textContent).not.toContain('Your API key is encrypted')
  })
})

it('refreshes capabilities before opening a provider connected from another device', async () => {
  mock.saved = {
    provider: 'openai',
    model: 'some-model',
    connected: true,
    hasKey: true,
  }
  await mount()
  const row = [...host.querySelectorAll('button')].find((b) =>
    b.textContent.includes('Open the Coach')
  )
  await click(row)
  expect(mock.refreshConfig).toHaveBeenCalled()
  expect(mock.nav).toHaveBeenCalledWith('/coach')
  expect(mock.refreshConfig.mock.invocationCallOrder[0]).toBeLessThan(
    mock.nav.mock.invocationCallOrder[0]
  )
})
