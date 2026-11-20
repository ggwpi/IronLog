import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { useCircuit, circuitUnitAt, wireCircuit, restoreCircuit } from '../store/useCircuit.js'
import { circuitOf, cleanCircuit, defaultCircuit, rememberRegular, restoreRegular, roundsPerStation, runStep, leftOf, elapsedOf, stationNow, nextWorkAfter, stationSuggestions, compareResult, previousResult } from '../lib/circuit.js'
import { setCircuit } from '../lib/circuit-data.js'
import { circuitLine, modeName, roundLabel, resultLine, fmtClock, compareLine } from '../lib/circuit-copy.js'
import { defaultConfig, cleanupSg, supersetUnits } from '../lib/history.js'
import { exOr } from '../lib/exercises.js'
import { uid } from '../lib/format.js'
import { useWakeLock } from '../lib/wakelock.js'
import { t, exerciseNameFor } from '../lib/i18n.js'
import { Button, NumberField, Row, SelectRow } from './ui.jsx'
import Media, { Thumb } from './Media.jsx'

const types = ['regular', 'circuit', 'amrap', 'emom', 'intervals', 'tabata', 'runwalk']
const typeName = type => type === 'regular' ? t('Regular') : type === 'tabata' ? t('Tabata') : modeName(defaultCircuit(type))
export const routineCircuit = r => { const units = supersetUnits(r?.ex || []); return units.length === 1 ? circuitOf(r?.ex, units[0]) : null }

function RoutineCircuitEditor({ id, close }) {
  const S = useStore(s => s.S), routine = S.routines.find(r => r.id === id)
  const initial = routineCircuit(routine)
  const [type, setType] = useState(initial ? initial.program === 'runwalk' ? 'runwalk' : initial.mode : 'regular')
  const [cfg, setCfg] = useState(initial || defaultCircuit('circuit'))
  if (!routine) return null
  const choose = value => { setType(value); if (value !== 'regular') setCfg(defaultCircuit(value)) }
  const fields = type === 'runwalk' ? ['level'] : cfg.mode === 'circuit' ? ['rounds', 'gap'] : cfg.mode === 'amrap' ? ['cap'] : cfg.mode === 'emom' ? ['every', 'count'] : ['work', 'rest', 'rounds']
  const labels = { level: 'Level', rounds: 'Rounds', gap: 'Rest', cap: 'Time cap', every: 'Time', count: 'Rounds', work: 'Work', rest: 'Rest' }
  const save = () => {
    if (!routine.ex.length && type !== 'regular' && type !== 'runwalk') { useUI.getState().toast(t('Add an exercise first, then pick how it runs.')); return }
    useStore.getState().update(s => {
      const r = s.routines.find(x => x.id === id)
      if (!r) return
      if (type === 'regular') { restoreRegular(r.ex); cleanupSg(r.ex); return }
      if (!r.ex.length && type === 'runwalk') r.ex.push({ id: '0685', ...defaultConfig('0685', undefined, s) })
      if (!routineCircuit(r)) rememberRegular(r.ex)
      const sg = r.ex.find(e => e.sgCircuit && e.sg)?.sg || 'sg' + uid()
      const choice = cleanCircuit(cfg)
      for (const entry of r.ex) entry.sg = sg
      setCircuit(r.ex, sg, choice)
      const n = roundsPerStation(choice, r.ex.length)
      for (const entry of r.ex) entry.sets = n
    })
    close()
  }
  return <>
    <h3>{t('Routine type')}</h3>
    <SelectRow title={t('Routine type')} value={type} options={types.map(value => ({ value, label: typeName(value) }))} onChange={choose} />
    {type !== 'regular' && <>
      <p className="muted small">{circuitLine(cleanCircuit(cfg))}</p>
      {fields.map(key => <Row key={key} title={t(labels[key])} value={key === 'level' || key === 'rounds' || key === 'count' ? '' : 's'}>
        <NumberField aria-label={t(labels[key])} value={cfg[key]} onChange={value => setCfg(old => ({ ...old, [key]: value }))} />
      </Row>)}
    </>}
    <Button variant="primary" onClick={save}>{t('Save')}</Button>
    <Button variant="ghost" onClick={close}>{t('Cancel')}</Button>
  </>
}
export const routineCircuitSheet = id => useUI.getState().openSheet(close => <RoutineCircuitEditor id={id} close={close} />)

