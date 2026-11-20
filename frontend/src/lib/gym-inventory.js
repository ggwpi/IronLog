// Original inventory algorithms; IronLog retains its catalogue and stored identifiers.
export * from './opengym-v145/session-engine/frontend/src/lib/gym-inventory.js'
import { reRoundOpenSets as originalRound } from './opengym-v145/session-engine/frontend/src/lib/gym-inventory.js'
import { syncSessionEngineProfile } from './opengym-session-profile.js'
export function reRoundOpenSets(S) {
  syncSessionEngineProfile(S)
  return originalRound(S)
}
