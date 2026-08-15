import { createStore } from './core/store.js';
import { navigate, routeFromLocation, listenToNavigation } from './core/router.js';
import { readSettings, writeSettings } from './core/storage.js';
import { escapeHtml } from './core/escape-html.js';
import { BottomNav } from './components/bottom-nav.js';
import { LoginScreen } from './features/auth/login-screen.js';
import { HomeScreen } from './features/home/home-screen.js';
import { WorkoutsScreen } from './features/workouts/workouts-screen.js';
import { WORKOUTS } from './features/workouts/workout-catalog.js';
import { StatisticsScreen } from './features/statistics/statistics-screen.js';
import { buildStatisticsModel } from './features/statistics/statistics-data.js';
import { SettingsScreen } from './features/settings/settings-screen.js';
import {
  currentSession, loadAppData, onAuthChange, signInWithGoogle, signOut,
  startWorkout, subscribeToTraining, userFromSession,
} from './data/ironlog-repository.js';

const app = document.querySelector('#app');
const launchStartedAt = performance.now();
let stopTrainingSubscription = null;
let refreshTimer = null;
let sessionVersion = 0;

const store = createStore({
  session: null,
  authLoading: true,
  dataLoading: false,
  dataError: '',
  route: routeFromLocation(),
  settings: readSettings(),
  workouts: WORKOUTS,
  statistics: buildStatisticsModel(),
});

function applyPreferences(settings) {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.classList.toggle('reduce-motion', Boolean(settings.reduceMotion));
}

function screenFor(route, state) {
  switch (route) {
    case 'workouts': return WorkoutsScreen({ workouts: state.workouts });
    case 'statistics': return StatisticsScreen({ model: state.statistics });
    case 'settings': return SettingsScreen({ user: state.session?.user, settings: state.settings });
    case 'home':
    default: return HomeScreen({ userName: state.session?.user?.name || 'מתאמן', workouts: state.workouts });
  }
}

function renderLoading() {
  return `<main class="auth-shell"><section class="auth-panel animate-enter">
    <div class="brand-lockup"><div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div><div><strong>IRONLOG</strong><small>SECURE SYNC</small></div></div>
    <div class="auth-copy"><span class="eyebrow">CONNECTING</span><h1>הנתונים שלך.<br><em>נטענים עכשיו.</em></h1><p>IronLog מתחבר לחשבון המאובטח שלך.</p></div>
  </section></main>`;
}

function render() {
  const state = store.getState();
  applyPreferences(state.settings);

  if (state.authLoading) {
    app.innerHTML = renderLoading();
    return;
  }

  if (!state.session) {
    app.innerHTML = LoginScreen();
    bindAuth();
    return;
  }

  app.innerHTML = `<div class="app-shell">
    <main class="app-content" id="appContent">
      ${state.dataError ? `<div class="data-banner" role="status">הנתונים לא התעדכנו: ${escapeHtml(state.dataError)}</div>` : ''}
      ${screenFor(state.route, state)}
    </main>
    ${BottomNav(state.route)}
    <div class="toast-region" id="toastRegion" aria-live="polite"></div>
  </div>`;
  bindApp();
}

async function bindSession(session) {
  const version = ++sessionVersion;
  stopTrainingSubscription?.();
  stopTrainingSubscription = null;
  const user = userFromSession(session);

  if (!user) {
    store.setState((state) => ({ ...state, session: null, authLoading: false, dataLoading: false, dataError: '' }));
    return;
  }

  store.setState((state) => ({ ...state, session: { user }, authLoading: false, dataLoading: true, dataError: '' }));

  try {
    const data = await loadAppData(user.id);
    if (version !== sessionVersion) return;
    const resolvedUser = {
      ...user,
      name: data.profile?.display_name || user.name,
      email: data.profile?.email || user.email,
      avatarUrl: data.profile?.avatar_url || user.avatarUrl,
    };
    store.setState((state) => ({
      ...state,
      session: { user: resolvedUser },
      workouts: data.workouts.length ? data.workouts : WORKOUTS,
      statistics: buildStatisticsModel(data.statisticsSource),
      dataLoading: false,
      dataError: '',
    }));

    stopTrainingSubscription = subscribeToTraining(user.id, () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => refreshData(user.id), 250);
    });
  } catch (error) {
    if (version !== sessionVersion) return;
    store.setState((state) => ({ ...state, dataLoading: false, dataError: error.message || 'שגיאת חיבור' }));
  }
}

