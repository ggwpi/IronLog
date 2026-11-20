export { canHaveStack, stackOf, stackFromStep, parseWeightList } from './opengym-v145/session-engine/frontend/src/lib/dumbbells.js'
import { withStack as original, stackOf, ownedWeightsFor } from './opengym-v145/session-engine/frontend/src/lib/dumbbells.js'
import { syncSessionEngineProfile } from './opengym-session-profile.js'
import { nextPrescription } from './opengym-v145/session-engine/frontend/src/lib/progression.js'
export function withStack(S, id, weights, now) {
  const out = original(S, id, weights, now)
  const prior = S?.stackWeights?.[id]
  const extra = Object.fromEntries(Object.entries(prior && typeof prior === 'object' ? prior : {}).filter(([k]) => !['unit', 'weights', '_ts'].includes(k)))
  return { ...out, [id]: { ...extra, ...out[id] } }
}
export function machineWeightsFor(S, cfg) {
  if (!stackOf(S, cfg?.id).length) return null
  syncSessionEngineProfile(S)
  return ownedWeightsFor(S, cfg)
}
export function machinePrescription(S, cfg, routine) {
  syncSessionEngineProfile(S)
  return nextPrescription(S, cfg, routine)
}
