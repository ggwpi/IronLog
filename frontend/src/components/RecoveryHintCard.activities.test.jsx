// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
vi.mock('../sheets.jsx', () => ({ dayOverrideSheet: vi.fn() }))
import RecoveryHintCard from './RecoveryHintCard.jsx'
import { auditCompleteProfilePreservation } from '../lib/migration-audit.js'

let host, root
beforeEach(() => {
 vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026,9,28,9))
 globalThis.IS_REACT_ACT_ENVIRONMENT = true
 host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers() })
it('recomputes the actual existing card when only the stored activities map changes', () => {
 const work = (ago, ids) => ({ id: ago + '-' + ids.join(), d: `2026-10-${String(28-ago).padStart(2,'0')}`, start: new Date(2026,9,28-ago,18).getTime(),
 entries: ids.map(id => ({ id, sets: Array.from({ length: 5 }, () => ({ w: 60, r: 8, done: true })) })) })
 const upper = n => work(n, ['0025','0027','0091']), legs = n => work(n, ['0043','0085'])
 const S = { unit: 'kg', recoveryHint: true, workouts: [upper(20),legs(12),upper(10),legs(9),upper(3)], routines: [], week: {}, dayPlan: {}, bodyweight: [] }
 act(() => root.render(<RecoveryHintCard S={S} />))
 expect(host.querySelector('[data-recovery-hint="neglect"]')).toBeTruthy()
 const next = { ...S, activities: { football: { d: '2026-10-26', sport: 'football', min: 90, at: new Date(2026,9,26,18).getTime() } } }
 const before = structuredClone(next)
 act(() => root.render(<RecoveryHintCard S={next} />))
 expect(host.querySelector('[data-recovery-hint]')).toBeNull()
 expect(auditCompleteProfilePreservation(before, next).ok).toBe(true)
})
