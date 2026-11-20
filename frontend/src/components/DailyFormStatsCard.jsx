// openGym 1.4.5 Daily Form overview, in IronLog's existing Stats cards.
// Real check-ins and trend input; the separate health-vitals insight subsystem
// will be ported only after its native data sources are verified.
import { useMemo } from 'react'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { fmtNum, todayISO, isoOf } from '../lib/format.js'
import { Button } from './ui.jsx'
import { formDays, formOf, formScore, offerCheckin } from '../lib/daily-form.js'
import { workoutPerformance, formInsights, insightProgress } from '../lib/form-insights.js'
import { displayScale } from '../lib/effort.js'

export default function DailyFormStatsCard({ S }) {
  const update = useStore(s => s.update)
  const days = formDays(S)
  const offer = offerCheckin(S)
  // No native health permission request or mutation of historical records.
  const perf = useMemo(() => days.length ? workoutPerformance(S) : [],
    [S.workouts, S.unit, S.oneRmFormula, S.bodyweight, days.length])
  const insights = useMemo(() => days.length ? formInsights(S, { perf }) : [],
    [S.dayForm, perf, days.length])
  const progress = days.length ? insightProgress(S, { perf }) : null
  // Explain the GOOD side of every comparison. Saying only "Soreness"
  // would incorrectly imply that higher soreness predicts better workouts.
  const factorLabel = {
    sleepHours: t('After 7 hours of sleep or more'),
    sleep: t('When you rate your sleep 4 or 5'),
    energy: t('When your energy is 4 or 5'),
    sore: t('When soreness is 1 or 2'),
    stress: t('When stress is 1 or 2'),
    form: t('On your good-form days'),
  }
  const signed = (n, digits = 0) =>
    (n > 0 ? '+' : n < 0 ? '−' : '±') + fmtNum(Math.abs(Math.round(n * 10 ** digits) / 10 ** digits))
  const insightValue = x => x.metric === 'effort'
    ? signed(displayScale(S) === 'rpe' ? -x.diff : x.diff, 1) + (displayScale(S) === 'rpe' ? ' RPE' : ' RIR')
    : signed(x.diff) + '%'
  const metricLabel = { strength: t('Estimated strength'), volume: t('Volume'), effort: t('Reps in reserve') }
  const confidenceLabel = {
    chance: t('Could easily be chance'), maybe: t('Leaning that way'),
    consistent: t('Pretty consistent so far'),
  }
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
      {insights.filter(x => !x.flat).slice(0, 3).map(x => <div className="row between"
        data-daily-form-insight={x.factor} key={x.factor + ':' + x.metric}
        style={{ padding: '10px 0', borderTop: 'var(--hair) solid var(--sep)', gap: 8 }}>
        <span style={{ minWidth: 0 }}>
          <strong>{factorLabel[x.factor]}</strong>
          <span className="small muted" style={{ display: 'block', marginTop: 3 }}>
            {metricLabel[x.metric]} · {fmtNum(x.good.n)} / {fmtNum(x.other.n)} {t('workouts')}
            {' · '}{confidenceLabel[x.confidence]}
          </span>
        </span>
        <span style={{ flexShrink: 0 }} className="small">
          {insightValue(x)}
        </span>
      </div>)}
      {progress && !insights.length && <p className="small muted" data-insight-progress>
        {t('Insights show up once there is enough to compare: {0} of {1} workouts so far.',
          fmtNum(Math.min(progress.have, progress.need)), fmtNum(progress.need))}
      </p>}
      {insights.length > 0 && insights.every(x => x.flat) && <p className="small muted">
        {t('So far your good and rough days end in about the same workouts. Nice and steady.')}
      </p>}
      <p className="small muted">{t('Patterns, not proof. Sleep is rarely the only thing that changed that day.')}</p>
    </>}
  </div>
}
