import { supabase } from './lib/supabase.js';

const ACTIVE_WORKOUT_KEY = 'ironlog:active-workout';

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable in restricted/private browser contexts.
  }
}

/*
 * Restore the active-workout route before app.js creates its initial store.
 *
 * This used to happen in active-workout-runtime.js, which is loaded after
 * app.js. history.replaceState() does not emit a navigation event, so the URL
 * could become #/workouts while the store still believed it was on #/home.
 * Doing the migration here keeps URL and application state in sync from the
 * first render.
 */
function restoreActiveWorkoutRouteBeforeBoot() {
  if (!safeStorageGet(ACTIVE_WORKOUT_KEY)) return;
  if (location.hash.includes('/workouts')) return;
  history.replaceState(null, '', '#/workouts');
}

/*
 * Clear an obsolete local active-workout marker once the authenticated app has
 * proven that there is no active workout. This prevents an old localStorage
 * value from forcing the workouts route on every future reload.
 */
function reconcileActiveWorkoutMarker() {
  const app = document.querySelector('#app');
  if (!app) return;

  const sync = () => {
    if (!safeStorageGet(ACTIVE_WORKOUT_KEY)) return;
    const overview = app.querySelector('.workouts-concept');
    const activeWorkout = app.querySelector('.active-workout-page');
    if (overview && !activeWorkout) safeStorageRemove(ACTIVE_WORKOUT_KEY);
  };

  sync();
  new MutationObserver(sync).observe(app, { childList: true });
}

/*
 * IronLog screen stability layer.
 *
 * Supabase can emit INITIAL_SESSION, TOKEN_REFRESHED and repeated SIGNED_IN
 * events while the user is simply using the app. app.js treats every auth
 * callback as a reason to rebuild the application state, which in turn
 * remounts the current screen. The data/session itself is already maintained
 * by the Supabase client, so those maintenance events do not need a UI reload.
 */
function stabilizeAuthEvents() {
  const auth = supabase?.auth;
  if (!auth || auth.__ironlogStableAuth) return;

  const originalOnAuthStateChange = auth.onAuthStateChange.bind(auth);
  let knownUserId = null;

  auth.onAuthStateChange = (callback) => originalOnAuthStateChange((event, session) => {
    const userId = session?.user?.id || null;

    if (event === 'INITIAL_SESSION') {
      knownUserId = userId;
      return;
    }

    if (event === 'TOKEN_REFRESHED') {
      if (userId) knownUserId = userId;
      return;
    }

    /* Supabase may repeat SIGNED_IN when a tab becomes active again. */
    if (event === 'SIGNED_IN' && userId && userId === knownUserId) return;

    if (event === 'SIGNED_OUT') knownUserId = null;
    else if (userId) knownUserId = userId;

    callback(event, session);
  });

  Object.defineProperty(auth, '__ironlogStableAuth', {
    value: true,
    configurable: true,
  });
}

/*
 * Once the real app has mounted, page-entry animations must not replay merely
 * because data was synchronized and app.js replaced the screen markup.
 * Intentional micro-interactions remain available through the workout motion
 * classes; the stability stylesheet only removes generic remount entrances.
 */
function markUiStable() {
  const root = document.documentElement;
  const app = document.querySelector('#app');
  if (!app || root.classList.contains('ironlog-ui-stable')) return;

  const ready = () => Boolean(
    app.querySelector('.app-shell') ||
    app.querySelector('.login-screen') ||
    app.querySelector('.auth-shell:not(#bootFallback)')
  );

  const commit = () => {
    if (!ready() || root.classList.contains('ironlog-ui-stable')) return false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('ironlog-ui-stable');
    }));
    return true;
  };

  if (commit()) return;

  const observer = new MutationObserver(() => {
    if (commit()) observer.disconnect();
  });
  observer.observe(app, { childList: true });
}

restoreActiveWorkoutRouteBeforeBoot();
stabilizeAuthEvents();
markUiStable();
reconcileActiveWorkoutMarker();
