import { createStore } from './core/store.js';
import { navigate, routeFromLocation, listenToNavigation } from './core/router.js';
import { readSettings, writeSettings } from './core/storage.js';
import { escapeHtml } from './core/escape-html.js';
import { BottomNav } from './components/bottom-nav.js';
import { LoginScreen } from './features/auth/login-screen.js';
import { HomeScreen } from './features/home/home-screen.js';
import { WorkoutsScreen, WorkoutBuilderExerciseRow } from './features/workouts/workouts-screen.js';
import { WORKOUTS } from './features/workouts/workout-catalog.js';
import { StatisticsScreen } from './features/statistics/statistics-screen.js';
import { buildStatisticsModel } from './features/statistics/statistics-data.js';
import { SettingsScreen } from './features/settings/settings-screen.js';
import {
  archiveCustomExercise, archiveWorkoutTemplate,
  currentSession, loadAppData, onAuthChange, signInWithGoogle, signOut,
  finishWorkout, recordWorkoutSet, saveCustomExercise, saveWorkoutTemplate,
  startWorkout, subscribeToTraining, userFromSession,
} from './data/ironlog-repository.js';

const app = document.querySelector('#app');
const launchStartedAt = performance.now();
const LEGACY_CACHE_CLEANUP_KEY = 'ironlog:legacy-cache-cleanup:v2';
let stopTrainingSubscription = null;
let refreshTimer = null;
let sessionVersion = 0;
let refreshVersion = 0;

const store = createStore({
  session: null,
  authLoading: true,
  dataLoading: false,
  dataError: '',
  route: routeFromLocation(),
  settings: readSettings(),
  workouts: WORKOUTS,
  workoutData: {
    exerciseLibrary: [], muscles: [], sessions: [], activeSession: null,
    performanceHistory: [], summary: {},
  },
  workoutUi: null,
  statistics: buildStatisticsModel(),
});

function applyPreferences(settings) {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.classList.toggle('reduce-motion', Boolean(settings.reduceMotion));
}