function CircuitPlayer({ close }) {
  const A = useStore(s => s.S.active), unit = useStore(s => s.S.unit)
  const workouts = useStore(s => s.S.workouts)
  const { run, pending, ask, result } = useCircuit()
  const [now, setNow] = useState(Date.now()), [partial, setPartial] = useState(0)
  useWakeLock(!!run && !run.ended)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 200); return () => { clearInterval(timer); useCircuit.getState().close() } }, [])
  const cfg = run?.cfg || circuitUnitAt(A, pending?.idx)?.cfg
  if (!A || !cfg) return null
  const step = runStep(run), station = step?.m != null ? stationNow(run, step.m) : null
  const clock = run ? leftOf(run, now) ?? elapsedOf(run, now) : null
  const next = run ? nextWorkAfter(cfg, run.stations, run.i) : null
  const upcoming = next ? run.stations[next.m] : null
  const suggestions = result ? stationSuggestions(run, A.entries) : []
  const comparison = result ? compareLine(compareResult(result, previousResult(workouts, result))) : ''
  return <div data-circuit-player>
    <h3>{circuitLine(cfg)}</h3>
    {!run && <Button variant="primary" icon="play" onClick={() => useCircuit.getState().start()}>{t('Start')}</Button>}
    {run && !run.ended && <>
      <div className="big" style={{ textAlign: 'center' }}><bdi dir="ltr">{fmtClock(clock)}</bdi></div>
      <p className="muted">{roundLabel(cfg, step, run.stations.length)}</p>
      {station && <>
        <h3>{exerciseNameFor(exOr(station.id))}</h3>
        <Media ex={exOr(station.id)} compact />
        {step?.k === 'work' && station.mode === 'reps' && <>
          <Row title={t('Reps')}><NumberField aria-label={t('Reps')} value={station.reps} onChange={reps => useCircuit.getState().adjust(step.m, { reps })} /></Row>
          <Row title={t('Weight ({0})', unit)}><NumberField aria-label={t('Weight ({0})', unit)} value={station.w} onChange={w => useCircuit.getState().adjust(step.m, { w })} /></Row>
        </>}
      </>}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => run.paused != null ? useCircuit.getState().resume() : useCircuit.getState().pause()}>{run.paused != null ? t('Resume') : t('Pause')}</Button>
        <Button variant="primary" onClick={() => useCircuit.getState().done()}>{t('Done')}</Button>
        <Button onClick={() => useCircuit.getState().skip()}>{t('Skip')}</Button>
        <Button variant="danger" onClick={() => useCircuit.getState().stop()}>{t('Stop')}</Button>
      </div>
      {upcoming && <div className="row" style={{ gap: 8, marginBlock: 12 }}><Thumb ex={exOr(upcoming.id)} /><span>{t('Up next')} · {exerciseNameFor(exOr(upcoming.id))}</span></div>}
    </>}
    {ask && <><Row title={t('Reps')}><NumberField aria-label={t('Reps')} value={partial} onChange={setPartial} /></Row><Button variant="primary" onClick={() => useCircuit.getState().finish(partial)}>{t('Save')}</Button></>}
    {result && <p>{resultLine(result)}</p>}
    {comparison && <p className="accent">{comparison}</p>}
    {suggestions.length > 0 && <><h3>{t('Next time')}</h3>{suggestions.map(s => <p key={s.idx}>{exerciseNameFor(exOr(s.id))} · {s.field === 'reps' ? t('Reps') : t('Seconds')} <bdi dir="ltr">{s.from} → {s.to}</bdi></p>)}</>}
    <Button variant="ghost" onClick={() => { useCircuit.getState().close(); close() }}>{t('Close')}</Button>
  </div>
}

// Root's existing sheet/back stack owns presentation; the original clock continues when closed.
export default function CircuitSheetHost() {
  const ready = useStore(s => s.ready), open = useCircuit(s => s.open)
  useEffect(() => {
    if (!ready) return
    wireCircuit()
    // The original clock owns one device key. IronLog keeps drafts per owner and mirrors S to
    // native storage, so keep its plain checkpoint with that owner's active session as well.
    const restore = () => {
      const A = useStore.getState().S.active, saved = A?.ironlogCircuitRun
      if (useCircuit.getState().run?.wid === A?.id) return
      if (saved?.v === 1 && saved.wid === A?.id && !saved.ended && saved.stations?.every(st => A.entries[st.idx]?.id === st.id)) {
        try { localStorage.setItem('gym_circuit_v1', JSON.stringify(saved)) } catch { return }
      }
      restoreCircuit()
    }
    restore()
    const checkpoint = useCircuit.subscribe((state, prev) => {
      if (state.run === prev.run) return
      const run = state.run, owner = run?.wid ?? prev.run?.wid
      const A = useStore.getState().S.active
      if (!A || A.id !== owner) return
      useStore.getState().update(s => {
        if (s.active?.id !== owner) return
        if (run && !run.ended) s.active.ironlogCircuitRun = structuredClone(run)
        else delete s.active.ironlogCircuitRun
      })
    })
    // IronLog can swap/reorder a running session. Never let a clock write into a different
    // exercise that now occupies the same position; completed rows remain on the session.
    const off = useStore.subscribe(({ S }) => {
      const run = useCircuit.getState().run
      if (!run && S.active?.ironlogCircuitRun) { queueMicrotask(restore); return }
      if (!run || run.ended || S.active?.id !== run.wid) return
      if (run.stations.some(st => S.active.entries[st.idx]?.id !== st.id)) useCircuit.getState().reset()
    })
    return () => { off(); checkpoint() }
  }, [ready])
  useEffect(() => {
    if (!open) return
    const sheet = useUI.getState().openSheet(close => <CircuitPlayer close={close} />)
    return () => sheet.close()
  }, [open])
  return null
}
