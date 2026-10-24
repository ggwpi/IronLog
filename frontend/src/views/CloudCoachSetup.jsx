// Cloud credentials never enter the synced training state or browser storage.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { AiConsentSection } from '../components/CoachConsentSheet.jsx'
import { Button, Section, Row, TextField } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'
import { setCoachChoice } from '../lib/coach-choice.js'
export default function CloudCoachSetup() {
  const nav = useNavigate(),
    toast = useUI((s) => s.toast)
  const user = useStore((s) => s.user),
    ready = useStore((s) => s.ready)
  const refreshConfig = useStore((s) => s.refreshConfig)
  const [connections, setConnections] = useState([]),
    [editing, setEditing] = useState(false),
    [name, setName] = useState('')
  const [saved, setSaved] = useState(null),
    [provider, setProvider] = useState('anthropic')
  const [baseUrl, setBaseUrl] = useState(''),
    [key, setKey] = useState(''),
    [model, setModel] = useState('')
  const [models, setModels] = useState(null),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!ready) return
    if (!user) {
      nav('/home', { replace: true })
      return
    }
    setKey('')
    setModels(null)
    setLoaded(false)
    let gone = false
    api('/api/coach/connections')
      .then((s) => {
        if (gone) return
        setConnections(s.connections)
        const current =
          s.connections.find((c) => c.id === s.activeId) || s.connections[0]
        setSaved(current || {})
        setName(current?.name || '')
        if (current?.provider) setProvider(current.provider)
        setBaseUrl(current?.baseUrl || '')
        setModel(current?.model || '')
        setEditing(!s.connections.length)
        setLoaded(true)
      })
      .catch((e) => {
        if (!gone) {
          toast(e.message || t('Something went wrong'))
          nav('/settings', { replace: true })
        }
      })
    return () => {
      gone = true
    }
  }, [ready, user?.id])
  const meta = HTTP_PROVIDERS[provider]
  const sameEndpoint =
    saved?.provider === provider &&
    (provider !== 'compatible' || saved.baseUrl === baseUrl.replace(/\/+$/, ''))
  const hasKey = sameEndpoint && saved?.hasKey
  const selectProvider = (id) => {
    setProvider(id)
    setKey('')
    setBaseUrl('')
    setModel('')
    setModels(null)
  }
  const request = () => ({
    accountId: user.id,
    ...(saved?.id ? { id: saved.id, connectionId: saved.id } : {}),
    name,
    provider,
    baseUrl: meta.baseUrl ? baseUrl : undefined,
    model,
    ...(key.trim() ? { apiKey: key.trim() } : {}),
  })
  const listModels = async () => {
    setBusy(true)
    try {
      const r = await api('/api/coach/models', {
        method: 'POST',
        body: JSON.stringify(request()),
      })
      if (!r.ok) {
        toast(
          r.code === 'auth'
            ? t('Your AI provider rejected the key. Check Settings → AI Coach.')
            : t('Your AI provider couldn’t answer.')
        )
        return
      }
      setModels(r.models)
      if (!r.models.includes(model))
        setModel(r.models.includes(meta.defaultModel) ? meta.defaultModel : '')
    } catch (e) {
      toast(e.message || t('Could not connect'))
    } finally {
      setBusy(false)
    }
  }
  const save = async () => {
    setBusy(true)
    try {
      const r = await api('/api/coach/connections', {
        method: 'POST',
        body: JSON.stringify(request()),
      })
      setSaved(r)
      setKey('')
      await api('/api/coach/selection', {
        method: 'POST',
        body: JSON.stringify({
          accountId: user.id,
          connectionId: r.id,
          model: r.model,
        }),
      })
      setCoachChoice(user.id, r)
      await refreshConfig()
      toast(t('The Coach is on'))
      nav('/coach')
    } catch (e) {
      toast(e.message || t('Something went wrong'))
    } finally {
      setBusy(false)
    }
  }
  const disconnect = async () => {
    setBusy(true)
    try {
      await api('/api/coach/connections', {
        method: 'DELETE',
        body: JSON.stringify({ accountId: user.id, id: saved.id }),
      })
      const list = await api('/api/coach/connections')
      setConnections(list.connections)
      setCoachChoice(
        user.id,
        list.connections.find((c) => c.id === list.activeId) || {}
      )
      setSaved({})
      setName('')
      setEditing(false)
      setKey('')
      setModels(null)
      setModel('')
      await refreshConfig()
      toast(t('Removed'))
    } catch (e) {
      toast(e.message || t('Something went wrong'))
    } finally {
      setBusy(false)
    }
  }
  const add = () => {
    setSaved({})
    setName('')
    setKey('')
    setModels(null)
    setProvider('anthropic')
    setBaseUrl('')
    setModel('')
    setEditing(true)
  }
  const edit = (c) => {
    setSaved(c)
    setName(c.name)
    setKey('')
    setModels(null)
    setProvider(c.provider)
    setBaseUrl(c.baseUrl || '')
    setModel(c.model)
    setEditing(true)
  }
  return (
    <div className="narrow">
      <div className="hdr">
        <button
          className="iconbtn"
          data-back="/settings"
          aria-label={t('Back')}
          onClick={() => nav('/settings')}
        >
          <Icon name="chevronLeft" />
        </button>
        <h1>{t('AI Coach')}</h1>
      </div>
      {!loaded ? (
        <p className="dim">{t('Loading…')}</p>
      ) : (
        <>
          <Section
            title={t('AI connections')}
            footer={t(
              'Requests run through IronLog and are charged to your provider account.'
            )}
          >
            {connections.map((c) => (
              <Row
                key={c.id}
                icon="key"
                iconTint="var(--green)"
                title={c.name}
                subtitle={
                  (HTTP_PROVIDERS[c.provider]?.label || c.provider) +
                  ' · ' +
                  c.model
                }
                accessory="chevron"
                onClick={() => edit(c)}
              />
            ))}
            <Row
              icon="plus"
              iconTint="var(--green)"
              title={t('Add AI connection')}
              onClick={add}
            />
            {!!connections.length && (
              <Row
                icon="sparkles"
                iconTint="var(--green)"
                title={t('Open the Coach')}
                accessory="chevron"
                onClick={async () => {
                  await refreshConfig()
                  nav('/coach')
                }}
              />
            )}
          </Section>
          {editing && (
            <>
              <Section title={t('Connection name')}>
                <div style={{ padding: '8px 12px' }}>
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
                <div
                  className="row"
                  style={{ flexWrap: 'wrap', gap: 7, padding: '8px 12px' }}
                >
                  {HTTP_PROVIDER_IDS.map((id) => (
                    <button
                      key={id}
                      className={'chip' + (id === provider ? ' on' : '')}
                      aria-pressed={id === provider}
                      disabled={busy}
                      onClick={() => selectProvider(id)}
                    >
                      {HTTP_PROVIDERS[id].label}
                    </button>
                  ))}
                </div>
              </Section>
              {meta.baseUrl && (
                <Section title={t('Endpoint')}>
                  <div style={{ padding: '8px 12px' }}>
                    <TextField
                      value={baseUrl}
                      placeholder="https://openrouter.ai/api/v1"
                      inputMode="url"
                      disabled={busy}
                      dir="ltr"
                      autoCapitalize="none"
                      autoCorrect="off"
                      onChange={(e) => {
                        setBaseUrl(e.target.value)
                        setModels(null)
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
                <div style={{ padding: '8px 12px' }}>
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
                      setModels(null)
                    }}
                  />
                </div>
              </Section>
              <Section title={t('Data shared with AI')}>
                {DATA_CATEGORIES.map((k) => {
                  const [title, sub] = CATEGORY_TEXT[k]?.() || [k, '']
                  return (
                    <Row
                      key={k}
                      icon="check"
                      iconTint="var(--acc)"
                      title={title}
                      subtitle={sub}
                    />
                  )
                })}
              </Section>
              {models && (
                <Section title={t('Model')}>
                  <div style={{ padding: '8px 12px' }}>
                    <select
                      className="input"
                      aria-label={t('Model')}
                      value={model}
                      disabled={busy}
                      onChange={(e) => setModel(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">{t('Pick a model')}</option>
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </Section>
              )}
              <div style={{ display: 'grid', gap: 10 }}>
                <Button
                  disabled={
                    busy ||
                    (!key.trim() && !hasKey && provider !== 'compatible')
                  }
                  onClick={listModels}
                >
                  {busy ? t('Loading…') : t('List models')}
                </Button>
                {models && (
                  <Button
                    variant="primary"
                    disabled={busy || !model || !name.trim()}
                    onClick={save}
                  >
                    {t('Save and use the Coach')}
                  </Button>
                )}
              </div>
            </>
          )}
          <AiConsentSection />
          {editing && saved?.connected && (
            <Section title={t('Controls')}>
              <Row
                icon="signOut"
                iconTint="var(--red)"
                title={t('Delete AI connection')}
                danger
                disabled={busy}
                onClick={() => {
                  if (!busy) disconnect()
                }}
              />
            </Section>
          )}
        </>
      )}
    </div>
  )
}