function screenFor(route, state) {
  switch (route) {
    case 'workouts': return WorkoutsScreen({ workouts: state.workouts, workoutData: state.workoutData, ui: state.workoutUi });
    case 'statistics': return StatisticsScreen({ model: state.statistics });
    case 'settings': return SettingsScreen({ user: state.session?.user, settings: state.settings });
    case 'home':
    default: return HomeScreen({ userName: state.session?.user?.name || 'מתאמן', workouts: state.workouts, workoutData: state.workoutData });
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
  ++refreshVersion;
  window.clearTimeout(refreshTimer);
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
      workoutData: data.workoutData,
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
  const sessionAtStart = sessionVersion;
  const requestVersion = ++refreshVersion;
  try {
    const data = await loadAppData(userId);
    if (requestVersion !== refreshVersion || sessionAtStart !== sessionVersion || store.getState().session?.user?.id !== userId) return;
    store.setState((state) => ({
      ...state,
      workouts: data.workouts.length ? data.workouts : state.workouts,
      workoutData: data.workoutData,
      statistics: buildStatisticsModel(data.statisticsSource),
      dataError: '',
    }));
  } catch (error) {
    if (requestVersion !== refreshVersion || sessionAtStart !== sessionVersion || store.getState().session?.user?.id !== userId) return;
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

function openWorkoutUi(workoutUi) {
  store.setState((state) => ({ ...state, workoutUi }));
}

function showFormError(id, error) {
  const element = document.querySelector(`#${id}`);
  if (!element) return;
  element.textContent = error?.message || 'לא הצלחנו לשמור. נסה שוב.';
  element.hidden = false;
}

function nullableNumber(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function refreshBuilderPositions() {
  const rows = [...document.querySelectorAll('[data-builder-exercise]')];
  rows.forEach((row, index) => { row.querySelector('.builder-position').textContent = String(index + 1); });
  const count = document.querySelector('#builderExerciseCount');
  if (count) count.textContent = String(rows.length);
}

function bindApp() {
  document.querySelectorAll('[data-route]').forEach((element) => {
    element.addEventListener('click', () => navigate(element.dataset.route));
  });

  document.querySelectorAll('[data-demo-action]').forEach((element) => {
    element.addEventListener('click', () => showToast('המסך המפורט יתווסף בשלב הבא'));
  });

  document.querySelectorAll('[data-close-workout-ui]').forEach((element) => {
    element.addEventListener('click', () => openWorkoutUi(null));
  });

  document.querySelectorAll('[data-open-workout]').forEach((element) => {
    element.addEventListener('click', () => openWorkoutUi({ type: 'details', templateId: Number(element.dataset.openWorkout) }));
  });

  document.querySelectorAll('[data-new-workout]').forEach((element) => {
    element.addEventListener('click', () => openWorkoutUi({ type: 'builder' }));
  });

  document.querySelectorAll('[data-edit-workout]').forEach((element) => {
    element.addEventListener('click', () => openWorkoutUi({ type: 'builder', templateId: Number(element.dataset.editWorkout) }));
  });

  document.querySelectorAll('[data-copy-workout]').forEach((element) => {
    element.addEventListener('click', () => openWorkoutUi({ type: 'builder', templateId: Number(element.dataset.copyWorkout), copyMode: true }));
  });

  document.querySelectorAll('[data-new-exercise]').forEach((element) => {
    element.addEventListener('click', () => openWorkoutUi({ type: 'exercise' }));
  });

  document.querySelectorAll('[data-edit-exercise]').forEach((element) => {
    element.addEventListener('click', () => openWorkoutUi({ type: 'exercise', exerciseId: Number(element.dataset.editExercise) }));
  });

  document.querySelectorAll('[data-start-workout]').forEach((element) => {
    element.addEventListener('click', async () => {
      const state = store.getState();
      if (state.workoutData.activeSession) {
        openWorkoutUi({ type: 'session' });
        return;
      }
      const templateId = Number(element.dataset.startWorkout);
      if (!templateId) return showToast('תבנית האימון עדיין נטענת');
      element.disabled = true;
      try {
        await startWorkout(templateId);
        await refreshData(state.session.user.id);
        openWorkoutUi({ type: 'session' });
        showToast('האימון התחיל ונשמר בענן');
      } catch (error) {
        showToast(error.message || 'לא הצלחנו להתחיל את האימון');
        element.disabled = false;
      }
    });
  });

  document.querySelectorAll('[data-archive-workout]').forEach((element) => {
    element.addEventListener('click', async () => {
      if (!window.confirm('להעביר את האימון האישי לארכיון? היסטוריית האימונים תישמר.')) return;
      element.disabled = true;
      try {
        await archiveWorkoutTemplate(Number(element.dataset.archiveWorkout));
        await refreshData(store.getState().session.user.id);
        showToast('האימון הועבר לארכיון');
      } catch (error) {
        showToast(error.message || 'לא הצלחנו להעביר לארכיון');
        element.disabled = false;
      }
    });
  });

  document.querySelectorAll('[data-archive-exercise]').forEach((element) => {
    element.addEventListener('click', async () => {
      if (!window.confirm('להעביר את התרגיל לארכיון? אימונים קיימים לא יימחקו.')) return;
      element.disabled = true;
      try {
        await archiveCustomExercise(Number(element.dataset.archiveExercise));
        await refreshData(store.getState().session.user.id);
        showToast('התרגיל הועבר לארכיון');
      } catch (error) {
        showToast(error.message || 'לא הצלחנו להעביר לארכיון');
        element.disabled = false;
      }
    });
  });

  const builderForm = document.querySelector('#workoutBuilderForm');
  if (builderForm) {
    const rows = builderForm.querySelector('#builderExerciseRows');
    builderForm.querySelector('#addBuilderExercise')?.addEventListener('click', () => {
      const exerciseId = Number(builderForm.querySelector('#builderExerciseSelect')?.value);
      const exercise = store.getState().workoutData.exerciseLibrary.find((item) => item.id === exerciseId);
      if (!exercise) return;
      rows.insertAdjacentHTML('beforeend', WorkoutBuilderExerciseRow(exercise, rows.children.length));
      refreshBuilderPositions();
    });
    rows?.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-builder-exercise]');
      const move = event.target.closest('[data-move-exercise]');
      const row = event.target.closest('[data-builder-exercise]');
      if (!row) return;
      if (remove) row.remove();
      if (move?.dataset.moveExercise === 'up' && row.previousElementSibling) row.parentElement.insertBefore(row, row.previousElementSibling);
      if (move?.dataset.moveExercise === 'down' && row.nextElementSibling) row.parentElement.insertBefore(row.nextElementSibling, row);
      refreshBuilderPositions();
    });
    builderForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = document.querySelector(`[form="${builderForm.id}"][type="submit"]`);
      const data = new FormData(builderForm);
      const exerciseRows = [...builderForm.querySelectorAll('[data-builder-exercise]')];
      if (!exerciseRows.length) return showFormError('workoutBuilderError', new Error('צריך להוסיף לפחות תרגיל אחד.'));
      submit.disabled = true;
      try {
        const templateId = await saveWorkoutTemplate({
          templateId: nullableNumber(builderForm.dataset.templateId),
          name: data.get('name'), code: data.get('code'), weekday: nullableNumber(data.get('weekday')),
          description: data.get('description'),
          exercises: exerciseRows.map((row) => ({
            exercise_id: Number(row.dataset.exerciseId),
            planned_sets: Number(row.querySelector('[name="plannedSets"]').value),
            target_reps: row.querySelector('[name="targetReps"]').value,
            target_rir_min: nullableNumber(row.querySelector('[name="targetRir"]').value),
            target_rir_max: nullableNumber(row.querySelector('[name="targetRir"]').value),
            rest_min_seconds: Number(row.querySelector('[name="restSeconds"]').value),
            rest_max_seconds: Number(row.querySelector('[name="restSeconds"]').value),
            notes: null,
          })),
        });
        await refreshData(store.getState().session.user.id);
        openWorkoutUi({ type: 'details', templateId });
        showToast('האימון נשמר בחשבון שלך');
      } catch (error) {
        submit.disabled = false;
        showFormError('workoutBuilderError', error);
      }
    });
  }

  const exerciseForm = document.querySelector('#exerciseEditorForm');
  exerciseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = document.querySelector(`[form="${exerciseForm.id}"][type="submit"]`);
    const data = new FormData(exerciseForm);
    submit.disabled = true;
    try {
      await saveCustomExercise({
        exerciseId: nullableNumber(exerciseForm.dataset.exerciseId), name: data.get('name'), nameHe: data.get('nameHe'),
        equipment: data.get('equipment'), trackingType: data.get('trackingType'), muscleId: nullableNumber(data.get('muscleId')),
        instructions: data.get('instructions'),
      });
      await refreshData(store.getState().session.user.id);
      openWorkoutUi(null);
      showToast('התרגיל נשמר בספרייה שלך');
    } catch (error) {
      submit.disabled = false;
      showFormError('exerciseEditorError', error);
    }
  });

  document.querySelectorAll('[data-toggle-live-exercise]').forEach((element) => {
    element.addEventListener('click', () => element.closest('.live-exercise-card')?.classList.toggle('is-open'));
  });

  document.querySelectorAll('[data-set-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const data = new FormData(form);
      if (button) button.disabled = true;
      try {
        await recordWorkoutSet({
          sessionExerciseId: form.dataset.sessionExerciseId,
          setNumber: Number(form.dataset.setNumber), setType: 'working',
          loadKg: nullableNumber(data.get('loadKg')), reps: nullableNumber(data.get('reps')), rir: nullableNumber(data.get('rir')),
          durationSeconds: nullableNumber(data.get('durationSeconds')), distanceMeters: nullableNumber(data.get('distanceMeters')),
          restSeconds: null, notes: null,
        });
        await refreshData(store.getState().session.user.id);
        showToast('הסט נשמר');
      } catch (error) {
        if (button) button.disabled = false;
        showToast(error.message || 'לא הצלחנו לשמור את הסט');
      }
    });
  });

  document.querySelectorAll('[data-complete-session]').forEach((element) => {
    element.addEventListener('click', async () => {
      const active = store.getState().workoutData.activeSession;
      if (!active) return;
      const planned = active.exercises.reduce((sum, exercise) => sum + exercise.plannedSets, 0);
      const completed = active.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
      if (completed < planned && !window.confirm(`נשמרו ${completed} מתוך ${planned} סטים. לסיים בכל זאת?`)) return;
      element.disabled = true;
      try {
        await finishWorkout(active.id, false);
        await refreshData(store.getState().session.user.id);
        openWorkoutUi(null);
        showToast('האימון הושלם ונשמר');
      } catch (error) {
        element.disabled = false;
        showToast(error.message || 'לא הצלחנו לסיים את האימון');
      }
    });
  });

  document.querySelectorAll('[data-cancel-session]').forEach((element) => {
    element.addEventListener('click', async () => {
      const active = store.getState().workoutData.activeSession;
      if (!active || !window.confirm('לבטל את האימון הפעיל? הסטים שכבר נשמרו יישארו בהיסטוריה.')) return;
      element.disabled = true;
      try {
        await finishWorkout(active.id, true);
        await refreshData(store.getState().session.user.id);
        openWorkoutUi(null);
        showToast('האימון בוטל');
      } catch (error) {
        element.disabled = false;
        showToast(error.message || 'לא הצלחנו לבטל את האימון');
      }
    });
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

async function cleanupLegacyBrowserCachesOnce() {
  try {
    if (localStorage.getItem(LEGACY_CACHE_CLEANUP_KEY) === 'done') return;
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    localStorage.setItem(LEGACY_CACHE_CLEANUP_KEY, 'done');
  } catch {
    // Cache cleanup is migration housekeeping; it must never block the app.
  }
}

boot();
cleanupLegacyBrowserCachesOnce();
