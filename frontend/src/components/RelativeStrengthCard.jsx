// Full openGym relative-strength calculation on a native IronLog Stats card.
// This read-only view does not change workout logs or saved body-weight records.
import { useMemo, useState } from 'react'
import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import { relativeSeries } from '../lib/relative-strength.js'
import LineChart from './LineChart.jsx'
import { Segmented } from './ui.jsx'

export default function RelativeStrengthCard({ S, exId }) {
  const [chosen, setChosen] = useState('e1rm')
  const estimates = useMemo(() => exId ? relativeSeries(S, exId, { basis: 'e1rm' }) : [], [S, exId])
  const top = useMemo(() => exId ? relativeSeries(S, exId, { basis: 'top' }) : [], [S, exId])

  const canEstimate = estimates.length >= 2 && !estimates.some(p => p.assisted)
  const canTop = top.length >= 2 && top.some(p => Math.abs(p.y - top[0].y) > 1e-9)
  if (!canEstimate && !canTop) return null

  const basis = chosen === 'top' && canTop ? 'top' : canEstimate ? 'e1rm' : 'top'
  const data = basis === 'top' ? top : estimates
  const points = data.map(p => ({
    t: p.t, d: p.d, y: p.y * 100,
    note: (basis === 'e1rm' ? t('Est. 1RM') + ' ' : '') +
      fmtNum(p.load) + ' ' + S.unit + ' @ ' + fmtNum(p.bw) + ' ' + S.unit,
  }))
  return <div className="card" data-relative-strength>
    <h2>{t('Strength')} · {t('Body weight')}</h2>
    <div className="small muted" style={{ marginBottom: 10 }}>
      {t('Exercise progress')} · {t('Body weight')}
    </div>
    {canEstimate && canTop && <Segmented className="seg-range" value={basis}
      onChange={setChosen} options={[
        { value: 'e1rm', label: t('Est. 1RM') },
        { value: 'top', label: t('Top set') },
      ]} />}
    <div className="chart">
      <LineChart points={points} h={104} unit="%" color="var(--blue)" variant="ribbon" />
    </div>
    <div className="small muted" style={{ marginTop: 8 }}>
      {t('Best:')} <b className="accent">{fmtNum(Math.max(...points.map(p => p.y)))}%</b>
    </div>
  </div>
}
