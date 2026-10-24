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
    mock.calls.push({ path, options })
    return path.endsWith('/disclosure')
      ? { provider: 'openai' }
      : { job: { id: 'job-1' } }
  },
}))
import { requestReview } from './coach-api.js'
beforeEach(() => {
  mock.calls = []
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
