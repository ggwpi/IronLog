// IronLog insights use the same completed-set, schedule and muscle-credit readers as
// openGym's native statistics. No fallback sessions, inferred ratings or sample curves.
import { workoutDay } from '../lib/history.js'
import { isoOf, weekKey, weekStartOf } from '../lib/format.js'
import { muscleBalanceWindow, loadOfWorkouts, loadOfWeeklyPlan } from '../lib/muscles.js'
import { rirOf, MIN_RATED } from '../lib/effort.js'
import { isWarmupRow } from '../lib/workout-model.js'

// Original planning ranges, only for muscle groups that the catalogue can identify.
// They are planning references, not measurements or universal prescriptions.
export const VOLUME_REFERENCES = {
  chest: [12, 20], biceps: [8, 16], triceps: [8, 16],
  quadriceps: [12, 20], hamstring: [8, 16], calves: [6, 12], abs: [6, 12],
}
const mean = values => values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null
export function trainingInsights(S, now = new Date()) {
  const today = isoOf(now)
  const ws = weekStartOf(S)
  const workouts = muscleBalanceWindow(S.workouts || [], 7, +now, today, ws)
  const sets = workouts.flatMap(w => (w.entries || []).flatMap(e => (e.sets || []).filter(s => s.done && !isWarmupRow(s))))
  const rated = sets.map(rirOf).filter(v => Number.isFinite(v))
  const inTarget = rated.filter(rir => rir >= 1 && rir <= 2).length
  const weights = (S.bodyweight || []).filter(p => Number.isFinite(p.w) && p.d <= today)
  const day = new Date(today + 'T12:00:00')
  const currentFrom = new Date(day); currentFrom.setDate(day.getDate() - 6)
  const priorFrom = new Date(day); priorFrom.setDate(day.getDate() - 13)
  const currentISO = isoOf(currentFrom), priorISO = isoOf(priorFrom)
  const current = weights.filter(p => p.d >= currentISO)
  const prior = weights.filter(p => p.d >= priorISO && p.d < currentISO)
  const currentMean = mean(current.map(p => p.w)), priorMean = mean(prior.map(p => p.w))
  const checkins = (S.ironlogRecovery || []).filter(p => p.measured_at >= currentISO && p.measured_at <= today)
  return {
    week: weekKey(today, ws), workouts, sets: sets.length,
    load: loadOfWorkouts(workouts), planned: loadOfWeeklyPlan(S),
    effort: { rated: rated.length, inTarget, percent: rated.length >= MIN_RATED ? inTarget / rated.length * 100 : null },
    weight: { current: currentMean, previous: priorMean, delta: currentMean == null || priorMean == null ? null : currentMean - priorMean,
      samples: current.length, previousSamples: prior.length },
    recovery: { sleep: mean(checkins.filter(p => Number.isFinite(p.sleep_minutes)).map(p => p.sleep_minutes / 60)),
      readiness: mean(checkins.filter(p => Number.isFinite(p.readiness)).map(p => p.readiness)), samples: checkins.length },
  }
}
export function cycleWeeks(S, now = new Date()) {
  const cycle = S.ironlogCycle
  if (!cycle?.starts_on || !Number.isInteger(cycle.planned_weeks) || cycle.planned_weeks < 1 || cycle.planned_weeks > 52) return []
  const start = new Date(cycle.starts_on + 'T00:00:00')
  if (!Number.isFinite(+start)) return []
  return Array.from({ length: cycle.planned_weeks }, (_, index) => {
    const from = new Date(start); from.setDate(start.getDate() + index * 7)
    const to = new Date(from); to.setDate(from.getDate() + 7)
    const fromISO = isoOf(from), toISO = isoOf(to)
    return { number: index + 1, current: now >= from && now < to,
      sessions: (S.workouts || []).filter(w => { const d = workoutDay(w); return d >= fromISO && d < toISO }).length }
  })
}
