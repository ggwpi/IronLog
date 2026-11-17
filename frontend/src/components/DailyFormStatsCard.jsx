// openGym 1.4.5 Daily Form overview, in IronLog's existing Stats cards.
// Real check-ins and trend input; the separate health-vitals insight subsystem
// will be ported only after its native data sources are verified.
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { fmtNum, todayISO, isoOf } from '../lib/format.js'
import { Button } from './ui.jsx'
import { formDays, formOf, formScore, offerCheckin } from '../lib/daily-form.js'

export default function DailyFormStatsCard({ S }) {
  const update = useStore(s => s.update)
  const days = formDays(S)
  const offer = offerCheckin(S)
  if (!days.length && S.dailyForm !== true && !offer) return null
  const today = formOf(S, todayISO())
  const start = new Date()
  start.setDate(start.getDate() - 13)
  const recent = days.filter(day => day.d >= isoOf(start))
  const average = recent.length
    ? recent.reduce((n, row) => n + formScore(row), 0) / recent.length : null

  return <div className="card" data-daily-form-stats>
    <h2>{t('Daily form')}</h2>
    {offer && !days.length && S.dailyForm == null ? <>
      <p className="muted small" style={{ margin: '8px 0' }}>
        {t('Check in before workouts?')} {t('Sleep')} · {t('Energy')} · {t('Soreness')} · {t('Stress')}
      </p>
      <div className="row" style={{ gap: 8 }}>
        <Button size="sm" variant="tinted"
          onClick={() => update(s => { s.dailyForm = true })}>{t('Turn it on')}</Button>
        <Button size="sm" variant="ghost"
          onClick={() => update(s => { s.dailyForm = false })}>{t('Not for me')}</Button>
      </div>
    </> : <>
      <div className="row between" style={{ padding: '8px 0' }}>
        <span className="muted">{t('Today')}</span>
        <span>{today ? fmtNum(formScore(today)) + ' / 5' : '–'}</span>
      </div>
      <div className="row between" style={{ padding: '8px 0', borderTop: 'var(--hair) solid var(--sep)' }}>
        <span className="muted">{t('Daily form')} · 14</span>
        <span>{fmtNum(recent.length)} {t('check-ins')}</span>
      </div>
      {average !== null && <div className="row between" style={{ padding: '8px 0', borderTop: 'var(--hair) solid var(--sep)' }}>
        <span className="muted">{t('Average')}</span><span>{fmtNum(Math.round(average * 10) / 10)} / 5</span>
      </div>}
      <p className="small muted">{t('Patterns, not proof. Sleep is rarely the only thing that changed that day.')}</p>
    </>}
  </div>
}
