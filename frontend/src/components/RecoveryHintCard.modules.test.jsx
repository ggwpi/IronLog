// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('../lib/recovery-hint.js', () => ({ recoveryHint: () => ({ kind: 'rest' }), hintText: hint => hint ? ['Rest day', 'Recovery fixture'] : null }))
vi.mock('../sheets.jsx', () => ({ dayOverrideSheet: vi.fn() }))
import RecoveryHintCard from './RecoveryHintCard.jsx'

let root, host
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })
it('Health off hides the opt-in Recovery Hint without changing its choice or stored history', () => {
  const S = { unit: 'kg', workouts: [], bodyweight: [], recoveryHint: true, modules: { health: true } }
  act(() => root.render(<RecoveryHintCard S={S} />))
  expect(host.querySelector('[data-recovery-hint]')).toBeTruthy()
  const off = { ...S, modules: { health: false } }
  const snapshot = structuredClone(off)
  act(() => root.render(<RecoveryHintCard S={off} />))
  expect(host.querySelector('[data-recovery-hint]')).toBeNull()
  expect(off).toEqual(snapshot)
  act(() => root.render(<RecoveryHintCard S={S} />))
  expect(host.querySelector('[data-recovery-hint]')).toBeTruthy()
})
