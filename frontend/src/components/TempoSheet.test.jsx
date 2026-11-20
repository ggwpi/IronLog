// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEF, useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { TempoEditor, setTempoSheet } from './TempoSheet.jsx'
import { assertUserDataPreserved } from '../lib/migration-audit.js'
import { mergeStates, stampChange } from '../lib/sync-merge.js'
import { buildCompletedWorkout } from '../lib/finish-workout.js'
import { workoutsCSV } from '../lib/ironlog-csv.js'
import { parseWorkoutCSV } from '../lib/import-csv.js'
import { stampPut } from '../../../api/sync-stamps.js'

let root, host, sheetKey = 0
beforeEach(() => {
 globalThis.IS_REACT_ACT_ENVIRONMENT = true
 host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 useUI.setState({ sheets: [] })
 useStore.setState({ user: null, S: { ...structuredClone(DEF), active: { id: 'active', name: 'Fixture', start: Date.now(), entries: [{ id: '0025', target: { tempo: '3-1-1-0', sets: 1, reps: 8 }, sets: [{ w: 60, r: 8, done: true, tag: 'blue', note: 'א'.repeat(500), media: [{ hash: 'keep' }] }] }] }, workouts: [{ id: 'keep', d: '2026-11-01', entries: [], media: 'unchanged' }] } })
})
afterEach(() => { act(() => root.unmount()); host.remove(); useUI.setState({ sheets: [] }) })
const click = text => act(() => [...host.querySelectorAll('button')].find(b => b.textContent === text).click())
const open = () => { act(() => setTempoSheet(0, 0)); act(() => root.render(<React.Fragment key={++sheetKey}>{useUI.getState().sheets.at(-1).render(() => {})}</React.Fragment>)) }

it('saves an original normalized preset through the actual sheet without changing training data', () => {
 const before = structuredClone(useStore.getState().S)
 open(); click('5-0-X-0'); click('Save')
 const after = useStore.getState().S
 expect(after.active.entries[0].sets[0].tempo).toBe('5-0-X-0')
 expect(assertUserDataPreserved(before, after)).toBe(true)
 expect(JSON.parse(JSON.stringify(after)).active.entries[0].sets[0].tempo).toBe('5-0-X-0')
})
it('falls back to exercise tempo on clear or an equal override', () => {
 useStore.getState().S.active.entries[0].sets[0].tempo = '5-0-X-0'
 open(); click('Like the exercise (3-1-1-0)')
 expect(useStore.getState().S.active.entries[0].sets[0]).not.toHaveProperty('tempo')
 open(); click('Save')
 expect(useStore.getState().S.active.entries[0].sets[0]).not.toHaveProperty('tempo')
})
it('cancel does not write and a stale sheet cannot change a different active session', () => {
 const before = structuredClone(useStore.getState().S)
 open(); click('2-0-1-0'); click('Cancel')
 expect(useStore.getState().S).toEqual(before)
 open(); useStore.setState({ S: { ...before, active: { ...before.active, id: 'replacement' } } })
 click('5-0-X-0'); click('Save')
 expect(useStore.getState().S.active.entries[0].sets[0]).not.toHaveProperty('tempo')
})
it('rejects a stale row count and changes no values of a per-side row', () => {
 open(); useStore.getState().S.active.entries[0].sets.push({ w: 20, r: 8, done: false }); click('5-0-X-0'); click('Save')
 expect(useStore.getState().S.active.entries[0].sets[0]).not.toHaveProperty('tempo')
 useStore.getState().S.active.entries[0].sets[0].sides = { L: { w: 10, r: 5, done: true }, R: { w: 12, r: 4, done: false } }
 const sides = structuredClone(useStore.getState().S.active.entries[0].sets[0].sides)
 open(); click('5-0-X-0'); click('Save')
 expect(useStore.getState().S.active.entries[0].sets[0].sides).toEqual(sides)
})
it('retains tempo with notes/tags/media through finish, old-client merge, JSON and own CSV', () => {
 open(); click('5-0-X-0'); click('Save')
 const S = structuredClone(useStore.getState().S)
 const result = buildCompletedWorkout(S.active)
 expect(result.entries[0].sets[0].tempo).toBe('5-0-X-0')
 const base = { ...S, active: null, workouts: [result], _ts: 100 }
 const old = structuredClone(base); delete old.workouts[0].entries[0].sets[0].tempo
 old.workouts[0].entries[0].sets[0].r = 9
 // An old writer does not know the field. It is enriched by the existing API boundary;
 // a modern stamped omission is instead an intentional removal and must stay removed.
 stampPut(base, old, { overRead: true, stamped: false, now: 200 })
 const merged = mergeStates(base, old)
 expect(merged.workouts[0].entries[0].sets[0]).toMatchObject({ tempo: '5-0-X-0', tag: 'blue', r: 9, media: [{ hash: 'keep' }] })
 expect(parseWorkoutCSV(workoutsCSV(merged)).workouts[0].entries[0].sets[0]).toMatchObject({ tempo: '5-0-X-0', tag: 'blue', note: 'א'.repeat(500) })
})
it('uses the original explosive lift rule', () => {
 const done = vi.fn()
 act(() => root.render(<TempoEditor value="0-0-1-0" onDone={done} close={() => {}} />))
 act(() => host.querySelector('[aria-label="Explosive lift (X)"]').click())
 click('Save'); expect(done).toHaveBeenCalledWith('0-0-X-0')
})
it('keeps intentional clearing from a modern device instead of restoring its old override', () => {
 const base = structuredClone(useStore.getState().S)
 base.active = null; base.workouts[0].entries = [{ id: '0025', sets: [{ w: 60, r: 8, done: true, tempo: '3-1-1-0' }] }]
 base._ts = 100
 const next = structuredClone(base); delete next.workouts[0].entries[0].sets[0].tempo
 next._ts = stampChange(base, next, 200)
 expect(mergeStates(base, next).workouts[0].entries[0].sets[0]).not.toHaveProperty('tempo')
})
it('disables Save for an all-zero tempo', () => {
 const done = vi.fn()
 act(() => root.render(<TempoEditor value="0-0-1-0" onDone={done} close={() => {}} />))
 act(() => [...host.querySelectorAll('button[aria-label="Decrease"]')][2].click())
 const save = [...host.querySelectorAll('button')].find(b => b.textContent === 'Save')
 expect(save.disabled).toBe(true)
 act(() => save.click()); expect(done).not.toHaveBeenCalled()
})
