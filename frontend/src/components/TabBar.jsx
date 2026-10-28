import { useLayoutEffect, useRef } from 'react'
import {
  BottomNavigation, BottomNavigationAccessory, BottomNavigationHighlight,
  BottomNavigationHighlightItem, BottomNavigationItem, BottomNavigationLabel,
} from '@animate-ui/react/primitives/bottom-navigation'
import { Button as AnimatedButton } from '@animate-ui/react/primitives/buttons/button'
import { startNavigationViewport } from '../lib/navigation-viewport.js'
import { lightningTransition } from '../lib/lightning-transition.js'
import { waitForScreenReady, waitForWorkoutScreen } from '../lib/screen-ready.js'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutineIds, effectiveRoutines } from '../lib/history.js'
import { todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'
import Elapsed from './Elapsed.jsx'
import { useConnectionTrouble } from './SyncBanner.jsx'

// Module scope, not TabBar's render body. Declared inside it, `Tab` was a new function on every
// render, so React saw a different component type each time and threw the button away and built a
// fresh one — on a bar that is fixed on screen, and once a second for the whole of a rest. The
// state it took with it is the DOM node itself: focus, the :active tint, any in-flight transition.
function Tab({ value, active, icon, label, onClick, dot }) {
  return (
    <BottomNavigationHighlightItem value={value} className="navigation-item">
      <BottomNavigationItem value={value} asChild>
        <button className={active ? 'on' : ''} onClick={onClick} aria-label={dot ? label + ', ' + t('Connection problem') : label}>
          <span className="tab-ic"><Icon name={icon} />{dot && <span className="tab-dot" aria-hidden="true" />}</span>
          <BottomNavigationLabel className="navigation-label">{label}</BottomNavigationLabel>
        </button>
      </BottomNavigationItem>
    </BottomNavigationHighlightItem>
  )
}

export default function TabBar({ onStart }) {
  const nav = useNavigate()
  const loc = useLocation()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const isGuest = useStore(s => s.isGuest())
  // With the connection banner switched off, a sync problem shows as a dot on Home, the tab
  // Settings lives under (#369, #330).
  const trouble = useConnectionTrouble()
  const dock = useRef(null)
  const transition = useRef(null)
  const visible = !!user || isGuest
  useLayoutEffect(() => visible ? startNavigationViewport(dock.current) : undefined, [visible])
  useLayoutEffect(() => () => transition.current?.(), [visible, loc.pathname])
  if (!visible) return null
  const cur = loc.pathname.split('/')[1] || 'home'
  const on = k => cur === k || (cur === 'history' && k === 'stats') || (cur === 'settings' && k === 'home') || (cur === 'muscles' && k === 'library') || (cur === 'structural-balance' && k === 'stats')

  const selected = on('home') ? 'home' : on('plan') ? 'plan' : on('stats') ? 'stats' : on('library') ? 'library' : ''

  const running = !!S.active && cur !== 'workout' && !S.active.editingWorkoutId && !S.active.backfill && S.active.start > 0
  const startWorkout = () => {
    const current = useStore.getState().S
    if (!current.active) {
      // A weekday can hold several routines; start the combined session if any of them has
      // exercises, otherwise fall through to the picker.
      if (effectiveRoutines(current, todayISO()).some(r => r.ex.length)) {
        const checkin = onStart(effectiveRoutineIds(current, todayISO()))
        if (checkin?.id) return waitForScreenReady(() => document.getElementById(checkin.id))
        return waitForWorkoutScreen(useStore.getState().S.active?.id)
      }
    }
    nav('/workout')
    return waitForWorkoutScreen(current.active?.id)
  }

  // Mark the fixed dock as a scroll/layout root so shared highlights stay in viewport coordinates
  // when route changes reset or restore page scroll. Both flags are needed by Motion's measurements.
  return (
    <BottomNavigation layoutRoot layoutScroll ref={dock} id="tabbar" className="navigation-segments" aria-label="IronLog" value={selected} scrollBehavior="minimize">
      <BottomNavigationHighlight className="navigation-highlight">
        <div className="navigation-track">
          <Tab value="home" active={on('home')} icon="house" label={t('Home')} dot={trouble} onClick={() => nav('/home')} />
          <Tab value="plan" active={on('plan')} icon="calendar" label={t('Plan')} onClick={() => nav('/plan')} />
          <Tab value="stats" active={on('stats')} icon="chart" label={t('Stats')} onClick={() => nav('/stats')} />
          <Tab value="library" active={on('library')} icon="dumbbell" label={t('Exercises')} onClick={() => nav('/library')} />
        </div>
      </BottomNavigationHighlight>
      {/* On the workout screen itself there is nothing to resume, so the button reads as the
          tab it is and stays lit (#29); anywhere else it brings you back to the exercise you
          were on — the marker is kept in S.active.cur and never moves on its own (#21). The
          side button keeps the IronLog lightning glyph for both start and resume.
          A live session you stepped away from shows its running time instead of a word, the
          button still named Resume; a past workout being edited or logged after the fact has no
          clock to run. */}
      <BottomNavigationAccessory className="navigation-accessory">
        <AnimatedButton className={'start' + (S.active ? ' rec' : '') + (S.active && cur === 'workout' ? ' on' : '')} onClick={event => { transition.current = lightningTransition(event.currentTarget, startWorkout) }}
          hoverScale={1.06} aria-label={running ? t('Resume') : undefined}>
          <span className="cir"><Icon name="bolt" /></span>
          {running ? <span className="tab-time"><Elapsed start={S.active.start} /></span>
            : <span>{S.active ? (cur === 'workout' ? t('Workout') : S.active.editingWorkoutId ? t('Edit workout') : t('Resume')) : t('Start')}</span>}
        </AnimatedButton>
      </BottomNavigationAccessory>
    </BottomNavigation>
  )
}
