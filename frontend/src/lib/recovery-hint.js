// Original complete hint engine, with IronLog-only preference and legacy-model boundaries.
// No profile, history, settings, media or recovery-map writes.
export * from './opengym-v145/recovery-hint.js'
import { recoveryHint as originalHint } from './opengym-v145/recovery-hint.js'

export function recoveryHint(S, options = {}) {
  // Preserve IronLog's existing opt-in Home surface without changing the original default.
  if (S?.recoveryHint !== true) return null
  const fatigue = { ...(options.fatigue || {}) }
  // Old IronLog combines lats/upper-back and the deltoid heads. Project only missing names;
  // explicit split values remain authoritative. The existing Stats/body-map algorithm stays.
  if (!Object.hasOwn(fatigue, 'lats') && Object.hasOwn(fatigue, 'upper-back')) fatigue.lats = fatigue['upper-back']
  for (const head of ['front-delts', 'side-delts', 'rear-delts']) {
    if (!Object.hasOwn(fatigue, head) && Object.hasOwn(fatigue, 'deltoids')) fatigue[head] = fatigue.deltoids
  }
  return originalHint(S, { ...options, fatigue })
}
