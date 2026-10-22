const MOTION_STYLE_ID = 'ironlog-active-workout-motion';
let lastState = null;
let motionHydrateTimer = null;

function ensureMotionStyles() {
  if (document.getElementById(MOTION_STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = MOTION_STYLE_ID;
  link.rel = 'stylesheet';
  link.href = '/src/features/workouts/active-workout-motion.css?v=1';
  document.head.appendChild(link);
}

function reducedMotion() {
  return document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function workoutProgress() {
  const bar = document.querySelector('.live-total-progress i');
  const raw = bar?.style.getPropertyValue('--progress') || '';
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function setPosition() {
  const text = document.querySelector('.live-ring b')?.textContent || '';
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  return match ? { current: Number(match[1]), planned: Number(match[2]) } : { current: 0, planned: 0 };
}

function snapshot() {
  const page = document.querySelector('.active-workout-page');
  if (!page) return null;
  const { current, planned } = setPosition();
  return {
    session: page.dataset.activeSession || '',
    exercise: document.querySelector('.live-exercise-name h1')?.textContent?.trim() || '',
    current,
    planned,
    progress: workoutProgress(),
  };
}

function restartClass(element, className, duration = 720) {
  if (!element || reducedMotion()) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function showSavedToast(page) {
  if (!page || reducedMotion()) return;
  page.querySelector('.live-motion-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'live-motion-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = '<b>✓</b><span>הסט נשמר</span>';
  page.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => toast.classList.add('is-leaving'), 720);
  window.setTimeout(() => toast.remove(), 1120);
}

function applyStateMotion(page, state) {
  if (reducedMotion()) return;
  if (!lastState || lastState.session !== state.session) {
    page.classList.add('motion-first-mount');
    window.setTimeout(() => page.classList.remove('motion-first-mount'), 1100);
    return;
  }

  const exerciseChanged = lastState.exercise !== state.exercise;
  const setChanged = lastState.current !== state.current || lastState.progress !== state.progress;
  if (!exerciseChanged && !setChanged) return;

  page.classList.add('motion-state-change');
  if (exerciseChanged) page.classList.add('motion-exercise-change');
  if (setChanged) page.classList.add('motion-set-complete');

  restartClass(document.querySelector('.live-ring'), 'is-set-pop', 780);
  restartClass(document.querySelector('.live-hero-flat'), 'is-state-shift', 780);
  restartClass(document.querySelector('.live-chart'), 'is-redraw', 900);
  restartClass(document.querySelector('.live-next-flat'), 'is-next-refresh', 760);

  if (setChanged && state.progress > lastState.progress) showSavedToast(page);

  window.setTimeout(() => {
    page.classList.remove('motion-state-change', 'motion-exercise-change', 'motion-set-complete');
  }, 1000);
}

function hydrateMotion() {
  ensureMotionStyles();
  const page = document.querySelector('.active-workout-page');
  if (!page) return;

  const state = snapshot();
  if (!state) return;
  page.classList.add('motion-ready');
  applyStateMotion(page, state);
  lastState = state;
}

function scheduleHydrate() {
  window.clearTimeout(motionHydrateTimer);
  motionHydrateTimer = window.setTimeout(hydrateMotion, 25);
}

function pulseField(input) {
  if (!input || reducedMotion()) return;
  restartClass(input, 'is-value-bump', 360);
  const field = input.closest('.live-inline-fields > div');
  restartClass(field, 'is-field-active', 420);
}

function pressElement(element) {
  if (!element || reducedMotion()) return;
  element.classList.add('is-pressed');
  window.setTimeout(() => element.classList.remove('is-pressed'), 180);
}

new MutationObserver((mutations) => {
  if (mutations.some((mutation) => mutation.type === 'childList' || mutation.attributeName === 'hidden')) {
    scheduleHydrate();
  }
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });

document.addEventListener('pointerdown', (event) => {
  const target = event.target.closest('.live-finish-flat,.live-next-flat,[data-step],.live-workout-header button,#skipRestTimer');
  if (target) pressElement(target);
}, { passive: true });

document.addEventListener('click', (event) => {
  const step = event.target.closest('[data-step]');
  if (step) {
    const input = document.getElementById(step.dataset.stepTarget);
    window.setTimeout(() => pulseField(input), 0);
  }
}, false);

document.addEventListener('input', (event) => {
  if (!event.target.closest('.live-inline-fields')) return;
  pulseField(event.target);
}, true);

document.addEventListener('submit', (event) => {
  if (!event.target.closest('[data-set-form]')) return;
  const page = document.querySelector('.active-workout-page');
  const action = document.querySelector('.live-finish-flat');
  page?.classList.add('is-saving-set');
  action?.classList.add('is-committing');
}, true);

document.addEventListener('focusin', (event) => {
  const field = event.target.closest('.live-inline-fields > div');
  field?.classList.add('has-focus');
});

document.addEventListener('focusout', (event) => {
  const field = event.target.closest('.live-inline-fields > div');
  window.setTimeout(() => {
    if (field && !field.contains(document.activeElement)) field.classList.remove('has-focus');
  }, 0);
});

window.addEventListener('pageshow', scheduleHydrate);
window.addEventListener('resize', scheduleHydrate, { passive: true });
ensureMotionStyles();
scheduleHydrate();
