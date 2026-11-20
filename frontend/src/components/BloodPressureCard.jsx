import { bpOf, bpText, bpSeries, measurementSeries } from '../lib/opengym-v145/measurements.js'
import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import LineChart from './LineChart.jsx'
import { Button, Segmented } from './ui.jsx'

// Original readings/series through IronLog's existing card and multi-line chart.
export default function BloodPressureCard({ S, range, onRange, onLog }) {
  const latest = [...S.measurements].reverse().map(bpOf).find(Boolean)
  const data = bpSeries(S, range)
  const pulse = measurementSeries(S, 'pulse', range)
  const byDay = new Map(S.measurements.map(e => [e.d, bpOf(e)]))
  const anchors = data.sys.map(p => ({ ...p, note: bpText(byDay.get(p.d)) }))
  return <div className="card" data-blood-pressure>
    <div className="row between"><div className="muted small">{t('Blood pressure')}</div>{onLog && <Button size="sm" icon="plus" onClick={onLog}>{t('Log')}</Button>}</div>
    <div className="big"><bdi dir="ltr">{bpText(latest) || '–'}</bdi> <span className="muted small">mmHg</span></div>
    {onRange && <Segmented className="seg-range" value={range} onChange={onRange} options={[{ value: 30, label: '1M' }, { value: 90, label: '3M' }, { value: 365, label: '1Y' }, { value: 0, label: t('All') }]} />}
    {(data.sys.length > 0 || data.dia.length > 0) && <>
      <div className="row small muted" style={{ gap: 12 }}><span style={{ color: 'var(--acc)' }}>{t('Systolic')}</span><span style={{ color: 'var(--teal)' }}>{t('Diastolic')}</span></div>
      <div className="chart"><LineChart points={anchors} h={140} unit="mmHg" series={[{ points: data.sys, color: 'var(--acc)' }, { points: data.dia, color: 'var(--teal)' }]} /></div>
    </>}
    {pulse.length > 0 && <>
      <div className="small muted">{t('Resting pulse')} · {fmtNum(pulse.at(-1).y)} bpm</div>
      <div className="chart"><LineChart points={pulse} h={100} unit="bpm" color="var(--teal)" /></div>
    </>}
  </div>
}
