// Original calculations; preserve IronLog/future metadata at the write/merge boundary.
import * as original from './opengym-v145/weigh-ins.js'
export * from './opengym-v145/weigh-ins.js'
const readingKeys = new Set(['id', 'at', 'w', 't', 'src', 'sid'])
const dayKeys = new Set(['d', 'w', 't', 'src', 'ins', 'gone'])
const extra = (value, known) => Object.fromEntries(Object.entries(value || {}).filter(([k]) => !known.has(k)))
const key = (d, id) => `${d}\0${id}`
const list = value => Array.isArray(value) ? value : []
const assignMetadata = (target, saved) => {
  for (const [name, value] of Object.entries(saved || {})) Object.defineProperty(target, name, { value, enumerable: true, configurable: true, writable: true })
}
function metadata(S) {
  const out = new Map()
  for (const day of list(S.bodyweight)) for (const r of list(day?.ins)) if (r?.id != null) out.set(key(day.d, r.id), extra(r, readingKeys))
  return out
}
function restoreMetadata(S, saved) {
  for (const day of list(S.bodyweight)) for (const r of list(day?.ins)) if (r && typeof r === 'object') assignMetadata(r, saved.get(key(day.d, r.id)))
}
function write(S, action, augment) {
  const saved = metadata(S)
  augment?.(saved)
  const result = action()
  restoreMetadata(S, saved)
  return result
}
export const withWeighInMetadata = write
export const addWeighIn = (S, ...args) => write(S, () => original.addWeighIn(S, ...args))
export const settleAll = (S, ...args) => write(S, () => original.settleAll(S, ...args))
export function editWeighIn(S, d, id, change = {}, ...args) {
  const source = list(S.bodyweight).find(day => day?.d === d)
  const reading = original.readingsOf(source).find(r => r.id === String(id))
  if (!reading) return null
  const to = change.d ?? d, moving = to !== d
  const target = moving ? list(S.bodyweight).find(day => day?.d === to) : source
  const at = change.at !== undefined ? original.cleanTime(change.at) : reading.at
  const w = change.w != null ? change.w : reading.w
  // A move must not become the original writer's same-time correction of a different
  // reading. Legacy reading ids are day-scoped, so an id collision needs a fresh id.
  const targetReadings = moving ? original.readingsOf(target) : []
  if (moving && at && targetReadings.some(r => r.at === at)) return null
  const carried = moving && original.readingsOf(source).length === 1 ? extra(source, dayKeys) : {}
  if (Object.entries(carried).some(([name, value]) => target && Object.hasOwn(target, name) && JSON.stringify(target[name]) !== JSON.stringify(value))) return null
  const collision = moving && targetReadings.some(r => r.id === String(id))
  const nextId = collision ? original.newReadingId() : String(id)
  const replacement = { ...reading, d: to, at, w, id: nextId, t: args[0] ?? Date.now(), src: null }
  if (!original.addWeighIn({ bodyweight: [] }, replacement)) return null
  let result
  if (collision) {
    const undo = removeWeighIn(S, d, id, ...args)
    if (!undo) return null
    const added = addWeighIn(S, replacement, args[1])
    assignMetadata(added, extra(undo.reading, readingKeys))
    result = { d: to, id: added.id }
  } else result = write(S, () => original.editWeighIn(S, d, id, change, ...args), saved => {
    if (change.d && change.d !== d) saved.set(key(change.d, id), saved.get(key(d, id)) || {})
  })
  if (result && moving && !S.bodyweight.some(day => day.d === d)) assignMetadata(S.bodyweight.find(day => day.d === to), carried)
  return result
}
export function removeWeighIn(S, d, id, ...args) {
  const saved = metadata(S), undo = write(S, () => original.removeWeighIn(S, d, id, ...args))
  if (undo?.reading) assignMetadata(undo.reading, saved.get(key(d, id)))
  return undo
}
export const restoreWeighIn = (S, undo, ...args) => write(S, () => original.restoreWeighIn(S, undo, ...args), saved => {
  if (undo?.reading) saved.set(key(undo.d, undo.reading.id), extra(undo.reading, readingKeys))
})
export function mergeDay(a, b, mode) {
  const result = original.mergeDay(a, b, mode)
  if (!result) return result
  const olderFirst = Number(b.t) > Number(a.t) ? [a, b] : [b, a]
  const saved = new Map()
  const stamps = new Map()
  for (const day of [b, a]) for (const r of list(day.ins)) if (r?.id != null) {
    const k = key(day.d, r.id), before = saved.get(k) || {}, incoming = extra(r, readingKeys)
    saved.set(k, Number(r.t) >= (stamps.get(k) || 0) ? { ...before, ...incoming } : { ...incoming, ...before })
    stamps.set(k, Math.max(stamps.get(k) || 0, Number(r.t) || 0))
  }
  const out = { ...extra(olderFirst[0], dayKeys), ...extra(olderFirst[1], dayKeys), ...result }
  restoreMetadata({ bodyweight: [out] }, saved)
  return out
}
