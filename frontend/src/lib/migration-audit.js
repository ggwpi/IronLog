// Read-only preservation audits: selected training fields for compatibility tests, and a
// complete JSON snapshot gate below for actual migration verification.
// A migration may ADD fields, but it must not remove or change any existing
// training records. This is a safety assertion, not a migration or a backup.
// Use auditCompleteProfilePreservation for independent pre/post-migration JSON snapshots.
//
// The audit does not rewrite timestamps, dates, IDs, units, or media pointers.
// It deliberately reports paths, not personal user content.
export const PROTECTED_USER_FIELDS = Object.freeze([
  'workouts', 'routines', 'customEx', 'bodyweight', 'measurements',
  'dayPhotos', 'gymCards', 'equipProfiles', 'favEx', 'exWeights',
  'exNotes', 'dayNotes', 'dayPlan', 'week', 'queue', 'rotation', 'active',
  'deleted', 'mediaPending', 'targetW', 'unit', 'unitSet',
  'muscleTargets', 'showWeeklySetsHome', 'showWorkoutMusclePreview', 'showWorkoutsLeftHome', 'weekTarget', 'setTrend', 'sex', 'birthYear', 'deloadCycle',
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

/** Selected-field compatibility assertion; use the complete snapshot gate for release audits. */
export function assertUserDataPreserved(before, after) {
  const result = auditUserDataPreservation(before, after)
  if (!result.ok) throw new Error('Unsafe IronLog migration:\n' + result.issues.join('\n'))
  return true
}

// The selected-field helper above also supports tests of intentional UI edits. A migration
// release gate needs more: every existing root field, including custom/future fields and settings.
// Only the two protocol clocks can advance; they cannot disappear, change type or go backwards.
const protocolClocks = new Set(['_ts', '_rev'])
function isJsonValue(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (!plain(value) || ancestors.has(value)) return false
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false
  ancestors.add(value)
  const keys = Object.keys(value)
  const array = Array.isArray(value)
  const valid = Reflect.ownKeys(value).length === keys.length + (array ? 1 : 0) &&
    (!array || keys.length === value.length && keys.every((k, i) => k === String(i))) &&
    keys.every(k => { const descriptor = Object.getOwnPropertyDescriptor(value, k); return !descriptor.get && !descriptor.set && isJsonValue(descriptor.value, ancestors) })
  ancestors.delete(value)
  return valid
}

/** Strict, read-only gate for complete before/after JSON snapshots, not intentional UI edits. */
export function auditCompleteProfilePreservation(before, after) {
  if (!plain(before) || Array.isArray(before) || !plain(after) || Array.isArray(after) || !isJsonValue(before) || !isJsonValue(after)) {
    return { ok: false, issues: ['profile: expected two complete JSON objects'] }
  }
  const issues = []
  for (const field of Object.keys(before)) {
    if (!own(after, field)) issues.push(field + ': field removed')
    else if (protocolClocks.has(field) && typeof before[field] === 'number' && Number.isFinite(before[field])) {
      if (typeof after[field] !== 'number' || after[field] < before[field]) issues.push(field + ': protocol clock regressed or changed type')
    } else verifyRetained(before[field], after[field], field, issues)
    if (issues.length >= limit) break
  }
  return { ok: issues.length === 0, issues }
}
