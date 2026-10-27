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
  modelDelay: null,
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
vi.mock('../components/CoachConsentSheet.jsx', () => ({
  AiConsentSection: () => null,
}))
vi.mock('../lib/api.js', () => ({
  api: async (path, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null
    mock.requests.push({ path, method: options.method || 'GET', body })
    if (path.endsWith('/models')) {
      if (mock.modelDelay) await mock.modelDelay
      return mock.modelsOK
        ? { ok: true, models: ['real-model-from-provider'] }
        : { ok: false, error: 'API key rejected', code: 'auth' }
    }
    if (options.method === 'POST') {
      if (!mock.saveOK) throw new Error('Could not save')
      if (path.endsWith('/selection'))
        return {
          id: body.connectionId,
          model: body.model || 'real-model-from-provider',
        }
      return {
        ...body,
        id: body.id || 'new-connection',
        apiKey: undefined,
        connected: true,
        hasKey: true,
      }
    }
    if (options.method === 'DELETE') {
      mock.saved = {}
      return { ok: true }
    }
    return {
      connections: mock.saved.provider
        ? [{ id: 'saved-one', name: 'Saved API', ...mock.saved }]
        : [],
      activeId: mock.saved.provider ? 'saved-one' : null,
    }
  },
}))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root
beforeEach(() => {
  _setLangState('en', null, null, null)
  mock.requests = []
  mock.saved = {}
  mock.modelsOK = true
  mock.modelDelay = null
  mock.saveOK = true
  mock.nav.mockReset()
  mock.toast.mockReset()
  mock.refreshConfig.mockReset().mockResolvedValue(undefined)
  useUI.setState({ sheets: [] })
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
    root.render(
      <>
        <CloudCoachSetup />
        <Sheets />
      </>
    )
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
    expect(host.querySelector('input')).toBeNull()
    await click(btn('Add AI connection'))
    await click(btn('OpenAI API'))
    type(host.querySelector('[aria-label="Connection name"]'), 'My API')
    type(host.querySelector('input[type=password]'), 'not-a-real-key')
    await click(btn('Choose a model for this provider'))
    const modelsRequest = mock.requests.at(-1)
    expect(modelsRequest).toMatchObject({
      path: '/api/coach/models',
      body: { provider: 'openai', apiKey: 'not-a-real-key' },
    })
    await click(btn('real-model-from-provider'))
    await click(btn('Save changes'))
    expect(
      mock.requests.find(
        (r) => r.path === '/api/coach/connections' && r.method === 'POST'
      )
    ).toMatchObject({
      path: '/api/coach/connections',
      method: 'POST',
      body: {
        provider: 'openai',
        model: 'real-model-from-provider',
        apiKey: 'not-a-real-key',
      },
    })
    expect(mock.refreshConfig).toHaveBeenCalled()
    expect(mock.nav).not.toHaveBeenCalled()
    expect(useUI.getState().sheets).toHaveLength(0)
    expect(host.querySelector('input[type=password]')).toBeNull()
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
    await click(
      [...host.querySelectorAll('button')].find((b) =>
        b.textContent.includes('Saved API')
      )
    )
    await click(btn('Choose a model for this provider'))
    expect(mock.requests.at(-1).body).not.toHaveProperty('apiKey')
    await click(btn('real-model-from-provider'))
    expect(host.querySelector('.coach-selected-model').textContent).toContain(
      'real-model-from-provider'
    )
    await click(btn('Google Gemini'))
    expect(host.querySelector('.coach-selected-model')).toBeNull()
    expect(host.querySelector('input[type=password]').value).toBe('')
    expect(btn('Choose a model for this provider').disabled).toBe(true)
  })
  it('keeps the screen usable after provider rejection and does not offer saving an unlisted model', async () => {
    mock.modelsOK = false
    await mount()
    await click(btn('Add AI connection'))
    type(host.querySelector('input[type=password]'), 'bad-key')
    await click(btn('Choose a model for this provider'))
    expect(mock.toast).toHaveBeenCalledWith(
      expect.stringContaining('Your AI provider rejected the key')
    )
    expect(btn('Choose a model for this provider').disabled).toBe(false)
    expect(btn('Save changes').disabled).toBe(true)
  })
  it('disconnects the cloud account and refreshes the feature gate', async () => {
    mock.saved = {
      provider: 'openai',
      model: 'some-model',
      hasKey: true,
      connected: true,
    }
    await mount()
    await click(
      [...host.querySelectorAll('button')].find((b) =>
        b.textContent.includes('Saved API')
      )
    )
    const row = [...host.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Delete AI connection')
    )
    await click(row)
    expect(mock.requests.find((r) => r.method === 'DELETE')).toMatchObject({
      path: '/api/coach/connections',
      method: 'DELETE',
    })
    expect(mock.refreshConfig).toHaveBeenCalled()
    expect(host.textContent).not.toContain('Open the Coach')
  })
  it('uses the Hebrew locale for cloud security and billing disclosures', async () => {
    _setLangState('he', he, null, null)
    await mount()
    await click(btn('הוספת חיבור AI'))
    expect(host.textContent).toContain('בחר מודל לספק')
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

it('opens an editor only on request, orders the fields and treats shared data as information', async () => {
  await mount()
  expect(useUI.getState().sheets).toHaveLength(0)
  await click(btn('Add AI connection'))
  const sheet = host.querySelector('.sheet')
  expect(
    [...sheet.querySelectorAll('.sect-t')].map((x) => x.textContent).slice(0, 3)
  ).toEqual(['Connection name', 'Provider', 'API key'])
  const info = sheet.querySelector('aside')
  expect(info.querySelectorAll('dt').length).toBeGreaterThan(0)
  expect(info.querySelector('button,input')).toBeNull()
  const order = [...sheet.querySelectorAll('button,aside')]
  expect(order.indexOf(btn('Choose a model for this provider'))).toBeLessThan(
    order.indexOf(info)
  )
  type(sheet.querySelector('input[type=password]'), 'discarded-private-key')
  await click(sheet.querySelector('[aria-label="Close"]'))
  expect(host.querySelector('.sheet')).toBeNull()
  await click(btn('Add AI connection'))
  expect(host.querySelector('input[type=password]').value).toBe('')
  expect(mock.requests.filter((x) => x.method === 'POST')).toHaveLength(0)
})

it('does not reopen a model picker after the connection editor was dismissed', async () => {
  await mount()
  await click(btn('Add AI connection'))
  type(host.querySelector('input[type=password]'), 'temporary-key')
  let release
  mock.modelDelay = new Promise((r) => {
    release = r
  })
  await act(async () => {
    btn('Choose a model for this provider').click()
    await Promise.resolve()
  })
  await act(() => useUI.setState({ sheets: [] }))
  await act(async () => {
    release()
    await new Promise((r) => setTimeout(r, 0))
  })
  expect(useUI.getState().sheets).toHaveLength(0)
  expect(host.querySelector('input')).toBeNull()
})


it('edits and saves fallback in the existing connection sheet without changing model selection', async () => {
  mock.saved = { provider: 'gemini', model: 'my-selected-model', hasKey: true, connected: true, allowModelFallback: false }
  await mount()
  await click([...host.querySelectorAll('button')].find(b => b.textContent.includes('Saved API')))
  const toggle = host.querySelector('[aria-label="Automatically use another model"]')
  expect(toggle.getAttribute('role')).toBe('switch')
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  expect(host.querySelector('.coach-selected-model').textContent).toContain('my-selected-model')
  await click(toggle)
  expect(toggle.getAttribute('aria-checked')).toBe('true')
  await click(toggle)
  await click(btn('Save changes'))
  expect(mock.requests.find(r => r.path === '/api/coach/connections' && r.method === 'POST').body)
    .toMatchObject({ id: 'saved-one', model: 'my-selected-model', allowModelFallback: false })
})
