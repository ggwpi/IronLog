import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutineIds, effectiveRoutines } from '../lib/history.js'
import { todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { menuSheet } from '../sheets.jsx'
import Icon from './Icon.jsx'
import { useConnectionTrouble } from './SyncBanner.jsx'

// IronLog's original four-tab dock. Every destination/action uses the upstream routes
// and start flow; the Workouts menu keeps Plan, Start and the catalogue reachable.
function Tab({ active, icon, label, onClick, dot, menu }) {
  return <button className={'nav-item' + (active ? ' is-active' : '')} onClick={onClick}
    aria-current={active ? 'page' : undefined} aria-haspopup={menu ? 'dialog' : undefined}
    aria-label={dot ? label + ', ' + t('Connection problem') : undefined}>
    <span className="tab-ic"><Icon name={icon} />{dot && <span className="tab-dot" aria-hidden="true" />}</span>
    <span>{label}</span>
  </button>
}

export default function TabBar({ onStart }) {
  const nav = useNavigate()
  const loc = useLocation()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const isGuest = useStore(s => s.isGuest())
  const trouble = useConnectionTrouble()
  if (!user && !isGuest) return null
  const cur = loc.pathname.split('/')[1] || 'home'
  const startWorkout = () => {
    if (!S.active && effectiveRoutines(S, todayISO()).some(r => r.ex.length)) {
      onStart(effectiveRoutineIds(S, todayISO())); return
    }
    nav('/workout')
  }
  const workouts = () => menuSheet({ title: t('Workouts'), items: [
    { icon: 'play', label: t(S.active ? S.active.editingWorkoutId ? 'Edit workout' : 'Resume' : 'Start workout'), onClick: startWorkout },
    { icon: 'calendar', label: t('Plan'), onClick: () => nav('/plan') },
    { icon: 'dumbbell', label: t('Exercises'), onClick: () => nav('/library') },
  ] })
  return <nav id="tabbar" className="bottom-nav" aria-label="IronLog">
    <Tab active={cur === 'home' || cur === 'checkin'} icon="house" label={t('Home')} dot={trouble} onClick={() => nav('/home')} />
    <Tab active={['plan','workout','library','muscles'].includes(cur)} icon="dumbbell" label={t('Workouts')} menu onClick={workouts} />
    <Tab active={['stats','history','structural-balance','progress-photos','measurements'].includes(cur)} icon="chart" label={t('Stats')} onClick={() => nav('/stats')} />
    <Tab active={['settings','coach'].includes(cur)} icon="person" label={t('Account')} onClick={() => nav('/settings')} />
  </nav>
}
