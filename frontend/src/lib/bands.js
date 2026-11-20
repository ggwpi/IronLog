// Original algorithms; retain IronLog extension metadata at the profile boundary.
export * from './opengym-v145/bands.js'
import * as original from './opengym-v145/bands.js'
import { seedBands as seedOriginal, bandClimbReps as climbOriginal, setLabel as labelOriginal } from './opengym-v145/session-engine/frontend/src/lib/history.js'
import { setKnownBands as setEngineBands, knownBands as engineBands } from './opengym-v145/session-engine/frontend/src/lib/bands.js'
import { _setLangState, LANGS, DATE_LOCALES, RTL_LANGS as engineRTL } from './opengym-v145/session-engine/frontend/src/lib/i18n-core.js'
import { t, getLang, dateLocale, RTL_LANGS } from './i18n-core.js'
export { setWeightDecimals as setBandWeightDecimals } from './opengym-v145/session-engine/frontend/src/lib/format.js'
import { syncSessionEngineProfile } from './opengym-session-profile.js'

const known = new Set(['id', 'name', 'color', 'kg', 'level'])
export function cleanBands(list) {
  const input = new Map()
  for (const x of Array.isArray(list) ? list : []) if (original.cleanBand(x) && !input.has(x.id)) input.set(x.id, x)
  return original.cleanBands(list).map(b => ({ ...Object.fromEntries(Object.entries(input.get(b.id)).filter(([k]) => !known.has(k))), ...b }))
}
export const bandsOf = S => cleanBands(S?.bands)
export function setKnownBands(list) { original.setKnownBands(list); setEngineBands(list) }
const engineState = (S, cfg) => {
  syncSessionEngineProfile(S)
  return { ...S, bandEx: { ...S?.bandEx, [cfg.id]: original.usesBands(S, cfg.id, cfg) } }
}
export const seedBands = (S, cfg, rows, options) => cfg && original.usesBands(S, cfg.id, cfg) ? seedOriginal(engineState(S, cfg), cfg, rows, options) : rows
export const bandClimbReps = (S, cfg, options) => cfg && original.usesBands(S, cfg.id, cfg) ? climbOriginal(engineState(S, cfg), cfg, options) : 0
export function bandSetLabel(id, row, cfg, speedUnit, bands = original.knownBands()) {
  // The isolated model reads IronLog's current dictionary, including Hebrew and custom packs.
  const lang = getLang()
  if (!LANGS[lang]) LANGS[lang] = lang
  DATE_LOCALES[lang] = dateLocale()
  if (RTL_LANGS.has(lang)) engineRTL.add(lang)
  _setLangState(lang, new Proxy({}, { get: (_, key) => typeof key === 'string' ? t(key) : undefined }))
  const prior = engineBands()
  setEngineBands(bands)
  try { return labelOriginal(id, row, cfg, speedUnit) } finally { setEngineBands(prior) }
}
