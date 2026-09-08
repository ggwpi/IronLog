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
const LEGACY_CACHE_CLEANUP_KEY = 'ironlog:legacy-cache-cleanup:v3';
let stopTrainingSubscription = null;
let refreshTimer = null;
let sessionVersion = 0;
let refreshVersion = 0;
let lastRenderedRoute = null;
let authenticatedShellMounted = false;

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

function resetShellState() {
  authenticatedShellMounted = false;
  lastRenderedRoute = null;
}

function ensureAuthenticatedShell() {
  if (authenticatedShellMounted && app.querySelector('.app-shell')) return;
  app.innerHTML = `<div class="app-shell">
    <main class="app-content" id="appContent"></main>
    <div id="appNavHost"></div>
    <div class="toast-region" id="toastRegion" aria-live="polite"></div>
    <div class="ios-confirm-host" id="iosConfirmHost" aria-live="polite"></div>
  </div>`;
  authenticatedShellMounted = true;
}

function focusSnapshot(content) {
  const active = document.activeElement;
  if (!content?.contains(active) || !(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement)) return null;
  const form = active.closest('form');
  return {
    id: active.id || '',
    name: active.getAttribute('name') || '',
    formId: form?.id || '',
    value: 'value' in active ? active.value : '',
    start: typeof active.selectionStart === 'number' ? active.selectionStart : null,
    end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
  };
}

function restoreFocus(snapshot, content) {
  if (!snapshot || !content) return;
  let target = snapshot.id ? content.querySelector(`#${CSS.escape(snapshot.id)}`) : null;
  if (!target && snapshot.name) {
    const scope = snapshot.formId ? content.querySelector(`#${CSS.escape(snapshot.formId)}`) : content;
    target = scope?.querySelector(`[name="${CSS.escape(snapshot.name)}"]`) || null;
  }
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
  if ('value' in target && snapshot.value !== undefined) target.value = snapshot.value;
  target.focus({ preventScroll: true });
  if (snapshot.start !== null && typeof target.setSelectionRange === 'function') {
    try { target.setSelectionRange(snapshot.start, snapshot.end ?? snapshot.start); } catch { /* input type has no selection range */ }
  }
}

function completedSetState(active) {
  if (!active) return { planned: 0, completed: 0 };
  const exercises = (active.exercises || []).filter((exercise) => !exercise.isSkipped && Number(exercise.plannedSets) > 0);
  return exercises.reduce((totals, exercise) => {
    totals.planned += Number(exercise.plannedSets) || 0;
    totals.completed += Math.min(
      (exercise.sets || []).filter((set) => set.completed).length,
      Number(exercise.plannedSets) || 0,
    );
    return totals;
  }, { planned: 0, completed: 0 });
}

function applyDerivedUi(state) {
  const active = state.workoutData.activeSession;
  document.documentElement.classList.toggle('ironlog-active-workout', Boolean(active && state.workoutUi?.type === 'session'));

  // Finishing the workout is a completion action, not a permanent secondary button.
  // Keep it hidden until every planned set has been recorded.
  const finishButtons = document.querySelectorAll('[data-complete-session]');
  if (finishButtons.length && active) {
    const { planned, completed } = completedSetState(active);
    finishButtons.forEach((button) => { button.hidden = planned <= 0 || completed < planned; });
  }
}

function renderAuthenticated(state) {
  const oldContent = document.querySelector('#appContent');
  const sameRoute = authenticatedShellMounted && lastRenderedRoute === state.route;
  const focus = sameRoute ? focusSnapshot(oldContent) : null;
  const scrollY = sameRoute ? window.scrollY : 0;

  ensureAuthenticatedShell();
  const content = document.querySelector('#appContent');
  const navHost = document.querySelector('#appNavHost');

  content.innerHTML = `${state.dataError ? `<div class="data-banner" role="status">הנתונים לא התעדכנו: ${escapeHtml(state.dataError)}</div>` : ''}${screenFor(state.route, state)}`;
  navHost.innerHTML = BottomNav(state.route);
  applyDerivedUi(state);

  if (sameRoute) {
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - scrollY) > 2) window.scrollTo({ top: scrollY, behavior: 'instant' });
      restoreFocus(focus, content);
    });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  lastRenderedRoute = state.route;
}

