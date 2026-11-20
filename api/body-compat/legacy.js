// Compatibility boundary only. Business calculations use the unchanged pinned upstream model.
import { absorbLegacyEdit, dailyModeOf, dailyValue, readingsOf } from './weigh-ins.js'
import { convertBodyWeight } from './units.js'

const copy = x => structuredClone(x)
const map = x => x && typeof x === 'object' && !Array.isArray(x)
const list = x => Array.isArray(x) ? x : []
const legacyFields = ['neck', 'shoulders', 'chest', 'waist', 'hips', 'abdomen',
  'upperArmLeft', 'upperArmRight', 'forearmLeft', 'forearmRight', 'wristLeft', 'wristRight',
  'thighLeft', 'thighRight', 'calfLeft', 'calfRight', 'ankleLeft', 'ankleRight', 'bodyFat']
const known = new Set(['d', 't', 'other', ...legacyFields])
const positive = value => Number.isFinite(Number(value)) && Number(value) > 0
const visible = day => legacyFields.some(k => positive(day[k])) || list(day.other).some(x => positive(x?.value))
function preserve(old, next, except = new Set()) {
  for (const key of Object.keys(old)) if (!except.has(key) && !(key in next)) {
    Object.defineProperty(next, key, { value: copy(old[key]), enumerable: true, writable: true, configurable: true })
  }
}

export function protectLegacyBodyData(current, next) {
  for (const key of ['weighInTimes', 'bwDaily', 'measureUnit']) if (key in current) next[key] = copy(current[key])
  const weights = new Map(list(current.bodyweight).filter(map).map(x => [x.d, x]))
  const from = current.unit === 'lb' ? 'lb' : 'kg', to = next.unit === 'lb' ? 'lb' : 'kg'
  for (const day of list(next.bodyweight)) {
    const old = weights.get(day?.d)
    if (!map(day) || !Array.isArray(old?.ins)) continue
    preserve(old, day, new Set(['d', 'w', 't', 'src']))
    day.ins = copy(old.ins)
    if (from !== to) for (const reading of day.ins) if (map(reading)) reading.w = convertBodyWeight(reading.w, from, to)
    // A mirror-only unit conversion is not a new reading. Genuine old-UI edits use upstream rules.
    if (day.w !== convertBodyWeight(old.w, from, to)) absorbLegacyEdit(day, dailyModeOf(next))
    else if (from !== to) day.w = dailyValue(readingsOf(day), dailyModeOf(next))
  }
  const definitions = new Map(list(current.customMeasurements).filter(map).map(x => [x.id, x]))
  for (const definition of list(next.customMeasurements)) {
    const old = definitions.get(definition?.id)
    if (old && map(definition)) preserve(old, definition, new Set(['id', 'name', 'enabled']))
  }
  const days = new Map(list(current.measurements).filter(map).map(x => [x.d, x]))
  if (!Array.isArray(next.measurements)) {
    if (!days.size) return next
    next.measurements = []
  }
  for (const day of next.measurements) {
    const old = days.get(day?.d)
    if (!map(day) || !old) continue
    preserve(old, day, known)
    const others = new Map(list(old.other).filter(map).map(x => [x.id, x]))
    for (const item of list(day.other)) {
      const prior = others.get(item?.id)
      if (!prior || !map(item)) continue
      preserve(prior, item, new Set(['id', 'name', 'value']))
      // An old length-only editor cannot convert a typed value safely.
      if (prior.unit && item.value != null) item.value = prior.value
    }
    // Old normalization removes zero-score rows even though zero is meaningful in the new model.
    for (const item of list(old.other)) if (item?.unit && Number(item.value) === 0 && !list(day.other).some(x => x?.id === item.id)) {
      if (!Array.isArray(day.other)) day.other = []
      day.other.push(copy(item))
    }
  }
  const held = new Set(next.measurements.map(x => x?.d))
  for (const day of days.values()) if (!held.has(day.d) && !visible(day) &&
    (day.bpSys != null || day.bpDia != null || day.pulse != null || day.note != null || list(day.other).some(x => x?.unit))) {
    next.measurements.push(copy(day))
  }
  return next
}
