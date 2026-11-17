// openGym weekly-set targets presented with IronLog's existing card, row, and
// bottom-sheet components. Never replaces any existing IronLog layout or styles.
import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import {
  weeklyMuscleSets, targetOf, withTarget, TARGET_MUSCLES, TARGET_MAX,
} from '../lib/muscle-targets.js'
import { MUSCLE_NAME } from '../lib/muscles-v145.js'
import { Button, Stepper } from './ui.jsx'

const ROW_LIMIT = 5
const labelOf = row => t(row.name || MUSCLE_NAME[row.slug] || row.slug)

function MuscleTargetsEditor() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const change = (slug, values) => update(s => {
    const next = withTarget(s.muscleTargets, slug, values)
    if (Object.keys(next).length) s.muscleTargets = next
    else delete s.muscleTargets
  })
  const own = !!S.muscleTargets && Object.keys(S.muscleTargets).length > 0
  return <div data-muscle-targets-editor>
    <h3>{t('Weekly muscle volume')}</h3>
    <div className="muted small" style={{ margin: '4px 0 12px' }}>
      {t('Goal')} · {t('Work sets')} · {t('This week')}
    </div>
    <div className="sect-b">
      {TARGET_MUSCLES.map(slug => {
        const [lo, hi] = targetOf(S, slug)
        return <div className="row between" key={slug}
          style={{ padding: '10px 0', gap: 8, flexWrap: 'wrap', borderBottom: 'var(--hair) solid var(--sep)' }}>
          <span style={{ minWidth: 92, flex: 1 }}>{t(MUSCLE_NAME[slug])}</span>
          <div className="row" style={{ gap: 7 }}>
            <Stepper ariaLabel={t(MUSCLE_NAME[slug]) + ': ' + t('Min')} value={lo}
              step={1} min={0} max={TARGET_MAX} decimal={false}
              onChange={value => change(slug, [value, Math.max(value, hi)])} />
            <span className="dim" aria-hidden="true">–</span>
            <Stepper ariaLabel={t(MUSCLE_NAME[slug]) + ': ' + t('Max')} value={hi}
              step={1} min={0} max={TARGET_MAX} decimal={false}
              onChange={value => change(slug, [Math.min(lo, value), value])} />
          </div>
        </div>
      })}
    </div>
    {own && <div style={{ marginTop: 12 }}>
      <Button icon="reset" variant="ghost" onClick={() => update(s => { delete s.muscleTargets })}>
        {t('Reset')}
      </Button>
    </div>}
  </div>
}

export const muscleTargetsSheet = () => useUI.getState().openSheet(() => <MuscleTargetsEditor />)

export default function WeeklyMuscleTargetsCard({ S }) {
  const [expanded, setExpanded] = useState(false)
  const rows = weeklyMuscleSets(S)
  if (!rows.some(row => row.sets > 0) && !S.muscleTargets) return null
  const shown = expanded ? rows : rows.slice(0, ROW_LIMIT)
  return <div className="card" data-weekly-muscle-targets>
    <div className="row between" style={{ gap: 10, marginBottom: 6 }}>
      <div>
        <h2 style={{ margin: 0 }}>{t('Weekly muscle volume')}</h2>
        <div className="muted small" style={{ marginTop: 2 }}>{t('Completed')} · {t('Work sets')}</div>
      </div>
      <Button icon="target" size="sm" onClick={muscleTargetsSheet}>{t('Goal')}</Button>
    </div>
    {shown.map(row => {
      const amount = Math.min(1, row.sets / Math.max(1, row.hi))
      return <div className="mrow" key={row.slug} data-target-muscle={row.slug}>
        <span className="nm">{labelOf(row)}</span>
        <span className="bar" role="progressbar" aria-label={labelOf(row)}
          aria-valuemin={0} aria-valuemax={row.hi}
          aria-valuenow={Math.min(row.hi, row.sets)}>
          <i style={{ width: Math.round(amount * 100) + '%' }} />
        </span>
        <span className="v" style={row.status === 'above' ? { color: 'var(--orange)' } :
          row.status === 'in' ? { color: 'var(--green)' } : undefined}>
          {fmtNum(row.sets)} / {row.lo}–{row.hi}
        </span>
      </div>
    })}
    {rows.length > ROW_LIMIT && <div style={{ marginTop: 8 }}>
      <Button trailingIcon={expanded ? 'chevronUp' : 'chevronDown'} size="sm"
        variant="ghost" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {t(expanded ? 'Show less' : 'Show more')}
      </Button>
    </div>}
  </div>
}