function render() {
  const state = store.getState();
  applyPreferences(state.settings);

  if (state.authLoading) {
    resetShellState();
    app.innerHTML = renderLoading();
    return;
  }

  if (!state.session) {
    resetShellState();
    app.innerHTML = LoginScreen();
    return;
  }

  renderAuthenticated(state);
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
      refreshTimer = window.setTimeout(() => refreshData(user.id), 280);
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

function confirmAction({ title, message, confirmLabel = 'אישור', destructive = false, primary = false }) {
  const host = document.querySelector('#iosConfirmHost');
  if (!host) return Promise.resolve(window.confirm(message || title));

  return new Promise((resolve) => {
    host.innerHTML = `<div class="ios-confirm-backdrop" role="presentation">
      <section class="ios-confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="iosConfirmTitle" aria-describedby="iosConfirmMessage" dir="rtl">
        <h2 id="iosConfirmTitle">${escapeHtml(title)}</h2>
        <p id="iosConfirmMessage">${escapeHtml(message)}</p>
        <div class="ios-confirm-actions">
          <button type="button" data-ios-confirm="yes" class="${destructive ? 'is-destructive' : primary ? 'is-primary' : ''}">${escapeHtml(confirmLabel)}</button>
          <button type="button" data-ios-confirm="no">ביטול</button>
        </div>
      </section>
    </div>`;
    const backdrop = host.querySelector('.ios-confirm-backdrop');
    const finish = (value) => {
      backdrop?.classList.remove('is-visible');
      window.setTimeout(() => { host.innerHTML = ''; resolve(value); }, 170);
    };
    host.querySelector('[data-ios-confirm="yes"]')?.addEventListener('click', () => finish(true), { once: true });
    host.querySelector('[data-ios-confirm="no"]')?.addEventListener('click', () => finish(false), { once: true });
    backdrop?.addEventListener('click', (event) => { if (event.target === backdrop) finish(false); });
    requestAnimationFrame(() => {
      backdrop?.classList.add('is-visible');
      host.querySelector('[data-ios-confirm="no"]')?.focus();
    });
  });
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
  rows.forEach((row, index) => {
    const position = row.querySelector('.builder-position');
    if (position) position.textContent = String(index + 1);
  });
  const count = document.querySelector('#builderExerciseCount');
  if (count) count.textContent = String(rows.length);
}

async function handleClick(event) {
  const route = event.target.closest('[data-route]');
  if (route) {
    event.preventDefault();
    navigate(route.dataset.route);
    return;
  }

  const googleLogin = event.target.closest('#googleLoginButton');
  if (googleLogin) {
    const error = document.querySelector('#loginError');
    googleLogin.disabled = true;
    const label = googleLogin.querySelector('span');
    if (label) label.textContent = 'פותח את Google…';
    try {
      await signInWithGoogle();
    } catch (authError) {
      if (error) {
        error.textContent = authError.message || 'לא הצלחנו לפתוח את Google. נסה שוב.';
        error.hidden = false;
      }
      googleLogin.disabled = false;
      if (label) label.textContent = 'המשך עם Google';
    }
    return;
  }

  const demo = event.target.closest('[data-demo-action]');
  if (demo) { showToast('המסך המפורט יתווסף בשלב הבא'); return; }

  const closeUi = event.target.closest('[data-close-workout-ui]');
  if (closeUi) { openWorkoutUi(null); return; }

  const openWorkout = event.target.closest('[data-open-workout]');
  if (openWorkout) { openWorkoutUi({ type: 'details', templateId: Number(openWorkout.dataset.openWorkout) }); return; }

  const newWorkout = event.target.closest('[data-new-workout]');
  if (newWorkout) { openWorkoutUi({ type: 'builder' }); return; }

  const editWorkout = event.target.closest('[data-edit-workout]');
  if (editWorkout) { openWorkoutUi({ type: 'builder', templateId: Number(editWorkout.dataset.editWorkout) }); return; }

  const copyWorkout = event.target.closest('[data-copy-workout]');
  if (copyWorkout) { openWorkoutUi({ type: 'builder', templateId: Number(copyWorkout.dataset.copyWorkout), copyMode: true }); return; }

  const newExercise = event.target.closest('[data-new-exercise]');
  if (newExercise) { openWorkoutUi({ type: 'exercise' }); return; }

  const editExercise = event.target.closest('[data-edit-exercise]');
  if (editExercise) { openWorkoutUi({ type: 'exercise', exerciseId: Number(editExercise.dataset.editExercise) }); return; }

  const startButton = event.target.closest('[data-start-workout]');
  if (startButton) {
    const state = store.getState();
    if (state.workoutData.activeSession) { openWorkoutUi({ type: 'session' }); return; }
    const templateId = Number(startButton.dataset.startWorkout);
    if (!templateId) { showToast('תבנית האימון עדיין נטענת'); return; }
    startButton.disabled = true;
    try {
      await startWorkout(templateId);
      await refreshData(state.session.user.id);
      openWorkoutUi({ type: 'session' });
      showToast('האימון התחיל ונשמר בענן');
    } catch (error) {
      showToast(error.message || 'לא הצלחנו להתחיל את האימון');
      startButton.disabled = false;
    }
    return;
  }

  const archiveWorkoutButton = event.target.closest('[data-archive-workout]');
  if (archiveWorkoutButton) {
    const confirmed = await confirmAction({
      title: 'להעביר את האימון לארכיון?',
      message: 'האימון יוסר מהתוכנית. היסטוריית האימונים שלך תישאר שמורה.',
      confirmLabel: 'העבר לארכיון',
      destructive: true,
    });
    if (!confirmed) return;
    archiveWorkoutButton.disabled = true;
    try {
      await archiveWorkoutTemplate(Number(archiveWorkoutButton.dataset.archiveWorkout));
      await refreshData(store.getState().session.user.id);
      showToast('האימון הועבר לארכיון');
    } catch (error) {
      showToast(error.message || 'לא הצלחנו להעביר לארכיון');
      archiveWorkoutButton.disabled = false;
    }
    return;
  }

  const archiveExerciseButton = event.target.closest('[data-archive-exercise]');
  if (archiveExerciseButton) {
    const confirmed = await confirmAction({
      title: 'להעביר את התרגיל לארכיון?',
      message: 'התרגיל יוסר מהספרייה הפעילה. אימונים והיסטוריה קיימים לא יימחקו.',
      confirmLabel: 'העבר לארכיון',
      destructive: true,
    });
    if (!confirmed) return;
    archiveExerciseButton.disabled = true;
    try {
      await archiveCustomExercise(Number(archiveExerciseButton.dataset.archiveExercise));
      await refreshData(store.getState().session.user.id);
      showToast('התרגיל הועבר לארכיון');
    } catch (error) {
      showToast(error.message || 'לא הצלחנו להעביר לארכיון');
      archiveExerciseButton.disabled = false;
    }
    return;
  }

  const addBuilderExercise = event.target.closest('#addBuilderExercise');
  if (addBuilderExercise) {
    const builderForm = document.querySelector('#workoutBuilderForm');
    const rows = builderForm?.querySelector('#builderExerciseRows');
    const exerciseId = Number(builderForm?.querySelector('#builderExerciseSelect')?.value);
    const exercise = store.getState().workoutData.exerciseLibrary.find((item) => item.id === exerciseId);
    if (exercise && rows) {
      rows.insertAdjacentHTML('beforeend', WorkoutBuilderExerciseRow(exercise, rows.children.length));
      refreshBuilderPositions();
    }
    return;
  }

  const builderRow = event.target.closest('[data-builder-exercise]');
  if (builderRow) {
    const remove = event.target.closest('[data-remove-builder-exercise]');
    const move = event.target.closest('[data-move-exercise]');
    if (remove) builderRow.remove();
    if (move?.dataset.moveExercise === 'up' && builderRow.previousElementSibling) builderRow.parentElement.insertBefore(builderRow, builderRow.previousElementSibling);
    if (move?.dataset.moveExercise === 'down' && builderRow.nextElementSibling) builderRow.parentElement.insertBefore(builderRow.nextElementSibling, builderRow);
    if (remove || move) refreshBuilderPositions();
    if (remove || move) return;
  }

  const toggleLive = event.target.closest('[data-toggle-live-exercise]');
  if (toggleLive) {
    toggleLive.closest('.live-exercise-card')?.classList.toggle('is-open');
    return;
  }

  const completeSessionButton = event.target.closest('[data-complete-session]');
  if (completeSessionButton) {
    const active = store.getState().workoutData.activeSession;
    if (!active) return;
    const { planned, completed } = completedSetState(active);
    if (completed < planned) {
      showToast(`נשארו עוד ${planned - completed} סטים לפני סיום האימון`);
      return;
    }
    const confirmed = await confirmAction({
      title: 'לסיים את האימון?',
      message: `כל ${completed} הסטים נשמרו. האימון יתווסף להיסטוריה שלך.`,
      confirmLabel: 'סיום אימון',
      primary: true,
    });
    if (!confirmed) return;
    completeSessionButton.disabled = true;
    try {
      await finishWorkout(active.id, false);
      await refreshData(store.getState().session.user.id);
      openWorkoutUi(null);
      showToast('האימון הושלם ונשמר');
    } catch (error) {
      completeSessionButton.disabled = false;
      showToast(error.message || 'לא הצלחנו לסיים את האימון');
    }
    return;
  }

  const cancelSessionButton = event.target.closest('[data-cancel-session]');
  if (cancelSessionButton) {
    const active = store.getState().workoutData.activeSession;
    if (!active) return;
    const confirmed = await confirmAction({
      title: 'לבטל את האימון הפעיל?',
      message: 'הסטים שכבר נשמרו יישארו בהיסטוריה, אבל האימון יסומן כמבוטל.',
      confirmLabel: 'בטל אימון',
      destructive: true,
    });
    if (!confirmed) return;
    cancelSessionButton.disabled = true;
    try {
      await finishWorkout(active.id, true);
      await refreshData(store.getState().session.user.id);
      openWorkoutUi(null);
      showToast('האימון בוטל');
    } catch (error) {
      cancelSessionButton.disabled = false;
      showToast(error.message || 'לא הצלחנו לבטל את האימון');
    }
    return;
  }

  const logout = event.target.closest('#logoutButton');
  if (logout) {
    try { await signOut(); } catch (error) { showToast(error.message || 'לא הצלחנו להתנתק'); }
  }
}

async function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === 'workoutBuilderForm') {
    event.preventDefault();
    const submit = document.querySelector(`[form="${form.id}"][type="submit"]`) || form.querySelector('[type="submit"]');
    const data = new FormData(form);
    const exerciseRows = [...form.querySelectorAll('[data-builder-exercise]')];
    if (!exerciseRows.length) { showFormError('workoutBuilderError', new Error('צריך להוסיף לפחות תרגיל אחד.')); return; }
    if (submit) submit.disabled = true;
    try {
      const templateId = await saveWorkoutTemplate({
        templateId: nullableNumber(form.dataset.templateId),
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
      if (submit) submit.disabled = false;
      showFormError('workoutBuilderError', error);
    }
    return;
  }

  if (form.id === 'exerciseEditorForm') {
    event.preventDefault();
    const submit = document.querySelector(`[form="${form.id}"][type="submit"]`) || form.querySelector('[type="submit"]');
    const data = new FormData(form);
    if (submit) submit.disabled = true;
    try {
      await saveCustomExercise({
        exerciseId: nullableNumber(form.dataset.exerciseId), name: data.get('name'), nameHe: data.get('nameHe'),
        equipment: data.get('equipment'), trackingType: data.get('trackingType'), muscleId: nullableNumber(data.get('muscleId')),
        instructions: data.get('instructions'),
      });
      await refreshData(store.getState().session.user.id);
      openWorkoutUi(null);
      showToast('התרגיל נשמר בספרייה שלך');
    } catch (error) {
      if (submit) submit.disabled = false;
      showFormError('exerciseEditorError', error);
    }
    return;
  }

  if (form.matches('[data-set-form]')) {
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
  }
}

function handleChange(event) {
  if (event.target?.id !== 'reduceMotionToggle') return;
  const settings = { ...store.getState().settings, reduceMotion: event.target.checked };
  writeSettings(settings);
  store.setState((state) => ({ ...state, settings }));
}

document.addEventListener('click', handleClick);
document.addEventListener('submit', handleSubmit);
document.addEventListener('change', handleChange);

listenToNavigation((route) => {
  const state = store.getState();
  if (!state.session || route === state.route) return;
  store.setState({ ...state, route, workoutUi: route === 'workouts' ? state.workoutUi : null });
});

store.subscribe(render);

function finishLaunchScreen() {
  const launch = document.querySelector('#launchScreen');
  if (!launch) return;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
  const minimumVisibleMs = reducedMotion ? 100 : 650;
  const remaining = Math.max(0, minimumVisibleMs - (performance.now() - launchStartedAt));
  window.setTimeout(() => {
    launch.classList.add('is-leaving');
    launch.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => launch.remove(), reducedMotion ? 20 : 320);
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
