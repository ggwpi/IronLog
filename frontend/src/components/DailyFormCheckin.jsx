// The openGym 1.4.5 four-question check-in, rendered entirely with IronLog's
// existing controls and bottom sheet. No parallel UI library or upstream CSS.
// Go-lighter adaptations are intentionally not offered until the native
// progression/plate-grid engine has passed parity tests.
import { useState } from 'react'
import { t } from '../lib/i18n.js'
import { FORM_KEYS, formScore, isRough } from '../lib/daily-form.js'
import { Button } from './ui.jsx'

const QUESTIONS = {
  sleep: ['Sleep', 'Barely slept', 'Slept like a log'],
  energy: ['Energy', 'Running on fumes', 'Full of beans'],
  sore: ['Soreness', 'Nothing aches', 'Everything aches'],
  stress: ['Stress', 'Calm', 'Frazzled'],
}

export default function DailyFormCheckin({ onDone, onSkip }) {
  const [answers, setAnswers] = useState({ sleep: null, energy: null, sore: null, stress: null })
  const hasAnswers = FORM_KEYS.some(k => answers[k] != null)
  const score = formScore(answers)
  const rough = isRough(answers)

  return <div data-daily-form-checkin>
    <h3>{t('How are you today?')}</h3>
    <p className="muted small" style={{ margin: '6px 0 16px' }}>
      {t('Tap what fits, skip what does not.')}
    </p>
    {FORM_KEYS.map(k => {
      const [label, low, high] = QUESTIONS[k]
      return <div key={k} style={{ marginBottom: 16 }} data-daily-form-question={k}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <strong>{t(label)}</strong>
          <span className="muted small">{answers[k] == null ? '—' : answers[k] + ' / 5'}</span>
        </div>
        <div role="radiogroup" aria-label={t(label)} className="row" style={{ gap: 5 }}>
          {[1, 2, 3, 4, 5].map(n => <Button key={n} size="sm"
            role="radio" aria-checked={answers[k] === n} aria-label={String(n)}
            variant={answers[k] === n ? 'tinted' : 'ghost'}
            style={{ flex: 1, minWidth: 0 }}
            onClick={() => setAnswers(a => ({ ...a, [k]: a[k] === n ? null : n }))}>{n}</Button>)}
        </div>
        <div className="row between muted small" style={{ gap: 8, marginTop: 6 }}>
          <span>{t(low)}</span><span>{t(high)}</span>
        </div>
      </div>
    })}
    {rough && <p className="muted small" role="status">
      {t('Today is a take-it-easy day')}
    </p>}
    <Button variant="primary" icon="play" onClick={() => onDone(answers)}>
      {hasAnswers ? t('Start workout') : t('Start without answering')}
    </Button>
    <div style={{ height: 8 }} />
    <Button variant="ghost" onClick={onSkip}>{t('Skip for today')}</Button>
    {score != null && <div className="muted small" style={{ marginTop: 9 }}>
      {t('Daily form')} · {score.toFixed(1)} / 5
    </div>}
  </div>
}
