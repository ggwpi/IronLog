// openGym 1.4.5 deload logic rendered with IronLog's actual card, button
// and settings-row design. No openGym components, styles or alternate nav.
import { useMemo } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { todayISO, fmtDate, weekKey, weekStartOf } from '../lib/format.js'
import {
  deloadCycleOf, deloadWhy, nextDeloadWeek, deloadSuggestion, plusWeeks,
  pushBack, skipDeload, addDeload, dismissSuggestion,
  setDeloadEvery, setDeloadAuto, EVERY_CHOICES, DELOAD_SET_SHARE,
} from '../lib/deload-cycle.js'
import { Button, Row, Segmented, Switch } from './ui.jsx'

const pct = Math.round((1 - DELOAD_SET_SHARE) * 100)

export default function DeloadWeekCard({ S }) {
  const today = todayISO()
  const update = useStore(s => s.update)
  const view = useMemo(() => {
    const cur = weekKey(today, weekStartOf(S))
    if (deloadWhy(S, cur)) return { kind: 'now', week: cur }
    const next = plusWeeks(cur, 1)
    if (deloadWhy(S, next)) return { kind: 'next', week: next }
    const suggestion = deloadSuggestion(S, today)
    return suggestion ? { kind: 'ask', week: suggestion.week, reason: suggestion.reason } : null
  }, [S.deloadCycle, S.workouts, S.weekStart, today])
  if (!view) return null

  const change = (fn, message) => {
    // The user's prior choice is reversible even when no deload field existed.
    const before = S.deloadCycle ? structuredClone(S.deloadCycle) : null
    update(s => fn(s))
    useUI.getState().toast(message, {
      action: t('Undo'),
      onAction: () => update(s => {
        if (before) s.deloadCycle = structuredClone(before)
        else delete s.deloadCycle
      }),
    })
  }

  if (view.kind === 'ask') {
    const explanation = view.reason === 'both'
      ? t('Your numbers dipped for two weeks and your check-ins say tired.')
      : view.reason === 'form'
        ? t('Your check-ins say tired, and the numbers are not climbing.')
        : t('Your numbers dipped for two weeks running.')
    return <div className="card" data-deload="ask">
      <h2>{t('Deload week?')}</h2>
      <div className="muted small" style={{ margin: '7px 0 10px' }}>
        {t('A lighter week might do more than a harder one.')} {explanation}
      </div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Button size="sm" variant="tinted" onClick={() => change(s => addDeload(s, view.week), t('Next week is a deload. Enjoy it.'))}>
          {t('Make next week one')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => change(s => dismissSuggestion(s, today), t('Fair enough. Asking again next week.'))}>
          {t('Not now')}
        </Button>
      </div>
    </div>
  }

  const now = view.kind === 'now'
  return <div className="card" data-deload={view.kind}>
    <h2>{t(now ? 'Deload week' : 'Next week: deload')}</h2>
    <div className="muted small" style={{ margin: '7px 0 10px' }}>
      {now ? t('{0}% fewer sets, same weights. Recharge.', pct)
        : t('Next week runs {0}% fewer sets. Same weights.', pct)}
      {' '}{now ? t('It stays out of your progression, so nothing goes up or down.')
        : t('Starts {0}.', fmtDate(view.week))}
    </div>
    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      <Button size="sm" icon="calendar" variant="tinted"
        onClick={() => change(s => pushBack(s, view.week), t('Moved to the week of {0}.', fmtDate(plusWeeks(view.week, 1))))}>
        {t('Push it back a week')}
      </Button>
      <Button size="sm" variant="ghost"
        onClick={() => change(s => skipDeload(s, view.week), now ? t('Full week it is.') : t('Skipped. Next week trains as usual.'))}>
        {t(now ? 'Not this week' : 'Skip this one')}
      </Button>
    </div>
  </div>
}

export function DeloadSettingsRows() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const cycle = deloadCycleOf(S)
  const next = cycle.every ? nextDeloadWeek(S) : null
  return <>
    <Row icon="battery" iconTint="var(--indigo)" title={t('Deload weeks')}
      subtitle={cycle.every ? (next
        ? t('Every {0} weeks. Next one: week of {1}.', cycle.every, fmtDate(next))
        : t('Every {0} weeks.', cycle.every)) : t('A lighter week on a rhythm, no programme needed.')}>
      <Segmented className="seg-inline" value={String(cycle.every)}
        options={EVERY_CHOICES.map(n => ({ value: String(n), label: n ? String(n) : t('Off') }))}
        onChange={value => update(s => setDeloadEvery(s, Number(value)))} />
    </Row>
    <Row icon="sparkles" iconTint="var(--indigo)"
      title={t('Suggest a deload when I need one')}
      subtitle={t('When your numbers dip two weeks running (and your check-ins say tired, if you log them), Home asks.')}>
      <Switch aria-label={t('Suggest a deload when I need one')} checked={cycle.auto}
        onChange={enabled => update(s => setDeloadAuto(s, enabled))} />
    </Row>
  </>
}
