import { t } from '../lib/i18n-core.js'
import { uid } from '../lib/format.js'
import preset from './preset.json'

const localizePrescription = note => {
  const target = note.split(' · ')[0]
  const label = target === 'AMRAP' ? 'כמה שיותר חזרות' : target === 'duration' ? 'החזקה לפי התכנון' : '\u2066' + target + '\u2069'
  return label + ' · רזרבה של \u20661–2\u2069 חזרות'
}
export function addOriginalPlan(S) {
  if (S.effort == null) S.effort = 'rir'
  S.customEx = S.customEx || []
  for (const exercise of preset.customEx) if (!S.customEx.some(e => e.id === exercise.id)) S.customEx.push(structuredClone(exercise))
  S.routines = S.routines || []
  S.week = S.week || {}
  for (const source of preset.routines) {
    const { day, ...routine } = structuredClone(source)
    const existing = S.routines.find(r => r.ironlogPresetDay === day)
    if (existing) continue
    const id = uid()
    S.routines.push({ ...routine, name: t(routine.name), ex: routine.ex.map(e => ({ ...e, note: localizePrescription(e.note) })), id, ironlogPresetDay: day })
    // Add to the day; never overwrite any routine that was already scheduled.
    S.week[day] = [...new Set([].concat(S.week[day] || [])), id]
  }
}

