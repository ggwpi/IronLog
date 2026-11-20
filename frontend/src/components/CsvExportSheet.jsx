// Original CSV calculations through IronLog's own controls, sheet host and native sharing path.
import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t, tn } from '../lib/i18n.js'
import { todayISO } from '../lib/format.js'
import { workoutsCSV, bodyCSV, csvCounts } from '../lib/ironlog-csv.js'
import { reportRange } from '../lib/opengym-v145/report.js'
import { MOBILE, shareExport } from '../lib/mobile.js'
import { Button, Segmented, Row, TextField } from './ui.jsx'

// Original upstream download/share boundary, with IronLog supplying the branded filename.
export async function saveCSV(text, name) {
  if (MOBILE) { await shareExport(text, name); return }
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 60000)
}

export function CsvExportSheet({ close }) {
  const S = useStore(s => s.S)
  const toast = useUI(s => s.toast)
  const today = todayISO()
  const [range, setRange] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today)
  const selected = range === 'all' ? undefined : range === 'custom' ? { from: from || null, to: to || null } : reportRange(range, { today })
  const counts = csvCounts(S, selected)
  const invalid = range === 'custom' && !!from && !!to && from > to
  const save = async kind => {
    if (invalid) return
    const state = useStore.getState().S
    const text = kind === 'body' ? bodyCSV(state, selected) : workoutsCSV(state, selected)
    const name = `ironlog-${kind === 'body' ? 'body' : 'workouts'}-${today}.csv`
    close()
    try { await saveCSV(text, name); toast?.(t('CSV exported')) } catch { /* native share sheet dismissed */ }
  }
  return <>
    <h3>{t('Export as spreadsheet (CSV)')}</h3>
    <Segmented value={range} onChange={setRange} options={[{ value: 'all', label: t('All') }, { value: '3m', label: t('3 months') }, { value: '4w', label: t('4 weeks') }, { value: 'custom', label: t('Custom') }]} />
    {range === 'custom' && <>
      <Row icon="calendar" title={t('From')}><TextField type="date" aria-label={t('From')} value={from} max={to || today} onChange={e => setFrom(e.target.value)} /></Row>
      <Row icon="calendar" title={t('To')}><TextField type="date" aria-label={t('To')} value={to} min={from} max={today} onChange={e => setTo(e.target.value)} /></Row>
    </>}
    <div style={{ height: 16 }} />
    <Button variant="primary" icon="share" disabled={invalid} onClick={() => save('workouts')}>{t('Workouts (CSV)')}</Button>
    <div className="small dim" style={{ margin: '4px 2px 12px' }} data-csv-count="workouts">
      {tn('{0} workout', '{0} workouts', counts.workouts) + ' · ' + tn('{0} set', '{0} sets', counts.sets)}
    </div>
    <Button icon="share" disabled={invalid} onClick={() => save('body')}>{t('Body weight & measurements (CSV)')}</Button>
    <div className="small dim" style={{ margin: '4px 2px 0' }} data-csv-count="body">
      {tn('{0} weigh-in', '{0} weigh-ins', counts.weighIns) + (counts.measurements ? ' · ' + tn('{0} measurement', '{0} measurements', counts.measurements) : '')}
    </div>
  </>
}

export const csvExportSheet = () => useUI.getState().openSheet(close => <CsvExportSheet close={close} />)
