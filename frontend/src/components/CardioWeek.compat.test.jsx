// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, expect, it } from 'vitest'
import { DEF, useStore } from '../store/useStore.js'
import CardioWeekCard, { GoalSheet } from './CardioWeek.jsx'
import { assertUserDataPreserved } from '../lib/migration-audit.js'
import { cardioGoalsOf } from '../lib/cardio-goals.js'

let host, root, original
const click = text => act(() => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text || b.querySelector('.lrow-t')?.textContent === text).click())
beforeEach(() => {
 globalThis.IS_REACT_ACT_ENVIRONMENT = true
 original = { ...structuredClone(DEF), cardioGoal: 150, modules: { future: 'keep' }, active: { id: 'offline-draft', entries: [] },
 workouts: [{ id: 'legacy', d: '2026-11-18', entries: [{ id: '0025', sets: [{ w: 60, r: 8, done: true, note: 'א'.repeat(500), media: [{ hash: 'keep' }] }] }] }],
 customEx: [{ id: 'custom-keep', n: 'My exercise', media: 'custom-media' }], bodyweight: [{ d: '2026-11-18', w: 80 }] }
 useStore.setState({ S: structuredClone(original), user: null })
 host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 act(() => root.render(<GoalSheet />))
})
afterEach(() => { act(() => root.unmount()); host.remove() })

it('the original goal editor writes through IronLog update and retains all existing user records', () => {
 click('Any cardio'); act(() => host.querySelector('[aria-label="Increase Goal"]').click()); click('Save')
 const S = useStore.getState().S
 expect(S.cardioGoal).toBe(165)
 expect(cardioGoalsOf(S)).toEqual([{ kind: 'any', unit: 'min', v: 165 }])
 expect(assertUserDataPreserved(original, S)).toBe(true)
 expect(S.modules).toEqual(original.modules)
 expect(JSON.parse(JSON.stringify(S)).active).toEqual(original.active)
})
it('adds a running distance goal, reorders it and removes it without touching the old minutes goal', () => {
 click('Add a goal'); act(() => host.querySelector('[data-kind="run"]').click()); click('Distance'); click('Add')
 expect(cardioGoalsOf(useStore.getState().S)).toEqual([{ kind: 'any', unit: 'min', v: 150 }, { kind: 'run', unit: 'km', v: 10 }])
 click('Run'); click('Show first')
 expect(cardioGoalsOf(useStore.getState().S)[0]).toEqual({ kind: 'run', unit: 'km', v: 10 })
 click('Run'); click('Remove goal')
 expect(cardioGoalsOf(useStore.getState().S)).toEqual([{ kind: 'any', unit: 'min', v: 150 }])
 expect(assertUserDataPreserved(original, useStore.getState().S)).toBe(true)
})
it('cancels draft edits without changing storage or pending offline history', () => {
 click('Any cardio'); act(() => host.querySelector('[aria-label="Increase Goal"]').click()); click('Cancel')
 expect(useStore.getState().S).toEqual(original)
})
it('renders each original activity icon through the existing IronLog SVG renderer', () => {
 click('Add a goal')
 const kinds = [...host.querySelectorAll('[data-kind]')]
 expect(kinds).toHaveLength(11)
 for (const kind of kinds) expect(kind.querySelector('svg'), kind.dataset.kind).toBeTruthy()
})
it('renders saved goals and sport activity from a deeply frozen profile without normalizing user data', () => {
 const profile = structuredClone(original)
 profile.activities = { 'sport-keep': { d: '2026-11-19', sport: 'run', min: 30, km: 5, _ts: 100, unknown: 'keep' } }
 const raw = JSON.stringify(profile)
 const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) } return value }
 act(() => root.render(<CardioWeekCard S={freeze(profile)} />))
 expect(host.querySelector('[data-cardio-week]')).toBeTruthy()
 expect(JSON.stringify(profile)).toBe(raw)
 expect(useStore.getState().S).toEqual(original)
})
