import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { todayISO } from '../lib/format.js'

export default function TheorySettings() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [saved, setSaved] = useState('')
  function checkIn(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const sleep = data.get('sleep')
    const readiness = data.get('readiness')
    if (sleep === '' && readiness === '') return
    update(s => {
      const row = { measured_at: todayISO(), sleep_minutes: sleep === '' ? null : Math.round(Number(sleep) * 60), readiness: readiness === '' ? null : Number(readiness) }
      s.ironlogRecovery = [...(s.ironlogRecovery || []).filter(r => r.measured_at !== row.measured_at), row].sort((a,b) => a.measured_at.localeCompare(b.measured_at))
    })
    setSaved('הצ׳ק אין נשמר')
  }
  function cycle(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const weeks = Number(data.get('weeks'))
    update(s => { s.ironlogCycle = { name: String(data.get('name')), starts_on: String(data.get('start')), planned_weeks: weeks } })
    setSaved('המחזור נשמר')
  }
  return <details className="card ironlog-theory" dir="rtl">
    <summary>⚡ IronLog · התאוששות ומחזור אימון</summary>
    <p className="muted small">טווחי הנפח, RIR של 1–2 ועלייה של 0.15–0.30 ק״ג לשבוע הם כללי התכנון המקוריים שלך. מפות ההתאוששות וחוקי ההתקדמות של openGym מופיעים בהמשך.</p>
    <form onSubmit={checkIn} className="ironlog-form">
      <h3>צ׳ק אין יומי</h3>
      <label>שעות שינה <input name="sleep" type="number" min="0" max="24" step="0.1" /></label>
      <label>מוכנות (1–7) <input name="readiness" type="number" min="1" max="7" step="1" /></label>
      <button className="btn" type="submit">שמירת צ׳ק אין</button>
    </form>
    <form onSubmit={cycle} className="ironlog-form">
      <h3>מחזור אימון</h3>
      <label>שם <input name="name" required maxLength="100" defaultValue={S.ironlogCycle?.name || 'Hypertrophy'} /></label>
      <label>תאריך התחלה <input name="start" type="date" required defaultValue={S.ironlogCycle?.starts_on || todayISO()} /></label>
      <label>שבועות <input name="weeks" type="number" min="1" max="52" required defaultValue={S.ironlogCycle?.planned_weeks || 12} /></label>
      <p className="muted small">סימון Deload בשבועות 4, 8 ו־12 הוא תזכורת בווידג׳ט. שנה את עומסי האימון בתוכנית בנפרד.</p>
      <button className="btn" type="submit">שמירת מחזור</button>
    </form>
    <p role="status">{saved}</p>
  </details>
}
