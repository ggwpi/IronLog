import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { coachChoice, setCoachChoice } from '../lib/coach-choice.js'
import { HTTP_PROVIDERS } from '../../../api/coach/core/providers.js'
import { useUI } from '../store/useUI.js'
import { SelectSheet, Row } from './ui.jsx'
import Icon from './Icon.jsx'

export default function CoachConnectionPicker({
  userId,
  disabled = false,
  onSelecting,
}) {
  const nav = useNavigate(),
    toast = useUI((s) => s.toast),
    openSheet = useUI((s) => s.openSheet)
  const [connections, setConnections] = useState([])
  const [choice, setChoice] = useState(() => coachChoice(userId))
  const [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    api('/api/coach/connections')
      .then((r) => {
        if (!alive.current) return
        setConnections(r.connections)
        const saved = coachChoice(userId)
        const selected =
          r.connections.find((c) => c.id === saved.connectionId) ||
          r.connections.find((c) => c.id === r.activeId) ||
          r.connections[0]
        // The model is configured in Settings, never overridden by a stale chat choice.
        const next = selected
          ? { connectionId: selected.id, model: selected.model }
          : {}
        setCoachChoice(userId, next)
        setChoice(next)
        setLoaded(true)
      })
      .catch(() => {
        if (alive.current) toast(t('Could not connect'))
      })
    return () => {
      alive.current = false
    }
  }, [userId])
  const select = async (id) => {
    setBusy(true)
    onSelecting?.(true)
    try {
      const r = await api('/api/coach/selection', {
        method: 'POST',
        body: JSON.stringify({ accountId: userId, connectionId: id }),
      })
      if (!alive.current) return
      const next = { connectionId: r.id, model: r.model }
      setCoachChoice(userId, next)
      setChoice(next)
    } catch {
      if (alive.current) toast(t('Could not connect'))
    } finally {
      onSelecting?.(false)
      if (alive.current) setBusy(false)
    }
  }
  const open = () =>
    openSheet((close) => (
      <div className="chat-menu">
        <SelectSheet
          title={t('AI connections')}
          value={choice.connectionId}
          options={connections.map((c) => ({
            value: c.id,
            label: c.name,
            subtitle: (
              <>
                {HTTP_PROVIDERS[c.provider]?.label || c.provider} ·{' '}
                <bdi>{c.model}</bdi>
              </>
            ),
          }))}
          onChange={select}
          close={close}
        />
        <div className="sect-b">
          <Row
            icon="gear"
            iconTint="var(--green)"
            title={t('Manage AI connections')}
            accessory="chevron"
            onClick={() => {
              close()
              nav('/coach/setup')
            }}
          />
        </div>
      </div>
    ))
  return (
    <button
      className="iconbtn"
      disabled={disabled || busy || !loaded}
      onClick={open}
      aria-label={t('AI connection')}
      aria-haspopup="dialog"
      title={
        connections.find((c) => c.id === choice.connectionId)?.name ||
        t('AI connection')
      }
    >
      <Icon name="swap" />
    </button>
  )
}
