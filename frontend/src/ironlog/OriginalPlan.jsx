import { useStore } from '../store/useStore.js'
import { addOriginalPlan } from './preset.js'

export default function OriginalPlan() {
  const loaded = useStore(s => s.S.routines.some(r => r.ironlogPresetDay != null))
  const update = useStore(s => s.update)
  if (loaded) return null
  return <div className="card" dir="rtl">
    <h2>תוכנית IronLog המקורית</h2>
    <p className="muted small">שישה ימים, תרגילים וטווחי חזרות מהתוכנית המקורית שלך. מתווספת לתכנון הקיים.</p>
    <button className="btn" type="button" onClick={() => update(addOriginalPlan)}>הוספת תוכנית IronLog</button>
  </div>
}
