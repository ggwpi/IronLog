import { EXIDX } from '../lib/exercises.js'
import { effectiveRoutines, workoutAt } from '../lib/history.js'
import { todayISO } from '../lib/format.js'
import { completedVolumeOf, isWarmupRow } from '../lib/workout-model.js'
import { musclesOf } from '../lib/muscles.js'
import { rirOf } from '../lib/effort.js'
import { best1RM } from '../lib/onerm.js'
import { buildStatisticsModel } from './legacy/features/statistics/statistics-data.js'
import { WORKOUTS } from './legacy/features/workouts/workout-catalog.js'

const KG_PER_LB = 0.45359237
const slugMap = { quadriceps: 'quads', hamstring: 'hamstrings', abs: 'core', 'upper-back': 'upper-back', deltoids: 'side-delts' }
const doneSets = entry => (entry.sets || []).filter(s => s.done && !isWarmupRow(s))
const atISO = w => { const at = workoutAt(w); return Number.isFinite(at) ? new Date(at).toISOString() : null }

// One read-only adapter: the original widgets and the training engine share the same history.
// No old browser keys or Supabase records are changed by this adapter.
export function ironModel(input, now = new Date()) {
  const S = { routines: [], week: {}, dayPlan: {}, workouts: [], bodyweight: [], ...input }
  const kg = S.unit === 'lb' ? KG_PER_LB : 1
  const week = new Date(now); week.setHours(0, 0, 0, 0); week.setDate(week.getDate() - week.getDay())
  const end = new Date(week); end.setDate(end.getDate() + 7)
  const sessions = [...(S.workouts || [])].sort((a,b) => workoutAt(a) - workoutAt(b))
  const performance = [], volume = new Map()
  for (const w of sessions) {
    const at = atISO(w)
    if (!at) continue
    const inWeek = new Date(at) >= week && new Date(at) < end
    for (const entry of w.entries || []) {
      const ex = { ...(S.customEx?.find(e => e.id === entry.id) || EXIDX[entry.id] || {}), ...(entry.exercise || entry) }
      const sets = doneSets(entry)
      const estimate = best1RM({ ...S, workouts: [w] }, entry.id)?.est
      sets.forEach((set, index) => performance.push({
        exercise_id: entry.id, name: ex.n || entry.n || entry.id, completed_at: at,
        load_kg: Number(set.w || 0) * kg, reps: Number(set.r || 0), rir: rirOf(set),
        estimated_1rm_kg: index === 0 && estimate != null ? estimate * kg : null,
        volume_kg: completedVolumeOf(set) * kg,
      }))
      if (inWeek && sets.length) for (const [slug, credit] of Object.entries(ex.ironlogMuscles || musclesOf(ex))) {
        // The catalogue doesn't distinguish deltoid heads; do not label all shoulders as side delts.
        if (slug === 'deltoids') continue
        const id = slugMap[slug] || slug
        const row = volume.get(id) || { muscle_slug: id, week_start: week.toISOString(), effective_sets: 0, direct_sets: 0 }
        row.effective_sets += sets.length * (credit === 1 ? 1 : 0.5)
        if (credit === 1) row.direct_sets += sets.length
        volume.set(id, row)
      }
    }
  }
  const workouts = (S.routines || []).map((routine, index) => {
    const days = Object.entries(S.week || {}).filter(([, ids]) => (Array.isArray(ids) ? ids : [ids]).includes(routine.id)).map(([d]) => Number(d))
    const name = routine.name || 'אימון'
    const art = WORKOUTS.find(w => name.toLowerCase().includes(w.short.toLowerCase())) || WORKOUTS.find(w => name.toLowerCase().includes(w.short.split(' ')[0].toLowerCase()))
    return { id: routine.id, databaseId: index + 1, day: days[0] ?? null, short: name, title: name,
      description: routine.note || '', exercises: (routine.ex || []).length,
      sets: (routine.ex || []).reduce((n,e) => n + (Number(e.sets) || 0), 0), minutes: 0, targets: [], images: art?.images || [] }
  })
  const model = buildStatisticsModel({
    weights: (S.bodyweight || []).map(p => ({ measured_at: p.d, weight_kg: Number(p.w) * kg })),
    muscleVolume: [...volume.values()], performance,
    recovery: (S.ironlogRecovery || []).filter(p => new Date(p.measured_at) >= new Date(now.getTime() - 7 * 86400000)),
    cycle: S.ironlogCycle || null,
  })
  // Targets remain the user's original training heuristics. Missing measurements stay missing.
  model.source = 'opengym'
  model.muscleVolume.muscles = model.muscleVolume.muscles.filter(m => !['upper-chest','lats','side-delts','rear-delts'].includes(m.id) || volume.has(m.id))
  const rated = performance.filter(p => new Date(p.completed_at) >= week && new Date(p.completed_at) < end && p.rir != null)
  model.recovery = buildStatisticsModel({ recovery: (S.ironlogRecovery || []).filter(p => new Date(p.measured_at) >= new Date(now.getTime() - 7 * 86400000)), performance: rated }).recovery
  if (S.ironlogCycle) model.mesocycle.completedWeeks = Array.from({ length: model.mesocycle.currentWeek - 1 }, (_, i) => i + 1)
  if (!S.ironlogCycle) model.mesocycle = null
  // Original widget renderer requires a cycle object; display a truthful unconfigured state.
  if (!model.mesocycle) model.mesocycle = { totalWeeks: 0, currentWeek: 0, completedWeeks: [], deloadWeeks: [], phaseLabel: 'טרם הוגדר מחזור' }
  return { model, workouts, todayIds: effectiveRoutines(S, todayISO()).map(r => r.id), workoutData: {
    sessions: sessions.map(w => ({ status: 'completed', started_at: atISO(w), completed_at: atISO(w), template_id: workouts.find(r => r.id === (w.routineId || w.routineIds?.[0]))?.databaseId })),
    performanceHistory: performance.map(p => ({ ...p, load_kg: p.volume_kg, reps: 1 })), summary: { plannedWorkouts: Object.keys(S.week || {}).filter(d => S.week[d]?.length).length },
  } }
}
