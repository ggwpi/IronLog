// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ calls: [], syncNow: vi.fn(), state: null }))
vi.mock('../store/useStore.js', () => ({
  useStore: { getState: () => mock.state },
}))
vi.mock('../store/useUI.js', () => ({
  useUI: { getState: () => ({ toast: vi.fn() }) },
}))
vi.mock('./demo.js', () => ({ DEMO: false }))
vi.mock('./mobile.js', () => ({ MOBILE: false }))
vi.mock('./coach-consent.js', () => ({
  consentTarget: () => null,
  hasAiConsent: async () => true,
  allowAi: vi.fn(),
}))
vi.mock('./api.js', () => ({
  api: async (path, options) => {
    mock.calls.push({ path: path.split('?')[0], url: path, options })
    return path.split('?')[0].endsWith('/disclosure')
      ? { provider: 'openai' }
      : { job: { id: 'job-1' } }
  },
}))
import { setCoachChoice } from './coach-choice.js'
import { requestReview } from './coach-api.js'
beforeEach(() => {
  mock.calls = []
  setCoachChoice('alice', {})
  mock.syncNow.mockReset().mockImplementation(async () => {
    mock.calls.push({ path: 'sync' })
    return { status: 'ok' }
  })
  mock.state = {
    config: { coach: { cloud: true } },
    user: { id: 'alice' },
    S: {},
    syncNow: mock.syncNow,
  }
})
it('syncs the latest consent and training state before enqueueing a cloud Coach request', async () => {
  await requestReview('Review my latest session')
  expect(mock.calls.map((c) => c.path)).toEqual([
    '/api/coach/disclosure',
    'sync',
    '/api/coach/review',
  ])
})
it('does not send training for a paid AI run when cloud sync is not confirmed', async () => {
  mock.syncNow.mockResolvedValue({ status: 'pending' })
  await expect(requestReview('My latest session')).rejects.toMatchObject({
    code: 'sync',
  })
  expect(mock.calls.map((c) => c.path)).toEqual(['/api/coach/disclosure'])
})
it('keeps the upstream self-hosted request path unchanged', async () => {
  mock.state.config = { coach: { enabled: true } }
  await requestReview('Review')
  expect(mock.syncNow).not.toHaveBeenCalled()
  expect(mock.calls.map((c) => c.path)).toEqual([
    '/api/coach/disclosure',
    '/api/coach/review',
  ])
})

it('cloud provider errors address the account owner rather than a self-hosted administrator', async () => {
  const { jobErrorText } = await import('./coach-api.js')
  expect(jobErrorText('auth')).toBe(
    'Your AI provider rejected the key. Check Settings → AI Coach.'
  )
  expect(jobErrorText('provider')).toBe('Your AI provider couldn’t answer.')
  expect(jobErrorText('off')).toBe(
    'Choose a provider and connect your own API key.'
  )
})

it('pins the connection/model before consent and sync, even if the active selection changes', async () => {
  const { setCoachChoice } = await import('./coach-choice.js')
  setCoachChoice('alice', { connectionId: 'connection-a', model: 'model-a' })
  mock.syncNow.mockImplementation(async () => { setCoachChoice('alice', { connectionId: 'connection-b', model: 'model-b' }); return { status: 'ok' } })
  await requestReview('Keep the same conversation')
  const sent = mock.calls.find(c => c.path === '/api/coach/review')
  expect(JSON.parse(sent.options.body)).toMatchObject({ connectionId: 'connection-a', model: 'model-a' })
})

it('a chat question syncs first and carries the pinned connection plus only the active workout numbers', async () => {
  const { askCoach } = await import('./coach-api.js')
  setCoachChoice('alice', { connectionId: 'gemini-personal', model: 'gemini-3.8-flash' })
  mock.state.S.active = { d: '2026-10-27', name: 'Push', entries: [{ id: '0025', sets: [{ w: 20, r: 8, done: true, private: 'excluded' }] }] }
  await askCoach('How long should I rest?')
  expect(mock.calls.map(c => c.path)).toEqual(['/api/coach/disclosure', 'sync', '/api/coach/ask'])
  const body = JSON.parse(mock.calls.at(-1).options.body)
  expect(body).toMatchObject({ text: 'How long should I rest?', connectionId: 'gemini-personal', model: 'gemini-3.8-flash', accountId: 'alice' })
  expect(body.today.entries[0].sets[0]).toEqual({ w: 20, r: 8, done: true })
  expect(JSON.stringify(body)).not.toContain('excluded')
})
