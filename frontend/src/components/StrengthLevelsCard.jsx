// The upstream strength-level model rendered using IronLog's existing UI primitives.
// No openGym CSS is imported; the card and the expanded settings sheet remain IronLog.
import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { dateLocale } from '../lib/i18n-core.js'
import { fmtNum, exerciseNameText } from '../lib/format.js'
import { EXIDX } from '../lib/exercises.js'
import { strengthLevels, strengthLevel, liftOf, LEVELS, LEVEL_NAME, sexOf } from '../lib/strength-level.js'
import { Button, Segmented, Stepper } from './ui.jsx'

const ratio = value => new Intl.NumberFormat(dateLocale(), { maximumFractionDigits: 2 }).format(value)
const ROWS = 5

function AboutYou() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const year = new Date().getFullYear()
  const birth = Number(S.birthYear) > 0 ? Number(S.birthYear) : null
  return <>
    <h3>{t('About you')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>{t('Only used to grade your strength levels, on this device. Leave it blank if you like.')}</div>
    <div className="sec">{t('Sex')}</div>
    <Segmented options={[
      { value: '', label: t('Not set') },
      { value: 'female', label: t('Female') },
      { value: 'male', label: t('Male') },
    ]} value={sexOf(S) || ''} onChange={value => update(s => {
      if (value) s.sex = value
      else delete s.sex
    })} />
    <div style={{ height: 14 }} />
    <div className="sec">{t('Year of birth')}</div>
    <div className="row" style={{ gap: 8 }}>
      <Stepper ariaLabel={t('Year of birth')} value={birth ?? year - 30}
        step={1} min={1920} max={year - 10} decimal={false}
        onChange={value => update(s => { s.birthYear = Math.round(value) })} />
      {!!birth && <Button size="sm" variant="ghost" onClick={() => update(s => { delete s.birthYear })}>{t('Clear')}</Button>}
    </div>
  </>
}

export const aboutYouSheet = () => useUI.getState().openSheet(() => <AboutYou />)

export default function StrengthLevelsCard({ S }) {
  const [expanded, setExpanded] = useState(false)
  const rows = strengthLevels(S)
  if (!rows.length) return null
  const shown = expanded ? rows : rows.slice(0, ROWS)
  return <div className="card" data-strength-levels>
    <div className="row between" style={{ gap: 10, marginBottom: 8 }}>
      <h2 style={{ margin: 0 }}>{t('Strength')}</h2>
      <Button size="sm" variant="tinted" onClick={aboutYouSheet}>{t('About you')}</Button>
    </div>
    {shown.map(row => <div className="row between" key={row.lift} role="group"
      aria-label={String(EXIDX[row.id] ? exerciseNameText(EXIDX[row.id]) : row.id) + ': ' + t(LEVEL_NAME[row.name]) + ', ' + ratio(row.ratio) + '×'}
      style={{ gap: 12, padding: '10px 0', borderBottom: 'var(--hair) solid var(--sep)' }}>
      <span style={{ minWidth: 0 }}>{EXIDX[row.id] ? exerciseNameText(EXIDX[row.id]) : row.id}</span>
      <span className="small muted" style={{ flexShrink: 0 }}>{t(LEVEL_NAME[row.name])} · {ratio(row.ratio)}×</span>
    </div>)}
    {rows.length > ROWS && <Button size="sm" variant="ghost" trailingIcon={expanded ? 'chevronUp' : 'chevronDown'}
      aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{t(expanded ? 'Show less' : 'Show more')}</Button>}
    {!sexOf(S) && <div className="small muted" style={{ marginTop: 8 }}>
      {t('Using the men’s table for now. Add your sex and year of birth for a fairer read.')}
    </div>}
  </div>
}

// The same strength-grade feature on the exercise's existing IronLog detail sheet.
// Uses existing typography and neutral controls; never an upstream-themed component.
export function StrengthLevelBlock({ exId }) {
  const S = useStore(s => s.S)
  if (!liftOf(exId)) return null
  const level = strengthLevel(S, exId)
  if (!level) return null
  return <section data-strength-level-detail style={{ margin: '14px 0' }}>
    <h4 className="sec">{t('Strength level')}</h4>
    <div className="row between" style={{ alignItems: 'baseline', gap: 8 }}>
      <strong>{t(LEVEL_NAME[level.name])}</strong>
      <span className="small muted">{t('{0} × body weight', ratio(level.ratio))}</span>
    </div>
    <div className="row" style={{ gap: 4, marginTop: 9, marginBottom: 8 }} role="img"
      aria-label={t(LEVEL_NAME[level.name])}>
      {LEVELS.map((name, i) => <span key={name} style={{
        display: 'block', height: 5, flex: 1, borderRadius: 'var(--r-sm)',
        background: i <= level.level ? 'var(--acc)' : 'var(--surface-3)',
      }} />)}
    </div>
    <div className="small muted">{level.next
      ? t('{0} from an estimated 1RM of {1}',
        t(LEVEL_NAME[level.next.name]), fmtNum(level.next.weight) + ' ' + S.unit)
      : t('Top of the table. Take a bow.')}</div>
    <div className="small muted" style={{ marginTop: 6 }}>
      {sexOf(S)
        ? t('Against published strength standards, worked out on this device.')
        : t('Using the men’s table for now. Add your sex and year of birth for a fairer read.')}
      {' '}<button type="button" className="link" onClick={aboutYouSheet}>{t('About you')}</button>
    </div>
  </section>
}
