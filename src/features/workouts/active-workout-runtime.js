const ACTIVE_KEY = 'ironlog:active-workout';
const REST_KEY_PREFIX = 'ironlog:rest:';
let elapsedInterval = null;
let restInterval = null;

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function restKey(sessionId) { return `${REST_KEY_PREFIX}${sessionId}`; }

function stopTimers() {
  if (elapsedInterval) window.clearInterval(elapsedInterval);
  if (restInterval) window.clearInterval(restInterval);
  elapsedInterval = null;
  restInterval = null;
}

function paintRest(sessionId, endAt) {
  const shell = document.querySelector('#restTimer');
  const value = document.querySelector('#restTimerValue');
  if (!shell || !value) return;
  const update = () => {
    const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    shell.hidden = false;
    value.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const ring = shell.querySelector('.live-rest-ring');
    if (ring) ring.style.opacity = remaining ? '1' : '.55';
    if (!remaining) {
      window.clearInterval(restInterval);
      restInterval = null;
      localStorage.removeItem(restKey(sessionId));
      shell.classList.add('is-finished');
    }
  };
  update();
  if (endAt > Date.now()) restInterval = window.setInterval(update, 250);
}

function hydrateActiveScreen() {
  const page = document.querySelector('.active-workout-page');
  if (!page) return;
  const sessionId = page.dataset.activeSession;
  const startedAt = new Date(page.dataset.startedAt).getTime();
  localStorage.setItem(ACTIVE_KEY, sessionId || 'active');

  const elapsed = document.querySelector('#liveWorkoutElapsed');
  if (elapsed && Number.isFinite(startedAt)) {
    const paint = () => { elapsed.textContent = formatElapsed(Date.now() - startedAt); };
    paint();
    elapsedInterval = window.setInterval(paint, 1000);
  }

  if (sessionId) {
    const saved = Number(localStorage.getItem(restKey(sessionId)) || 0);
    if (saved > Date.now()) paintRest(sessionId, saved);
    else if (saved) localStorage.removeItem(restKey(sessionId));
  }
}

function rehydrate() {
  stopTimers();
  hydrateActiveScreen();
}

// Returning to the app during an unfinished workout should reopen the workout, not a passive dashboard.
if (localStorage.getItem(ACTIVE_KEY) && !location.hash.includes('/workouts')) {
  history.replaceState(null, '', '#/workouts');
}

new MutationObserver(() => {
  window.clearTimeout(window.__ironlogActiveHydrate);
  window.__ironlogActiveHydrate = window.setTimeout(rehydrate, 20);
}).observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('pageshow', rehydrate);
document.addEventListener('visibilitychange', () => { if (!document.hidden) rehydrate(); });

// Capture interactions so runtime state survives app renders and full app restarts.
document.addEventListener('click', (event) => {
  const step = event.target.closest('[data-step]');
  if (step) {
    const input = document.getElementById(step.dataset.stepTarget);
    if (input) {
      const next = Math.max(Number(input.min || 0), Number(input.value || 0) + Number(step.dataset.step || 0));
      const max = input.max === '' ? Infinity : Number(input.max);
      input.value = String(Math.min(max, Math.round(next * 100) / 100));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  if (event.target.closest('[data-minimize-workout]')) {
    location.hash = '#/home';
  }

  const skip = event.target.closest('#skipRestTimer');
  if (skip) {
    const page = document.querySelector('.active-workout-page');
    if (page?.dataset.activeSession) localStorage.removeItem(restKey(page.dataset.activeSession));
  }

  if (event.target.closest('[data-complete-session], [data-cancel-session]')) {
    localStorage.removeItem(ACTIVE_KEY);
    const page = document.querySelector('.active-workout-page');
    if (page?.dataset.activeSession) localStorage.removeItem(restKey(page.dataset.activeSession));
  }
}, true);

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-set-form]');
  if (!form) return;
  const page = document.querySelector('.active-workout-page');
  const sessionId = page?.dataset.activeSession;
  const seconds = Number(form.dataset.restSeconds || 0);
  if (sessionId && seconds > 0) {
    const endAt = Date.now() + seconds * 1000;
    localStorage.setItem(restKey(sessionId), String(endAt));
  }
}, true);

rehydrate();
