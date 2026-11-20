// IronLog boundaries around the immutable v1.4.5 CSV engines. No profile or storage writes.
import { parseCSV, detectSource, parseWorkoutCSV, priorCustom, parseBodyweight as originalParseBodyweight, mergeImport as originalMergeImport } from './opengym-v145/import-csv.js'
import { withWeighInMetadata } from './weigh-ins.js'
import { workoutsCSV, WORKOUT_COLUMNS } from './opengym-v145/export-csv.js'
import { canonicalExId } from './exercises.js'

export { workoutsCSV, bodyCSV, csvCounts } from './opengym-v145/export-csv.js'

export function isOwnBodyCSV(text) {
  const columns = parseCSV(String(text).replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0])[0] || []
  return columns[0]?.toLowerCase() === 'date' && /^weight_(kg|lb)$/.test(columns[1] || '')
}
export function parseOriginalBodyImport(text, options) {
  const parsed = originalParseBodyweight(text, options)
  return parsed.error ? parsed : { ...parsed, ironlogBodyImport: true }
}
export function mergeOriginalBodyImport(S, parsed) {
  const measurementDates = new Set((S.measurements || []).map(m => m.d))
  const existingFields = new Set((S.customMeasurements || []).map(c => c.id))
  const working = { unit: S.unit, bwDaily: S.bwDaily, bodyweight: structuredClone(S.bodyweight || []),
    measurements: [], customMeasurements: structuredClone(S.customMeasurements || []), activities: structuredClone(S.activities || {}) }
  const input = { ...parsed, ...(parsed.measurements ? { measurements: parsed.measurements.filter(m => !measurementDates.has(m.d)) } : {}) }
  const result = withWeighInMetadata(working, () => originalMergeImport(working, input))
  S.bodyweight = working.bodyweight
  if (working.measurements.length) S.measurements = [...(S.measurements || []), ...working.measurements].sort((a, b) => a.d.localeCompare(b.d))
  const addedFields = working.customMeasurements.filter(c => !existingFields.has(c.id))
  if (addedFields.length) S.customMeasurements = [...(S.customMeasurements || []), ...addedFields]
  if (parsed.activities?.length) S.activities = { ...working.activities, ...S.activities }
  return result
}
export const previewOriginalBodyImport = (S, parsed) => mergeOriginalBodyImport({ ...S }, parsed)

// Only our own workout format takes the new reader. Existing third-party/XML import paths stay
// on IronLog's current importer. The original upstream recognizer decides, not a new matcher.
export function isOwnWorkoutCSV(text) {
  const header = String(text).replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0]
  return detectSource(parseCSV(header)[0] || []) === 'openGym'
}

