import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { coachChoice, setCoachChoice } from '../lib/coach-choice.js'
import { HTTP_PROVIDERS } from '../../../api/coach/core/providers.js'
import { useUI } from '../store/useUI.js'
export default function CoachConnectionPicker({ userId, disabled = false }) {
  const nav = useNavigate(),
    toast = useUI((s) => s.toast)
  const [connections, setConnections] = useState([]),
    [choice, setChoice] = useState(() => coachChoice(userId))
  const [models, setModels] = useState([]),
    [busy, setBusy] = useState(false),
    [loadingModels, setLoadingModels] = useState(false)
  const cache = useRef(new Map()),
    seq = useRef(0)
  useEffect(() => {
    let alive = true
    api('/api/coach/connections')
      .then((r) => {
        if (!alive) return
        setConnections(r.connections)
        const saved = coachChoice(userId)
        const found =
          r.connections.find((c) => c.id === saved.connectionId) ||
          r.connections.find((c) => c.id === r.activeId) ||
          r.connections[0]
        if (found) {
          const next = {
            connectionId: found.id,
            model:
              found.id === saved.connectionId
                ? saved.model
                : found.id === r.activeId
                  ? r.model
                  : found.model,
          }
          setCoachChoice(userId, next)
          setChoice(next)
        }
      })
      .catch(() => {
        if (alive) toast(t('Could not connect'))
      })
    return () => {
      alive = false
      seq.current++
    }
  }, [userId])
  const selected = connections.find((c) => c.id === choice.connectionId)
  useEffect(() => {
    if (!selected) return
    let alive = true
    const request = ++seq.current,
      cacheKey = selected.id + ':' + selected.revision
    setModels(cache.current.get(cacheKey) || [choice.model || selected.model])
    setLoadingModels(!cache.current.has(cacheKey))
    if (cache.current.has(cacheKey)) return
    api('/api/coach/models', {
      method: 'POST',
      body: JSON.stringify({
        accountId: userId,
        connectionId: selected.id,
        provider: selected.provider,
        baseUrl: selected.baseUrl,
      }),
    })
      .then((r) => {
        if (!alive || request !== seq.current) return
        if (!r.ok) {
          toast(
            r.code === 'auth'
              ? t(
                  'Your AI provider rejected the key. Check Settings → AI Coach.'
                )
              : t('Your AI provider couldn’t answer.')
          )
          return
        }
        cache.current.set(cacheKey, r.models)
        setModels([
          ...new Set(
            [choice.model || selected.model, ...r.models].filter(Boolean)
          ),
        ])
      })
      .catch(() => {
        if (alive) toast(t('Could not connect'))
      })
      .finally(() => {
        if (alive && request === seq.current) setLoadingModels(false)
      })
    return () => {
      alive = false
    }
  }, [selected?.id, selected?.revision, userId])
  const select = async (id, model) => {
    setBusy(true)
    try {
      const r = await api('/api/coach/selection', {
        method: 'POST',
        body: JSON.stringify({
          accountId: userId,
          connectionId: id,
          ...(model ? { model } : {}),
        }),
      })
      const next = { connectionId: r.id, model: r.model }
      setCoachChoice(userId, next)
      setChoice(next)
    } catch {
      toast(t('Could not connect'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="coach-connection-picker">
      <label>
        <span>{t('AI connection')}</span>
        <select
          className="field"
          aria-label={t('AI connection')}
          value={choice.connectionId || ''}
          disabled={disabled || busy || !connections.length}
          onChange={(e) => select(e.target.value)}
        >
          {!connections.length && <option value="">{t('Loading…')}</option>}
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {HTTP_PROVIDERS[c.provider]?.label || c.provider}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('Model')}</span>
        <select
          className="field"
          aria-label={t('Model')}
          value={choice.model || ''}
          disabled={disabled || busy || loadingModels || !selected}
          onChange={(e) => select(selected.id, e.target.value)}
        >
          {[...new Set([choice.model, ...models].filter(Boolean))].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <button
        className="iconbtn"
        disabled={busy}
        onClick={() => nav('/coach/setup')}
        aria-label={t('Manage AI connections')}
        title={t('Manage AI connections')}
      >
        +
      </button>
    </div>
  )
}
