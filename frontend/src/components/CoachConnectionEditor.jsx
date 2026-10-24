// Credentials live only in this sheet until sent to the existing encrypted-key API.
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import {
  HTTP_PROVIDERS,
  HTTP_PROVIDER_IDS,
} from '../../../api/coach/core/providers.js'
import { DATA_CATEGORIES } from '../../../api/coach/core/categories.js'
import { CATEGORY_TEXT } from '../lib/coach.js'
import { Button, Section, TextField, SelectSheet } from './ui.jsx'
import Icon from './Icon.jsx'
import { setCoachChoice } from '../lib/coach-choice.js'

export default function CoachConnectionEditor({
  accountId,
  connection,
  close,
  onSaved,
}) {
  const user = useStore((s) => s.user)
  const refreshConfig = useStore((s) => s.refreshConfig)
  const toast = useUI((s) => s.toast),
    openSheet = useUI((s) => s.openSheet)
  const [name, setName] = useState(connection?.name || '')
  const [provider, setProvider] = useState(connection?.provider || 'anthropic')
  const [baseUrl, setBaseUrl] = useState(connection?.baseUrl || '')
  const [key, setKey] = useState('')
  const [model, setModel] = useState(connection?.model || '')
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    if (user?.id !== accountId) close()
  }, [user?.id, accountId, close])
  const meta = HTTP_PROVIDERS[provider]
  const sameEndpoint =
    connection?.provider === provider &&
    (provider !== 'compatible' ||
      connection.baseUrl === baseUrl.replace(/\/+$/, ''))
  const hasKey = sameEndpoint && connection?.hasKey
  const canList = !!(key.trim() || hasKey || provider === 'compatible')
  const request = () => ({
    accountId,
    ...(connection?.id
      ? { id: connection.id, connectionId: connection.id }
      : {}),
    name,
    provider,
    model,
    baseUrl: meta.baseUrl ? baseUrl : undefined,
    ...(key.trim() ? { apiKey: key.trim() } : {}),
  })
  const listModels = async () => {
    setBusy(true)
    try {
      const r = await api('/api/coach/models', {
        method: 'POST',
        body: JSON.stringify(request()),
      })
      if (!alive.current) return
      if (!r.ok) {
        toast(
          r.code === 'auth'
            ? t('Your AI provider rejected the key. Check Settings → AI Coach.')
            : t('Your AI provider couldn’t answer.')
        )
        return
      }
      openSheet((done) => (
        <SelectSheet
          title={t('Choose a model for this provider')}
          value={model}
          options={r.models.map((m) => ({ value: m, label: m }))}
          search={{
            placeholder: t('Search…'),
            label: t('Search…'),
            emptyLabel: t('No match'),
            match: (o, q) =>
              o.label.toLowerCase().includes(q.trim().toLowerCase()),
          }}
          onChange={(value) => {
            if (alive.current) setModel(value)
          }}
          close={done}
        />
      ))
    } catch (e) {
      if (alive.current) toast(e.message || t('Could not connect'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  const save = async () => {
    setBusy(true)
    try {
      const r = await api('/api/coach/connections', {
        method: 'POST',
        body: JSON.stringify(request()),
      })
      setKey('')
      await api('/api/coach/selection', {
        method: 'POST',
        body: JSON.stringify({ accountId, connectionId: r.id }),
      })
      setCoachChoice(accountId, r)
      await refreshConfig()
      await onSaved()
      toast(t('Saved'))
      close()
    } catch (e) {
      if (alive.current) toast(e.message || t('Something went wrong'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  const remove = async () => {
    setBusy(true)
    try {
      await api('/api/coach/connections', {
        method: 'DELETE',
        body: JSON.stringify({ accountId, id: connection.id }),
      })
      setCoachChoice(accountId, {})
      await refreshConfig()
      await onSaved()
      toast(t('Removed'))
      close()
    } catch (e) {
      if (alive.current) toast(e.message || t('Something went wrong'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  return (
    <div className="coach-connection-editor">
      <div className="coach-sheet-title">
        <h3>{connection ? t('AI connection') : t('Add AI connection')}</h3>
        <button
          className="iconbtn"
          aria-label={t('Close')}
          onClick={close}
          disabled={busy}
        >
          <Icon name="xmark" />
        </button>
      </div>
      <Section title={t('Connection name')}>
        <div className="coach-editor-field">
          <TextField
            aria-label={t('Connection name')}
            value={name}
            maxLength={80}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </Section>
      <Section title={t('Provider')}>
        <div className="coach-provider-options">
          {HTTP_PROVIDER_IDS.map((id) => (
            <button
              key={id}
              className={'chip' + (id === provider ? ' on' : '')}
              aria-pressed={id === provider}
              disabled={busy}
              onClick={() => {
                setProvider(id)
                setKey('')
                setBaseUrl('')
                setModel('')
              }}
            >
              {HTTP_PROVIDERS[id].label}
            </button>
          ))}
        </div>
      </Section>
      {meta.baseUrl && (
        <Section title={t('Endpoint')}>
          <div className="coach-editor-field">
            <TextField
              aria-label={t('Endpoint')}
              value={baseUrl}
              placeholder="https://openrouter.ai/api/v1"
              inputMode="url"
              disabled={busy}
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              onChange={(e) => {
                setBaseUrl(e.target.value)
                setModel('')
              }}
            />
          </div>
        </Section>
      )}
      <Section
        title={t('API key')}
        footer={t(
          'Your API key is encrypted on the server. It is never included in synced training data or backups.'
        )}
      >
        <div className="coach-editor-field">
          <TextField
            value={key}
            type="password"
            disabled={busy}
            dir="ltr"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            aria-label={t('API key')}
            placeholder={
              hasKey ? '•••••••• ' + t('(saved)') : meta.keyPlaceholder
            }
            onChange={(e) => {
              setKey(e.target.value)
              setModel('')
            }}
          />
        </div>
      </Section>
      <div className="coach-model-choice">
        <Button icon="list" disabled={busy || !canList} onClick={listModels}>
          {busy ? t('Loading…') : t('Choose a model for this provider')}
        </Button>
        {model && (
          <p className="coach-selected-model">
            <span>{t('Model')}</span>
            <bdi>{model}</bdi>
          </p>
        )}
      </div>
      <aside className="coach-data-info" aria-label={t('Data shared with AI')}>
        <div className="coach-data-heading">
          <Icon name="info" />
          <h4>{t('Data shared with AI')}</h4>
        </div>
        <dl>
          {DATA_CATEGORIES.map((k) => {
            const [title, sub] = CATEGORY_TEXT[k]?.() || [k, '']
            return (
              <div key={k}>
                <dt>{title}</dt>
                <dd>{sub}</dd>
              </div>
            )
          })}
        </dl>
      </aside>
      <div className="coach-editor-actions">
        <Button
          variant="primary"
          disabled={busy || !name.trim() || !model || !canList}
          onClick={save}
        >
          {t('Save changes')}
        </Button>
        {connection && (
          <Button className="danger" disabled={busy} onClick={remove}>
            {t('Delete AI connection')}
          </Button>
        )}
      </div>
    </div>
  )
}