async function refreshData(userId) {
  try {
    const data = await loadAppData(userId);
    store.setState((state) => ({
      ...state,
      workouts: data.workouts.length ? data.workouts : state.workouts,
      statistics: buildStatisticsModel(data.statisticsSource),
      dataError: '',
    }));
  } catch (error) {
    store.setState((state) => ({ ...state, dataError: error.message || 'שגיאת סנכרון' }));
  }
}

function bindAuth() {
  const button = document.querySelector('#googleLoginButton');
  if (!button) return;
  button.addEventListener('click', async () => {
    const error = document.querySelector('#loginError');
    button.disabled = true;
    button.querySelector('span').textContent = 'פותח את Google…';
    try {
      await signInWithGoogle();
    } catch (authError) {
      error.textContent = authError.message || 'לא הצלחנו לפתוח את Google. נסה שוב.';
      error.hidden = false;
      button.disabled = false;
      button.querySelector('span').textContent = 'המשך עם Google';
    }
  });
}

function showToast(message) {
  const region = document.querySelector('#toastRegion');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  region.append(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 220);
  }, 2200);
}

function bindApp() {
  document.querySelectorAll('[data-route]').forEach((element) => {
    element.addEventListener('click', () => navigate(element.dataset.route));
  });

  document.querySelectorAll('[data-demo-action]').forEach((element) => {
    element.addEventListener('click', () => showToast('המסך המפורט יתווסף בשלב הבא'));
  });

  document.querySelector('[data-start-workout]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const templateId = Number(button.dataset.startWorkout);
    if (!templateId) {
      showToast('תבנית האימון עדיין נטענת');
      return;
    }
    button.disabled = true;
    try {
      await startWorkout(templateId);
      showToast('האימון התחיל ונשמר בענן');
    } catch (error) {
      showToast(error.message || 'לא הצלחנו להתחיל את האימון');
      button.disabled = false;
    }
  });

  document.querySelector('#logoutButton')?.addEventListener('click', async () => {
    try { await signOut(); } catch (error) { showToast(error.message || 'לא הצלחנו להתנתק'); }
  });

  document.querySelector('#reduceMotionToggle')?.addEventListener('change', (event) => {
    const settings = { ...store.getState().settings, reduceMotion: event.currentTarget.checked };
    writeSettings(settings);
    store.setState((state) => ({ ...state, settings }));
  });
}

listenToNavigation((route) => {
  const state = store.getState();
  if (!state.session || route === state.route) return;
  store.setState({ ...state, route });
});

store.subscribe(render);

function finishLaunchScreen() {
  const launch = document.querySelector('#launchScreen');
  if (!launch) return;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
  const minimumVisibleMs = reducedMotion ? 120 : 1850;
  const remaining = Math.max(0, minimumVisibleMs - (performance.now() - launchStartedAt));
  window.setTimeout(() => {
    launch.classList.add('is-leaving');
    launch.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => launch.remove(), reducedMotion ? 20 : 520);
  }, remaining);
}

async function boot() {
  if (!location.hash) history.replaceState(null, '', '#/home');
  render();
  onAuthChange((session) => bindSession(session));
  try {
    await bindSession(await currentSession());
  } catch (error) {
    store.setState((state) => ({ ...state, authLoading: false, dataError: error.message || 'שגיאת התחברות' }));
  }
  requestAnimationFrame(() => requestAnimationFrame(finishLaunchScreen));
}

boot();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => {});
}
if ('caches' in window) {
  caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {});
}
