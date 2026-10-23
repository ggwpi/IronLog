// Only the 38 exercises from the original IronLog plan are translated. All exercise
// descriptions, equipment, muscles and media then resolve from the upstream catalogue.
import matches from './ironlog-exercise-matches.json' with { type: 'json' }
export const IRONLOG_MATCHES = Object.freeze(Object.fromEntries(matches.map(m => [m.legacyId, m.catalogueId])))
const mapped = id => IRONLOG_MATCHES[id] || id

export function migrateIronLogExercises(state) {
  if (state.ironlogCatalogueVersion >= 1) return false
  const visit = value => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string') value[i] = mapped(value[i])
        else visit(value[i])
      }
      return
    }
    // Covers routine slots, historical entries, active entries, targets and alternatives.
    if (typeof value.id === 'string') value.id = mapped(value.id)
    for (const child of Object.values(value)) visit(child)
  }
  state.customEx = (state.customEx || []).filter(e => !IRONLOG_MATCHES[e?.id])
  visit(state)
  for (const field of ['exWeights', 'exNotes', 'barWeights', 'loadKind', 'dbLoad']) {
    const entries = state[field]
    if (!entries || typeof entries !== 'object') continue
    for (const [old, id] of Object.entries(IRONLOG_MATCHES)) {
      if (!Object.hasOwn(entries, old)) continue
      // Keep a pre-existing catalogue override. In a collision retain the old value
      // under its old key as well; the pre-migration backup also holds both copies.
      if (!Object.hasOwn(entries, id)) { entries[id] = entries[old]; delete entries[old] }
    }
  }
  state.ironlogCatalogueVersion = 1
  return true
}

export function prepareCatalogueMigration(state, storage = globalThis.localStorage) {
  if (state.ironlogCatalogueVersion >= 1) return false
  // Never rewrite historical IDs unless the original copy can first be recovered.
  const legacy = JSON.stringify(state)
  if (Object.keys(IRONLOG_MATCHES).some(id => legacy.includes('"' + id + '"'))) {
    const key = 'ironlog_before_catalogue_v1'
    const previous = storage.getItem(key)
    if (!previous) storage.setItem(key, legacy)
    else if (previous !== legacy) storage.setItem(key + '_' + Date.now().toString(36), legacy)
  }
  return true
}
