// The openGym Recovery Hint logic in the *existing* IronLog Home-card design.
// No new palette, navigation bar, custom sheet system or global CSS.
import { useMemo } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { lastBW } from '../lib/history.js'
import { fatigueOf, LB_TO_KG } from '../lib/recovery.js'
import { recoveryHint, hintText } from '../lib/recovery-hint.js'
import { dayOverrideSheet } from '../sheets.jsx'
import { Button } from './ui.jsx'
import Icon from './Icon.jsx'

export default function RecoveryHintCard({ S }) {
  const today = todayISO()
  const hint = useMemo(() => {
    // New Home surface is deliberately opt-in; unchanged users retain the
    // exact same Home layout, cards, greeting and loading/transitions.
    if (S.recoveryHint !== true || S.recoveryHintDay === today) return null
    const now = Date.now()
    const bw = lastBW(S)
    const bodyweightKg = bw?.w > 0 ? bw.w * (S.unit === 'lb' ? LB_TO_KG : 1) : undefined
    return recoveryHint(S, {
      now, today,
      fatigue: fatigueOf(S.workouts, now, { bodyweightKg, unit: S.unit }),
    })
  }, [S.recoveryHint, S.recoveryHintDay, S.workouts, S.active,
    S.routines, S.week, S.dayPlan, S.queue, S.bodyweight, S.unit, today])
  const words = hintText(hint, today)
  if (!words) return null

  const dismiss = () => {
    useStore.getState().update(s => { s.recoveryHintDay = today })
    useUI.getState().toast(t('Hidden for today. Back tomorrow.'), {
      action: t('Undo'),
      onAction: () => useStore.getState().update(s => { s.recoveryHintDay = null }),
    })
  }

  return <div className="card" data-recovery-hint={hint.kind}>
    <div className="row between" style={{ gap: 10, alignItems: 'flex-start' }}>
      <span className="lrow-i" style={{ '--tint': 'var(--green)' }}><Icon name="figureStrength" /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="small muted">{t('Recovery')}</div>
        <h2 style={{ margin: '4px 0' }}>{words[0]}</h2>
        <div className="small muted">{words[1]}</div>
      </div>
      <button type="button" className="iconbtn"
        aria-label={t('Hide for today')} onClick={dismiss}><Icon name="xmark" /></button>
    </div>
    {hint.kind === 'lighter' && <div style={{ marginTop: 10 }}>
      <Button size="sm" variant="tinted" icon="swap"
        onClick={() => dayOverrideSheet(today)}>{t('Swap session')}</Button>
    </div>}
  </div>
}
