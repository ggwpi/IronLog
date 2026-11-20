import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { stackOf, withStack, stackFromStep, parseWeightList } from '../lib/machine-stacks.js'
import { NumberField, Button, TextField } from './ui.jsx'
import GymInventoryRow from './GymInventoryRow.jsx'
import { t, dateLocale } from '../lib/i18n.js'
import { fmtPlate } from '../lib/format.js'

export default function MachineStackEditor({ ex }) {
  const S = useStore(s => s.S), update = useStore(s => s.update)
  const [weight, setWeight] = useState(null), [first, setFirst] = useState(null)
  const [step, setStep] = useState(null), [count, setCount] = useState(null), [paste, setPaste] = useState('')
  const weights = stackOf(S, ex.id), unit = S.unit === 'lb' ? 'lb' : 'kg'
  const save = values => update(s => { s.stackWeights = withStack(s, ex.id, values) })
  const add = values => {
    if (!values.length) { useUI.getState().toast(t('Enter a valid weight')); return }
    save([...weights, ...values])
  }
  const label = text => `${t('Weight stack')}: ${text}`
  return <div data-machine-stack={ex.id}>
    <GymInventoryRow kind="stackWeights" exId={ex.id} />
    <div className="chips" style={{ flexWrap: 'wrap', marginBottom: 12 }}>{weights.map(w => <button key={w} className="chip on" aria-label={t('Remove {0}', fmtPlate(w) + ' ' + unit)} onClick={() => save(weights.filter(x => x !== w))}>{fmtPlate(w)} {unit} ×</button>)}</div>
    <div className="row" style={{ gap: 8, marginBottom: 12 }}>
      <NumberField className="input" value={weight ?? ''} onChange={setWeight} aria-label={label(t('Weight ({0})', unit))} />
      <Button style={{ flex: '0 0 auto', width: 'auto' }} onClick={() => { add(parseWeightList(String(weight ?? ''))); setWeight(null) }}>{t('Add')}</Button>
    </div>
    <TextField value={paste} onChange={e => setPaste(e.target.value)} aria-label={label(t('Weights'))} placeholder={t('Weights')} />
    <Button onClick={() => {
      const comma = new Intl.NumberFormat(dateLocale()).formatToParts(1.5).some(p => p.type === 'decimal' && p.value === ',')
      add(parseWeightList(paste, comma)); setPaste('')
    }}>{t('Add weights')}</Button>
    <div className="row" style={{ gap: 8, marginTop: 12 }}>
      <NumberField className="input" value={first ?? ''} onChange={setFirst} aria-label={label(t('First ({0})', unit))} placeholder={t('First ({0})', unit)} />
      <NumberField className="input" value={step ?? ''} onChange={setStep} aria-label={label(t('Step ({0})', unit))} placeholder={t('Step ({0})', unit)} />
      <NumberField className="input" value={count ?? ''} onChange={setCount} aria-label={label(t('Count'))} placeholder={t('Count')} />
    </div>
    <Button onClick={() => add(stackFromStep(first, step, count || 10))}>{t('Fill in')}</Button>
    {weights.length > 0 && <Button variant="danger" onClick={() => save([])}>{t('Clear the list')}</Button>}
  </div>
}
