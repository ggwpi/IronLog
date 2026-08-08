import { createStore } from './core/store.js';
import { navigate, routeFromLocation, listenToNavigation } from './core/router.js';
import { readSession, writeSession, readSettings, writeSettings } from './core/storage.js';
import { BottomNav } from './components/bottom-nav.js';
import { LoginScreen } from './features/auth/login-screen.js';
import { HomeScreen, hydrateHomeAnatomy } from './features/home/home-screen.js';
import { WorkoutsScreen } from './features/workouts/workouts-screen.js';
import { StatisticsScreen } from './features/statistics/statistics-screen.js';
import { SettingsScreen } from './features/settings/settings-screen.js';

const app = document.querySelector('#app');

const store = createStore({
  session: readSession(),
  route: routeFromLocation(),
  settings: readSettings(),
});

function displayNameFromEmail(email) {
  const local = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!local) return 'מתאמן';
  return local.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function applyPreferences(settings) {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.classList.toggle('reduce-motion', Boolean(settings.reduceMotion));
}

function screenFor(route, state) {
  switch (route) {
    case 'workouts': return WorkoutsScreen();
    case 'statistics': return StatisticsScreen();
    case 'settings': return SettingsScreen({ user: state.session?.user, settings: state.settings });
    case 'home':
    default: return HomeScreen({ userName: state.session?.user?.name || 'מתאמן' });
  }
}

function render() {
  const state = store.getState();
  applyPreferences(state.settings);

  if (!state.session) {
    app.innerHTML = LoginScreen();
    bindAuth();
    return;
  }

  app.innerHTML = `<div class="app-shell">
    <main class="app-content" id="appContent">${screenFor(state.route, state)}</main>
    ${BottomNav(state.route)}
    <div class="toast-region" id="toastRegion" aria-live="polite"></div>
  </div>`;

  if (state.route === 'home') hydrateHomeAnatomy(app);
  bindApp();
}

function bindAuth() {
  const form = document.querySelector('#loginForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.querySelector('#emailInput')?.value.trim();
    const password = document.querySelector('#passwordInput')?.value || '';
    const error = document.querySelector('#loginError');

    if (!email || !email.includes('@') || password.length < 4) {
      error.textContent = 'הזן אימייל תקין וסיסמה של לפחות 4 תווים.';
      error.hidden = false;
      form.classList.remove('shake');
      requestAnimationFrame(() => form.classList.add('shake'));
      return;
    }

    const session = {
      user: { email, name: displayNameFromEmail(email) },
      createdAt: new Date().toISOString(),
    };
    writeSession(session);
    store.setState((state) => ({ ...state, session, route: 'home' }));
    navigate('home', { replace: true });
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
  }, 1800);
}

function bindApp() {
  document.querySelectorAll('[data-route]').forEach((element) => {
    element.addEventListener('click', () => navigate(element.dataset.route));
  });

  document.querySelectorAll('[data-demo-action]').forEach((element) => {
    element.addEventListener('click', () => showToast('בניית אימונים תתווסף בשלב הבא'));
  });

  document.querySelector('#logoutButton')?.addEventListener('click', () => {
    writeSession(null);
    store.setState((state) => ({ ...state, session: null, route: 'home' }));
    history.replaceState(null, '', '#/home');
    render();
  });

  document.querySelector('#reduceMotionToggle')?.addEventListener('change', (event) => {
    const settings = { ...store.getState().settings, reduceMotion: event.currentTarget.checked };
    writeSettings(settings);
    store.setState((state) => ({ ...state, settings }));
  });
}

listenToNavigation((route) => {
  const state = store.getState();
  if (!state.session) return;
  if (route === state.route) return;
  store.setState({ ...state, route });
});

store.subscribe(render);

function boot() {
  if (!location.hash) {
    history.replaceState(null, '', '#/home');
  }
  render();
}

boot();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
