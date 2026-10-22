import { useNavigate } from 'react-router-dom'
import { t } from '../lib/i18n.js'
import { fmtNum, todayISO } from '../lib/format.js'
import { loadOfRoutine } from '../lib/muscles.js'
import { MUSCLE_NAME } from '../lib/muscles.js'
import { weekTally, queueOf } from '../lib/queue.js'
import { MIN_RATED } from '../lib/effort.js'
import { trainingInsights, VOLUME_REFERENCES, cycleWeeks } from './training.js'
import BodyMap from '../components/BodyMap.jsx'
import Icon from '../components/Icon.jsx'

export function SessionPreview({ S, routines, doneToday, children }) {
  const active = S.active
  const exercises = active ? active.entries || [] : routines.flatMap(r => r.ex || [])
  const load = {}
  const custom = Object.fromEntries((S.customEx || []).map(ex => [ex.id, ex]))
  for (const routine of routines) for (const [muscle, sets] of Object.entries(loadOfRoutine(routine, custom))) load[muscle] = (load[muscle] || 0) + sets
  const count = active ? exercises.reduce((n, e) => n + (e.sets || []).length, 0) : exercises.reduce((n, e) => n + (Number(e.sets) || 1), 0)
  return <section className="iron-session" aria-label={t('Today')}>
    <div className="iron-session-copy">
      {children}
      {exercises.length > 0 && !doneToday && <div className="iron-session-counts">
        <span><b>{exercises.length}</b>{t('Exercises')}</span>
        <span><b>{count}</b>{t('Sets')}</span>
      </div>}
    </div>
    {routines.length > 0 && !active && !doneToday && <div className="iron-session-map" aria-label={t('Planned muscles')}><BodyMap load={load} body={S.body} /></div>}
  </section>
}

export function WeeklyOverview({ S }) {
  const nav = useNavigate()
  const insight = trainingInsights(S)
  const tally = weekTally(S, todayISO())
  return <section className="card iron-overview" aria-label={t('Training overview')}>
    <div className="row between"><h2>{t('Training overview')}</h2><button className="iconbtn" aria-label={t('Stats')} onClick={() => nav('/stats')}><Icon name="chevronRight" /></button></div>
    <div className="iron-metrics">
      <div><b dir="ltr">{tally.done}{tally.planned > 0 ? ` / ${tally.planned}` : ''}</b><span>{t(queueOf(S) ? 'Current round' : 'Workouts this week')}</span></div>
      <div><b>{insight.sets}</b><span>{t('Working sets this week')}</span></div>
      <div><b>{insight.effort.percent == null ? '—' : Math.round(insight.effort.percent) + '%'}</b><span>{t('RIR target this week')}</span></div>
    </div>
    {!insight.workouts.length && <p className="dim small">{t('No workouts logged this week. Your completed sets will appear here.')}</p>}
    {insight.effort.rated < MIN_RATED && <p className="dim small">{t('Rate at least {0} working sets to see RIR target adherence.', MIN_RATED)}</p>}
  </section>
}

export function VolumeReference({ S }) {
  const insight = trainingInsights(S)
  const muscles = Object.keys(VOLUME_REFERENCES).filter(m => insight.planned[m] > 0 || insight.load[m] > 0)
  if (!muscles.length) return null
  return <div className="iron-insight-section" data-volume-reference>
    <h3>{t('Weekly volume reference')}</h3>
    <p className="dim small">{t('Completed / planned effective sets. Reference ranges are planning guidelines, not personal prescriptions.')}</p>
    {muscles.map(m => <div key={m} className="iron-volume-row">
      <div className="row between"><span>{t(MUSCLE_NAME[m])}</span><b dir="ltr">{fmtNum(insight.load[m] || 0)} / {fmtNum(insight.planned[m] || 0)}</b></div>
      <div className="iron-volume-track"><span style={{ width: Math.min(100, (insight.load[m] || 0) / Math.max(VOLUME_REFERENCES[m][1], insight.planned[m] || 0, insight.load[m] || 0) * 100) + '%' }} /></div>
      <div className="dim small">{t('Reference: {0} sets', VOLUME_REFERENCES[m].map(fmtNum).join('–'))}</div>
    </div>)}
  </div>
}

export function EffortTarget({ S }) {
  const { effort } = trainingInsights(S)
  return <div className="iron-insight-section" data-effort-target>
    <h3>{t('Effort target')} · {t('This week')}</h3>
    <div className="iron-reading" dir="ltr">{effort.percent == null ? '—' : Math.round(effort.percent) + '%'}</div>
    <p className="muted small">{t('{0} of {1} rated sets were at RIR 1–2 this week.', effort.inTarget, effort.rated)}</p>
    {effort.percent == null && <p className="dim small">{t('Rate at least {0} working sets to see RIR target adherence.', MIN_RATED)}</p>}
    <p className="dim small">{t('The effort chart also counts hard sets at RIR 3 or less. These are different measures of the same logged sets.')}</p>
  </div>
}

export function WeightTrend({ S }) {
  const { weight } = trainingInsights(S)
  return <div className="iron-insight-section" data-weight-trend>
    <h3>{t('Weekly weight trend')}</h3>
    <div className="iron-reading" dir="ltr">{weight.delta == null ? '—' : (weight.delta > 0 ? '+' : '') + fmtNum(weight.delta)} <small>{t(S.unit)}</small></div>
    <p className="muted small">{t('Last 7-day average versus the previous 7 days, from your weigh-ins.')}</p>
    {weight.delta == null ? <p className="dim small">{t('Log a weigh-in in both weeks to calculate the trend.')}</p> : <p className="dim small">{t('{0} weigh-ins this week · {1} in the previous week', weight.samples, weight.previousSamples)}</p>}
    <p className="dim small">{t('Original mass-gain reference: 0.15–0.30 kg per week. Choose a goal appropriate to you.')}</p>
  </div>
}

export function RecoveryCheckIn({ S }) {
  const { recovery } = trainingInsights(S)
  return <div data-recovery-checkin>
    <h2>{t('Recovery check-in')}</h2>
    <div className="iron-metrics">
      <div><b>{recovery.sleep == null ? '—' : fmtNum(recovery.sleep)}</b><span>{t('Sleep hours')}</span></div>
      <div><b dir="ltr">{recovery.readiness == null ? '—' : fmtNum(recovery.readiness) + ' / 7'}</b><span>{t('Readiness')}</span></div>
    </div>
    <p className="dim small">{t('Last 7 days. Self-reported check-ins complement the fatigue map; they do not change its calculation.')}</p>
  </div>
}

export function TrainingCycle({ S }) {
  const weeks = cycleWeeks(S)
  if (!weeks.length) return null
  return <section className="card" data-training-cycle>
    <h2>{S.ironlogCycle.name || t('Training cycle')}</h2>
    <div className="iron-cycle">{weeks.map(w => <div key={w.number} className={w.current ? 'current' : ''}>
      <span>{t('Week {0}', w.number)}</span><b>{w.sessions}</b><small>{t('Workouts')}</small>
    </div>)}</div>
    <p className="dim small">{t('Actual logged sessions per cycle week. Elapsed time does not mark a week as completed.')}</p>
  </section>
}
