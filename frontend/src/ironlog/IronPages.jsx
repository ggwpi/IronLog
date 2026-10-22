import { useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { startFlow } from '../sheets.jsx'
import { AppPageHeader } from './legacy/components/app-page-header.js'
import { HomeScreen } from './legacy/features/home/home-screen.js'
import { StatisticsScreen } from './legacy/features/statistics/statistics-screen.js'
import { WorkoutsScreen } from './legacy/features/workouts/workouts-screen.js'
import { ironModel } from './model.js'
import css from './original.css?raw'

// The existing HTML renderers escape user data. Shadow DOM preserves IronLog's exact CSS
// without letting its selectors change the upstream set editor, timers or modal sheets.
export default function IronPages({ page }) {
  const host = useRef(null)
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const navigate = useNavigate()
  const data = useMemo(() => ironModel(S), [S])
  useLayoutEffect(() => {
    const root = host.current.shadowRoot || host.current.attachShadow({ mode: 'open' })
    const style = document.createElement('style'); style.textContent = css
    const content = document.createElement('div')
    if (page === 'settings') content.innerHTML = AppPageHeader({ title: 'הגדרות', subtitle: 'העדפות. חשבון. אפליקציה.', rootClass: 'settings-app-header' })
    else if (page === 'stats') content.innerHTML = StatisticsScreen({ model: data.model })
    else if (page === 'plan' && data.workouts.length) content.innerHTML = WorkoutsScreen({ workouts: data.workouts, workoutData: data.workoutData, ui: { type: 'overview' } })
    else if (page === 'home' && data.workouts.length) content.innerHTML = HomeScreen({ userName: user?.name || 'מתאמן', workouts: data.workouts, workoutData: data.workoutData })
    else content.innerHTML = '<header class="app-page-header"><div class="app-page-brand">⚡ IRONLOG</div><h1>' + (page === 'home' ? 'האימון הבא שלך' : 'האימונים שלך') + '</h1></header><p class="iron-empty">בחר תוכנית התחלה או צור אימון כדי להתחיל.</p>'
    // Estimated duration isn't present in openGym's routine schema; don't invent one.
    if (!S.ironlogCycle) content.querySelector('.native-cycle-section')?.remove()
    content.querySelectorAll('.home-workout-meta > span:last-child,.training-hero__chips').forEach(el => el.remove())
    root.replaceChildren(style, content)
    const click = event => {
      const button = event.target.closest('[data-route],[data-start-workout],[data-open-workout],[data-edit-workout],[data-new-workout]')
      if (!button) return
      event.preventDefault()
      if (button.hasAttribute('data-start-workout')) {
        const id = data.workouts.find(w => w.databaseId === Number(button.dataset.startWorkout))?.id
        if (S.active) navigate('/workout')
        else if (id) { startFlow([id]); navigate('/workout') }
        else navigate('/workout')
      } else if (button.hasAttribute('data-open-workout') || button.hasAttribute('data-edit-workout')) {
        const id = data.workouts.find(w => w.databaseId === Number(button.dataset.openWorkout || button.dataset.editWorkout))?.id
        navigate(id ? `/plan/r/${encodeURIComponent(id)}` : '/plan')
      } else navigate(({ workouts: '/plan', statistics: '/stats', settings: '/settings', home: '/home' })[button.dataset.route] || '/plan')
    }
    content.addEventListener('click', click)
    return () => content.removeEventListener('click', click)
  }, [page, data, S.active, user?.name, navigate])
  return <div ref={host} className="ironlog-original" data-theme={S.theme === 'light' ? 'light' : 'dark'} />
}
