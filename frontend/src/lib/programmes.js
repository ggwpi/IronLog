export * from './opengym-v145/session-engine/frontend/src/lib/programmes.js'
import * as original from './opengym-v145/session-engine/frontend/src/lib/programmes.js'
import { programmePlan as originalPlan } from './opengym-v145/session-engine/frontend/src/lib/session-start.js'
import { syncSessionEngineProfile } from './opengym-session-profile.js'
import { syncUpstreamLocale } from './opengym-locale.js'
export { starterProgrammeOptions, buildStarterProgramme } from './opengym-v145/session-engine/frontend/src/lib/starter.js'

// Keep extension metadata outside the original model's known validation fields.
const extras = (value, keys) => Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {}).filter(([k]) => !keys.includes(k)))
function keepWeekMetadata(source, clean) {
  const out = { ...extras(source, ['deload', 'rpe', 't']), ...clean }
  const targets = Object.fromEntries(Object.keys(source?.t || {}).map(id => {
    const extra = extras(source.t[id], ['pct', 'rpe'])
    return [id, { ...extra, ...clean.t?.[id] }]
  }).filter(([, v]) => Object.keys(v).length))
  if (clean.t || Object.keys(targets).length) out.t = { ...targets, ...Object.fromEntries(Object.entries(clean.t || {}).map(([id,v]) => [id, { ...targets[id], ...v }])) }
  return out
}
export function cleanWeek(w) { return keepWeekMetadata(w, original.cleanWeek(w)) }
export function normalizeProgramme(p) {
  const clean = original.normalizeProgramme(p)
  return clean ? { ...clean, weeks: clean.weeks.map((w, i) => keepWeekMetadata(p.weeks?.[i], w)) } : null
}
export const programmeById = (S, id) => normalizeProgramme(S?.programmes?.[id])
export const programmesOf = S => original.programmesOf(S).map(p => programmeById(S, p.id))
export function resizeWeeks(weeks, n) {
  return original.resizeWeeks(weeks, n).map((w, i) => keepWeekMetadata(weeks?.[Math.min(i, weeks.length - 1)], w))
}
export function stepWeek(w, ...args) { return keepWeekMetadata(w, original.stepWeek(w, ...args)) }
export function saveProgramme(s, p) {
  const saved = original.saveProgramme(s, p)
  if (!saved) return null
  return (s.programmes[saved.id] = normalizeProgramme(p))
}
export function pctWeight(S, ...args) { syncSessionEngineProfile(S); return original.pctWeight(S, ...args) }
export function programmePlan(S, ...args) { syncSessionEngineProfile(S); return originalPlan(S, ...args) }
export function programmeChip(S, ...args) { syncUpstreamLocale(); return original.programmeChip(S, ...args) }
