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
export default function CloudCoachSetup() {
  const nav = useNavigate(),
    toast = useUI((s) => s.toast)
  const user = useStore((s) => s.user),
    ready = useStore((s) => s.ready)
  const refreshConfig = useStore((s) => s.refreshConfig)
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
    let gone = false
    api('/api/coach/settings')
      .then((s) => {
        if (gone) return
        setSaved(s)
        if (s.provider) setProvider(s.provider)
        setBaseUrl(s.baseUrl || '')
        setModel(s.model || '')
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
        toast(t('Could not reach the provider: {0}', r.error))
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
      const r = await api('/api/coach/settings', {
        method: 'POST',
        body: JSON.stringify(request()),
      })
      setSaved(r)
      setKey('')
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
      await api('/api/coach/settings', { method: 'DELETE' })
      setSaved({})
      setKey('')
      setModels(null)
      setModel('')
      await refreshConfig()
      toast(t('The Coach is off'))
    } catch (e) {
      toast(e.message || t('Something went wrong'))
    } finally {
      setBusy(false)
    }
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
            title={t('Your account')}
            footer={t(
              'Requests run through IronLog and are charged to your provider account.'
            )}
          >
            <Row
              icon="key"
              iconTint="var(--green)"
              title={
                saved?.connected
                  ? HTTP_PROVIDERS[saved.provider]?.label
                  : t('Choose a provider and connect your own API key.')
              }
              subtitle={saved?.model || undefined}
            />
            {saved?.connected && (
              <Row
                icon="sparkles"
                iconTint="var(--green)"
                title={t('Open the Coach')}
                accessory="chevron"
                onClick={() => nav('/coach')}
              />
            )}
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
                busy || (!key.trim() && !hasKey && provider !== 'compatible')
              }
              onClick={listModels}
            >
              {busy ? t('Loading…') : t('List models')}
            </Button>
            {models && (
              <Button
                variant="primary"
                disabled={busy || !model}
                onClick={save}
              >
                {t('Save and use the Coach')}
              </Button>
            )}
          </div>
          <AiConsentSection />
          {saved?.connected && (
            <Section title={t('Controls')}>
              <Row
                icon="signOut"
                iconTint="var(--red)"
                title={t('Disconnect')}
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
