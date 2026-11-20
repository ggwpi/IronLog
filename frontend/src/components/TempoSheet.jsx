// IronLog controls and sheet host; all tempo interpretation stays in the original module.
import { useState } from 'react'
import { useUI } from '../store/useUI.js'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { normalizeTempo, parseTempo, tempoOf, guideReps, PHASES } from '../lib/opengym-v145/tempo.js'
import { TempoGuide } from './Tempo.jsx'
import './ironlog-tempo-guide.css'
import { setSpanAt } from '../lib/history.js'
import { Row, Switch, Stepper, Button } from './ui.jsx'

const PRESETS = ['3-1-1-0', '2-0-1-0', '3-0-1-0', '4-0-1-0', '2-1-2-1', '5-0-X-0']
const labels = () => [t('Lower (s)'), t('Pause at the bottom (s)'), t('Lift (s)'), t('Squeeze at the top (s)')]

export function TempoEditor({ value, title, clearLabel, onDone, close, onGuide }) {
  const [parts, setParts] = useState(() => (normalizeTempo(value) || '3-0-1-0').split('-'))
  const tempo = normalizeTempo(parts.join('-'))
  const parsed = parseTempo(parts.join('-'))
  const change = (i, v) => setParts(p => p.map((s, j) => j === i ? String(v) : s))
  return <>
    <h3>{title || t('Tempo')}</h3>
    <p className="small dim">{t('Seconds for each part of a rep: lower, pause, lift, squeeze. 3-1-1-0 is three down, one at the bottom, one up, straight into the next.')}</p>
    <div className="row" style={{ justifyContent: 'center', fontSize: 28, marginBottom: 12 }} aria-live="polite"><bdi dir="ltr">{tempo || '0-0-0-0'}</bdi></div>
    <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      {PRESETS.map(v => <Button key={v} size="sm" variant={tempo === v ? 'tinted' : 'plain'} aria-pressed={tempo === v} onClick={() => setParts(v.split('-'))}><bdi dir="ltr">{v}</bdi></Button>)}
    </div>
    {PHASES.map((phase, i) => <div className="row cfgrow" key={phase} style={{ marginBottom: 8 }}>
      <Stepper label={labels()[i]} value={parsed?.[phase] ?? (parts[i] === 'X' ? 1 : Number(parts[i]))} min={0} max={9} step={1} decimal={false}
        disabled={parts[i] === 'X'} onChange={v => change(i, v)} />
    </div>)}
    <Row icon="bolt" title={t('Explosive lift (X)')}><Switch aria-label={t('Explosive lift (X)')} checked={parts[2] === 'X'} onChange={on => change(2, on ? 'X' : 1)} /></Row>
    {onGuide && <Button icon="play" disabled={!tempo} onClick={() => { close(); onGuide(tempo) }}>{t('Tempo {0}, start the guide', tempo || '–')}</Button>}
    <Button variant="primary" disabled={!tempo} onClick={() => onDone(tempo)}>{t('Save')}</Button>
    {value && <Button variant="plain" onClick={() => onDone(null)}>{clearLabel || t('No tempo')}</Button>}
    <Button variant="ghost" onClick={close}>{t('Cancel')}</Button>
  </>
}

export function tempoSheet(options) {
  return useUI.getState().openSheet(close => <TempoEditor {...options} close={close} onDone={v => { close(); options.onDone(v) }} />)
}

export function setTempoSheet(entryIdx, setIdx, { onTick } = {}) {
  const active = useStore.getState().S.active
  const entry = active?.entries?.[entryIdx]
  if (!entry) return
  const [start] = setSpanAt(entry.sets, setIdx)
  const row = entry.sets[start]
  if (!row) return
  const ref = { id: active.id, entryId: entry.id, rows: entry.sets.length }
  const rowSignature = JSON.stringify(row)
  const targetSignature = JSON.stringify(entry.target)
  const sameRow = () => {
    const current = useStore.getState().S.active
    const e = current?.entries?.[entryIdx]
    return current?.id === ref.id && e?.id === ref.entryId && e.sets.length === ref.rows && JSON.stringify(e.target) === targetSignature && JSON.stringify(e.sets[start]) === rowSignature
  }
  const onGuide = tempo => useUI.getState().openSheet(close => <div className="ironlog-tempo-guide">
    <TempoGuide tempo={tempo} reps={guideReps(row, entry.target)} close={close}
      onTick={!row.done && onTick && tempo === tempoOf(entry.target, row) ? () => { close(); if (sameRow()) onTick() } : null} />
  </div>)
  return tempoSheet({ title: t('Tempo for this set'), value: tempoOf(entry.target, row), onGuide, clearLabel: normalizeTempo(entry.target?.tempo) ? t('Like the exercise ({0})', normalizeTempo(entry.target.tempo)) : t('No tempo'), onDone: value => {
    useStore.getState().update(s => {
      const current = s.active?.entries?.[entryIdx]
      if (!current || s.active.id !== ref.id || current.id !== ref.entryId || current.sets.length !== ref.rows) return
      const target = current.sets[start]
      if (!target) return
      const normalized = normalizeTempo(value)
      if (!normalized || normalized === normalizeTempo(current.target?.tempo)) delete target.tempo
      else target.tempo = normalized
    }, true)
  } })
}
