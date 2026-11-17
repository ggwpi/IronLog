// Read-only, strict migration audit for user-owned training records.
// A migration may ADD fields, but it must not remove or change any existing
// training records. This is a safety assertion, not a migration or a backup.
// Run against independent pre/post-migration JSON snapshots in staging.
//
// The audit does not rewrite timestamps, dates, IDs, units, or media pointers.
// It deliberately reports paths, not personal user content.
export const PROTECTED_USER_FIELDS = Object.freeze([
  'workouts', 'routines', 'customEx', 'bodyweight', 'measurements',
  'dayPhotos', 'gymCards', 'equipProfiles', 'favEx', 'exWeights',
  'exNotes', 'dayNotes', 'dayPlan', 'week', 'queue', 'rotation', 'active',
  'deleted', 'mediaPending', 'targetW', 'unit', 'unitSet',
  'muscleTargets', 'showWeeklySetsHome', 'showWorkoutMusclePreview', 'sex', 'birthYear', 'deloadCycle',
  'recoveryHint', 'recoveryHintDay',
  'dailyForm', 'dayForm',
])

const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const plain = value => value !== null && typeof value === 'object'
const limit = 100

function verifyRetained(source, target, path, issues) {
  if (issues.length >= limit) return
  if (Array.isArray(source)) {
    if (!Array.isArray(target)) { issues.push(path + ': array missing or changed type'); return }
    if (source.length > target.length) { issues.push(path + ': existing array entries lost'); return }
    // Preserve exact user records in their original order until an explicitly
    // tested reorder operation exists; do not silently reinterpret workouts.
    for (let i = 0; i < source.length; i++) verifyRetained(source[i], target[i], path + '[' + i + ']', issues)
    return
  }
  if (plain(source)) {
    if (!plain(target) || Array.isArray(target)) { issues.push(path + ': record missing or changed type'); return }
    for (const key of Object.keys(source)) {
      if (!own(target, key)) issues.push(path + '.' + key + ': field removed')
      else verifyRetained(source[key], target[key], path + '.' + key, issues)
      if (issues.length >= limit) return
    }
    return
  }
  if (!Object.is(source, target)) issues.push(path + ': original value changed')
}

/** Compare user-owned fields from before/after a proposed upgrade, without mutating either state. */
export function auditUserDataPreservation(before, after) {
  const issues = []
  if (!plain(before) || Array.isArray(before) || !plain(after) || Array.isArray(after)) {
    return { ok: false, issues: ['profile: expected two JSON objects'] }
  }
  for (const field of PROTECTED_USER_FIELDS) {
    if (!own(before, field)) continue // an upgrade may introduce a new setting
    if (!own(after, field)) issues.push(field + ': field removed')
    else verifyRetained(before[field], after[field], field, issues)
    if (issues.length >= limit) break
  }
  return { ok: issues.length === 0, issues }
}

/** Fail CI / migration verification when any original user record was lost or changed. */
export function assertUserDataPreserved(before, after) {
  const result = auditUserDataPreservation(before, after)
  if (!result.ok) throw new Error('Unsafe IronLog migration:\n' + result.issues.join('\n'))
  return true
}
