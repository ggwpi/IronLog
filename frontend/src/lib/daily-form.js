// openGym 1.4.5 daily-form model: check-in persistence, scoring and deload input.
// This feature is ADDITIVE. It does not migrate or reinterpret IronLog workouts.
// The lighter-session adaptation and native health vitals remain a separate
// release gate; never pretend a user's weights were adjusted.
import { setDailyFormSource } from './deload-cycle.js'

export const FORM_KEYS = ['sleep', 'energy', 'sore', 'stress']
const INVERTED = new Set(['sore', 'stress'])
export const ROUGH_AT = 2.5

const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)
const rating = v => Number.isInteger(v) && v >= 1 && v <= 5 ? v : null
const healthOn = S => S?.modules?.health !== false

/** Copy the upstream 1–5 model, rejecting invalid numbers and unknown fields. */
export function readForm(entry) {
  if (!isMap(entry)) return null
  const out = {}
  let any = false
  for (const k of FORM_KEYS) {
    out[k] = rating(entry[k])
    if (out[k] != null) any = true
  }
  if (!any) return null
  out.lighter = entry.lighter === 'load' || entry.lighter === 'sets' ? entry.lighter : null
  return out
}

export const formOf = (S, iso) => readForm(isMap(S?.dayForm) ? S.dayForm[iso] : null)

export function formDays(S) {
  const map = isMap(S?.dayForm) ? S.dayForm : {}
  return Object.keys(map).sort().map(d => {
    const f = readForm(map[d])
    return f ? { d, ...f } : null
  }).filter(Boolean)
}

export function formScore(f) {
  if (!f) return null
  const vals = FORM_KEYS.map(k => f[k] == null ? null : INVERTED.has(k) ? 6 - f[k] : f[k]).filter(v => v != null)
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
}

export function isRough(f) {
  return !!f && FORM_KEYS.filter(k => f[k] != null).length >= 2 && formScore(f) <= ROUGH_AT
}

export function checkinMode(S, today) {
  if (!S || !healthOn(S) || S.dailyForm !== true) return null
  return formOf(S, today) ? null : 'ask'
}

export const offerCheckin = S => !!S && healthOn(S) && S.dailyForm == null && (S.workouts || []).length >= 3

/** Make one timestamped daily answer, retaining independent answers from other days. */
export function withForm(map, iso, form, now = Date.now()) {
  const clean = readForm(form)
  const entry = { _ts: now }
  if (clean) {
    for (const k of FORM_KEYS) if (clean[k] != null) entry[k] = clean[k]
    if (clean.lighter) entry.lighter = clean.lighter
  }
  return { ...(isMap(map) ? map : {}), [iso]: entry }
}

export function sleepRatingOf(hours) {
  const h = Number(hours)
  if (!(h > 0)) return null
  if (h < 5) return 1
  if (h < 6) return 2
  if (h < 7) return 3
  if (h < 8) return 4
  return 5
}

/** Score 0..1 used by openGym's performance-based deload recommendation. */
export function dailyFormSource(S, from, to) {
  if (!S || !healthOn(S)) return []
  return formDays(S).filter(f => f.d >= from && f.d <= to)
    .map(f => ({ d: f.d, score: Math.round(((formScore(f) - 1) / 4) * 100) / 100 }))
}

/** Register once during startup; also safe to call again in tests/HMR. */
export const registerDailyFormSource = () => setDailyFormSource(dailyFormSource)
