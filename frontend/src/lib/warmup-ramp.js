// Original warm-up algorithms, with actual IronLog state/catalogue at the boundary.
export * from './opengym-v145/session-engine/frontend/src/lib/warmup-ramp.js'
import * as original from './opengym-v145/session-engine/frontend/src/lib/warmup-ramp.js'
import { liveReramp } from './opengym-v145/session-engine/frontend/src/lib/history.js'
import { isRungRow } from './opengym-v145/session-engine/frontend/src/lib/warmup-snap.js'
import { isWarmupRow, WEIGHT_ORIGIN_MANUAL } from './workout-model.js'
import { syncSessionEngineProfile } from './opengym-session-profile.js'
import { markWarmupEdited, WARMUP_SETUP_FIELDS } from './opengym-v145/session-engine/frontend/src/lib/workout-model.js'
export function warmupAutoOf(state) { syncSessionEngineProfile(state); return original.warmupAutoOf(state) }
export function warmupSource(state,cfg) { syncSessionEngineProfile(state); return original.warmupSource(state,cfg) }
export function warmupBlock(state,cfg,rows,opts) { syncSessionEngineProfile(state); return original.warmupBlock(state,cfg,rows,opts) }
export function withWarmupBlock(state,cfg,rows,opts) { syncSessionEngineProfile(state); return original.withWarmupBlock(state,cfg,rows,opts) }
// The older IronLog builder understands the count. An explicit new choice owns that block.
export const warmupBuildConfig = cfg => original.warmupModeOf(cfg) ? { ...cfg, warmupSets: 0 } : cfg
export const hasGeneratedWarmups = rows => rows.some(row => isWarmupRow(row) && isRungRow(row))
export { markWarmupEdited } from './opengym-v145/session-engine/frontend/src/lib/workout-model.js'
export function markWarmupSetupChange(entry,before,after) {
  if (!original.warmupModeOf(entry?.target) && !hasGeneratedWarmups(entry?.sets || [])) return after
  const field=WARMUP_SETUP_FIELDS.find(key=>before?.[key]!==after?.[key] || ['L','R'].some(side=>before?.sides?.[side]?.[key]!==after?.sides?.[side]?.[key]))
  return field ? markWarmupEdited(after,field) : after
}
export function rerampGeneratedWarmups(rows,step,floor,assisted) {
  // Do not mutate input rows, including frozen history. Map IronLog's explicit manual guard
  // to upstream's edited guard for the calculation, then restore original field presence/value.
  const guarded=rows.map(row=>isWarmupRow(row)&&row.weightOrigin===WEIGHT_ORIGIN_MANUAL&&row.edited!==true?{...row,edited:true}:row)
  return liveReramp(guarded,step,floor,assisted).map((row,i)=>{
    if(guarded[i]===rows[i])return row
    const out={...row};if(Object.hasOwn(rows[i],'edited'))out.edited=rows[i].edited;else delete out.edited
    return out
  })
}
