// Full unchanged v1.4.5 model. IronLog retains its actual UI, state and cloud paths.
export * from './opengym-v145/session-engine/frontend/src/lib/daily-form.js'
import { goLighter as originalGoLighter } from './opengym-v145/session-engine/frontend/src/lib/daily-form.js'
import { syncSessionEngineProfile } from './opengym-session-profile.js'
import { isWarmupRow, WEIGHT_ORIGIN_MANUAL } from './workout-model.js'

// The isolated original model reads the same custom IDs/default increments as this profile.
// Registering affects only its private lookup; it never rewrites a profile or the actual UI index.
export function goLighter(state, kind) {
  syncSessionEngineProfile(state)
  // IronLog records explicit manual warm-up loads with weightOrigin. Upstream's live ramp
  // protects `edited` rows. Project that guard for this call, then restore the exact metadata.
  const guards = []
  for (const [e, entry] of (state?.active?.entries || []).entries()) for (const [i, row] of (entry.sets || []).entries()) {
    if (isWarmupRow(row) && row.weightOrigin === WEIGHT_ORIGIN_MANUAL && row.edited !== true) {
      guards.push({ e, i, own: Object.hasOwn(row, 'edited'), value: row.edited })
      row.edited = true
    }
  }
  try { return originalGoLighter(state, kind) }
  finally {
    for (const guard of guards) {
      const row = state.active?.entries?.[guard.e]?.sets?.[guard.i]
      if (row) { if (guard.own) row.edited = guard.value; else delete row.edited }
    }
  }
}
