import { uid } from '../lib/format.js'
import preset from './preset.json'

export function addOriginalPlan(S) {
  if (S.effort == null) S.effort = 'rir'
  S.customEx = S.customEx || []
  for (const exercise of preset.customEx) if (!S.customEx.some(e => e.id === exercise.id)) S.customEx.push(structuredClone(exercise))
  S.routines = S.routines || []
  S.week = S.week || {}
  for (const source of preset.routines) {
    const { day, ...routine } = structuredClone(source)
    const existing = S.routines.find(r => r.ironlogPresetDay === day)
    if (existing) continue
    const id = uid()
    S.routines.push({ ...routine, id, ironlogPresetDay: day })
    // Add to the day; never overwrite any routine that was already scheduled.
    S.week[day] = [...new Set([].concat(S.week[day] || [])), id]
  }
}

