// A one-time language preference upgrade, including existing accounts and installed PWAs.
// Workout records, loads, exercise IDs and user-written text are left intact.
export const HEBREW_UI_VERSION = 1
export function needsHebrewPreferences(state) {
  return (state?.ironlogHebrewVersion || 0) < HEBREW_UI_VERSION
}
export function applyHebrewPreferences(state) {
  if (!needsHebrewPreferences(state)) return false
  state.lang = 'he'
  state.langAuto = false
  state.enParens = { ...state.enParens, he: false }
  state.enOnly = { ...state.enOnly, he: false }
  const originalNames = { 'PUSH A': 'דחיפה א׳', 'PULL A': 'משיכה א׳', 'LEGS A': 'רגליים א׳', 'PUSH B': 'דחיפה ב׳', 'PULL B': 'משיכה ב׳', 'LEGS B': 'רגליים ב׳', ARMS: 'ידיים' }
  for (const routine of state.routines || []) {
    if (routine.ironlogPresetDay != null && originalNames[routine.name]) routine.name = originalNames[routine.name]
  }
  if (!(state.workouts?.length || state.routines?.length)) state.weekStart = 0
  state.ironlogHebrewVersion = HEBREW_UI_VERSION
  return true
}
