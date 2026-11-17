// Ported from openGym v1.4.5 lib/lifetime.js: read-only lifetimeTotals.
// Preserves completed-per-side set semantics and excludes warm-up rows and
// abandoned timers. No profile writes, migrations or backend dependencies.
import { doneUnits, workoutDuration } from './history.js'
import { isWarmupRow } from './workout-model.js'

const LONGEST_MS = 6 * 3600e3

export function lifetimeTotals(S) {
  const list = Array.isArray(S?.workouts) ? S.workouts : []
  let sets = 0, ms = 0
  for (const w of list) {
    for (const e of w?.entries || []) for (const s of e?.sets || []) {
      if (s && !isWarmupRow(s)) sets += doneUnits(s)
    }
    const d = workoutDuration(w)
    if (d >= 60000 && d <= LONGEST_MS) ms += d
  }
  return { workouts: list.length, sets, hours: ms / 3600e3 }
}