export function parseOwnWorkoutCSV(text, options = {}) {
  const parsed = parseWorkoutCSV(text, options)
  const distanceIds = new Set(Object.keys(options.cardioBy || {}).filter(id => options.cardioBy[id] === 'distance').map(canonicalExId))
  if (parsed.error || options.notes === false && !distanceIds.size) return parsed
  // Upstream truncates imported set notes at 140. IronLog's existing editor accepts 500.
  // Restore the source column AFTER parsing, outside the original algorithm, so a CSV round trip
  // cannot silently shorten IronLog notes. No existing workout is visited or changed.
  const rows = parseCSV(text)
  const columns = rows[0].map(s => String(s).trim().toLowerCase().replace(/[ _]+/g, '_'))
  const noteAt = columns.indexOf('set_note')
  const distanceAt = columns.indexOf('distance_km')
  if (noteAt < 0 && !distanceIds.size) return parsed
  const keyOf = (row, header, blankStart = false, blankName = false) => ['date', 'start_time', 'workout', 'exercise_id', 'set']
    .map(k => blankStart && k === 'start_time' || blankName && k === 'workout' ? '' : String(row[header.indexOf(k)] ?? '').trim()).map(s => [s.length, s])
  const key = (row, header, blankStart = false, blankName = false) => JSON.stringify(keyOf(row, header, blankStart, blankName))
  const metadataBySet = new Map()
  const unnamed = new Map(), sourceSessions = new Map(), targetSessions = new Map(), targetIdentities = new Map()
  const countSession = (map, coordinate, session) => { if (!map.has(coordinate)) map.set(coordinate, new Set()); map.get(coordinate).add(session) }
  const remember = (map, coordinate, value) => {
    if (map.has(coordinate) && JSON.stringify(map.get(coordinate)) !== JSON.stringify(value)) map.set(coordinate, null)
    else if (!map.has(coordinate)) map.set(coordinate, value)
  }
  const parsedIds = new Set(parsed.workouts.flatMap(w => w.entries.map(e => e.id)))
  const idAt = columns.indexOf('exercise_id'), nameAt = columns.indexOf('exercise')
  for (const row of rows.slice(1)) {
    const value = String(row[noteAt] ?? '').trim()
    const note = options.notes === false ? '' : /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value
    let metadata = row
    // The original reader may keep this profile's same-named custom exercise under its local
    // ID. Reuse its own identity helper, and only follow IDs actually present in its output.
    // This remaps metadata coordinates, never the exercise or any stored profile record.
    const id = String(row[idAt] ?? '').trim()
    if (!parsedIds.has(id)) {
      const name = String(row[nameAt] ?? '').trim().replace(/^'(?=[=+\-@\t\r])/, '')
      const local = priorCustom(options.customEx, id, name)
      if (local && parsedIds.has(local.id)) { metadata = [...row]; metadata[idAt] = local.id }
    }
    const sourceSession = JSON.stringify(['date','start_time','workout'].map(k => String(metadata[columns.indexOf(k)] ?? '').trim()))
    for (const blankStart of [false, true]) countSession(sourceSessions, key(metadata, columns, blankStart, true), sourceSession)
    // CSV represents distance but not whether it was typed or derived from speed. Restore the
    // column only for this profile's explicit per-exercise distance choice, never by guessing.
    const rawDistance = String(row[distanceAt] ?? '').trim()
    const km = distanceIds.has(canonicalExId(String(metadata[idAt] ?? '').trim())) && rawDistance !== '' ? Number(rawDistance) : NaN
    const hasDistance = Number.isFinite(km) && km >= 0
    if (note || hasDistance) {
      const value = { note, ...(hasDistance ? { km } : {}) }
      remember(metadataBySet, key(metadata, columns), value)
      if (!String(metadata[columns.indexOf('workout')] ?? '').trim()) remember(unnamed, key(metadata, columns, false, true), value)
    }
  }
  const projected = parsed.workouts.map((workout, session) => {
    const state = { unit: options.unit, customEx: [...(options.customEx || []), ...parsed.customEx], workouts: [workout] }
    // Reserialize through upstream too, so formula-protected names/IDs use the same keys.
    const rows = parseCSV(workoutsCSV(state)).slice(1)
    for (const row of rows) for (const blankStart of [false, true]) {
      countSession(targetSessions, key(row, WORKOUT_COLUMNS, blankStart, true), session)
      countSession(targetIdentities, key(row, WORKOUT_COLUMNS, blankStart), session)
    }
    return { workout, rows }
  })
  for (const { workout, rows } of projected) {
    for (const row of rows) {
      let metadata, identified = false
      for (const blankStart of [false, true]) {
        const identity = key(row, WORKOUT_COLUMNS, blankStart)
        if (targetIdentities.get(identity)?.size === 1 && metadataBySet.has(identity)) {
          metadata = metadataBySet.get(identity); identified = true; break
        }
      }
      // The original reader names an unnamed session. Follow only an unambiguous coordinate;
      // never transfer metadata across same-day/same-time sessions with conflicting identities.
      if (!identified) for (const blankStart of [false, true]) {
        const coordinate = key(row, WORKOUT_COLUMNS, blankStart, true)
        if (sourceSessions.get(coordinate)?.size === 1 && targetSessions.get(coordinate)?.size === 1) metadata = unnamed.get(coordinate)
        if (metadata) break
      }
      if (!metadata) continue
      const entry = workout.entries.find(e => e.id === row[WORKOUT_COLUMNS.indexOf('exercise_id')])
      const set = entry?.sets[Number(row[WORKOUT_COLUMNS.indexOf('set')]) - 1]
      if (set && metadata.note) set.note = metadata.note
      if (set && Object.hasOwn(metadata, 'km') && Object.hasOwn(set, 'min') && Object.hasOwn(set, 'speed') && !Object.hasOwn(set, 'km')) set.km = metadata.km
    }
  }
  return parsed
}
