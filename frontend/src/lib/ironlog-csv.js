// IronLog boundaries around the immutable v1.4.5 CSV engines. No profile or storage writes.
import { parseCSV, detectSource, parseWorkoutCSV, priorCustom } from './opengym-v145/import-csv.js'
import { workoutsCSV, WORKOUT_COLUMNS } from './opengym-v145/export-csv.js'

export { workoutsCSV, bodyCSV, csvCounts } from './opengym-v145/export-csv.js'

// Only our own workout format takes the new reader. Existing third-party/XML import paths stay
// on IronLog's current importer. The original upstream recognizer decides, not a new matcher.
export function isOwnWorkoutCSV(text) {
  const header = String(text).replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0]
  return detectSource(parseCSV(header)[0] || []) === 'openGym'
}

export function parseOwnWorkoutCSV(text, options = {}) {
  const parsed = parseWorkoutCSV(text, options)
  if (parsed.error || options.notes === false) return parsed
  // Upstream truncates imported set notes at 140. IronLog's existing editor accepts 500.
  // Restore the source column AFTER parsing, outside the original algorithm, so a CSV round trip
  // cannot silently shorten IronLog notes. No existing workout is visited or changed.
  const rows = parseCSV(text)
  const columns = rows[0].map(s => String(s).trim().toLowerCase().replace(/[ _]+/g, '_'))
  const noteAt = columns.indexOf('set_note')
  if (noteAt < 0) return parsed
  const keyOf = (row, header, blankStart = false) => ['date', 'start_time', 'workout', 'exercise_id', 'set']
    .map(k => blankStart && k === 'start_time' ? '' : String(row[header.indexOf(k)] ?? '').trim()).map(s => [s.length, s])
  const key = (row, header, blankStart = false) => JSON.stringify(keyOf(row, header, blankStart))
  const notes = new Map()
  const parsedIds = new Set(parsed.workouts.flatMap(w => w.entries.map(e => e.id)))
  const idAt = columns.indexOf('exercise_id'), nameAt = columns.indexOf('exercise')
  for (const row of rows.slice(1)) {
    const value = String(row[noteAt] ?? '').trim()
    const note = /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value
    if (!note) continue
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
    notes.set(key(metadata, columns), note)
  }
  for (const workout of parsed.workouts) {
    const state = { unit: options.unit, customEx: [...(options.customEx || []), ...parsed.customEx], workouts: [workout] }
    // Reserialize through upstream too, so formula-protected names/IDs use the same keys.
    for (const row of parseCSV(workoutsCSV(state)).slice(1)) {
      const note = notes.get(key(row, WORKOUT_COLUMNS)) || notes.get(key(row, WORKOUT_COLUMNS, true))
      if (!note) continue
      const entry = workout.entries.find(e => e.id === row[WORKOUT_COLUMNS.indexOf('exercise_id')])
      const set = entry?.sets[Number(row[WORKOUT_COLUMNS.indexOf('set')]) - 1]
      if (set) set.note = note
    }
  }
  return parsed
}
