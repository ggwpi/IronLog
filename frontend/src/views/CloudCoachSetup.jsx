import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { HTTP_PROVIDERS } from '../../../api/coach/core/providers.js'
import { AiConsentSection } from '../components/CoachConsentSheet.jsx'
import { Section, Row } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'
import CoachConnectionEditor from '../components/CoachConnectionEditor.jsx'

export default function CloudCoachSetup() {
  const nav = useNavigate(),
    toast = useUI((s) => s.toast),
    openSheet = useUI((s) => s.openSheet)
  const user = useStore((s) => s.user),
    ready = useStore((s) => s.ready)
  const refreshConfig = useStore((s) => s.refreshConfig)
  const [connections, setConnections] = useState([]),
    [loaded, setLoaded] = useState(false)
  const reload = async () => {
    const r = await api('/api/coach/connections')
    setConnections(r.connections)
  }
  useEffect(() => {
    if (!ready) return
    if (!user) {
      nav('/home', { replace: true })
      return
    }
    setLoaded(false)
    let gone = false
    api('/api/coach/connections')
      .then((r) => {
        if (!gone) {
          setConnections(r.connections)
          setLoaded(true)
        }
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
  const edit = (connection) =>
    openSheet((close) => (
      <CoachConnectionEditor
        accountId={user.id}
        connection={connection}
        close={close}
        onSaved={reload}
      />
    ))
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
                  <>
                    {HTTP_PROVIDERS[c.provider]?.label || c.provider} ·{' '}
                    <bdi>{c.model}</bdi>
                  </>
                }
                accessory="chevron"
                onClick={() => edit(c)}
              />
            ))}
            <Row
              icon="plus"
              iconTint="var(--green)"
              title={t('Add AI connection')}
              onClick={() => edit(null)}
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
          <AiConsentSection />
        </>
      )}
    </div>
  )
}
