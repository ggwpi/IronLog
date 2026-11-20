import { registerCustom, setProfileSteps } from './opengym-v145/session-engine/frontend/src/lib/exercises.js'
// Populate only the isolated engine's lookup. Actual catalogue IDs and profile data stay put.
export function syncSessionEngineProfile(state) {
  registerCustom(state?.customEx || [])
  setProfileSteps(state?.wstep)
}
