let currentScreenKey = null;
let activeViewTransition = null;
let fallbackTimer = 0;

function reducedMotion() {
  return Boolean(
    document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function finishTransition() {
  document.documentElement.classList.remove('ironlog-screen-transitioning');
  activeViewTransition = null;
}

function runFallback(frame) {
  if (!frame || reducedMotion()) return;
  window.clearTimeout(fallbackTimer);
  frame.classList.remove('app-screen-frame--enter');
  // Force one style flush so repeated, fast screen changes still restart cleanly.
  void frame.offsetWidth;
  frame.classList.add('app-screen-frame--enter');
  fallbackTimer = window.setTimeout(() => frame.classList.remove('app-screen-frame--enter'), 300);
}

/** Animate one already-mounted screen as a single surface. */
export function animateMountedScreen(frame) {
  if (!frame || reducedMotion()) return;
  document.documentElement.classList.add('ironlog-screen-transitioning');
  runFallback(frame);
  window.setTimeout(() => document.documentElement.classList.remove('ironlog-screen-transitioning'), 300);
}

/**
 * Mutate the app to a new logical screen. The transition runs only when the
 * supplied screen key changes, so cloud/data refreshes never animate the page.
 * The whole screen frame is animated as one surface; child/content animations
 * are intentionally not involved.
 */
export function renderWithScreenTransition(screenKey, mutate) {
  const nextKey = String(screenKey || 'screen');
  const changed = currentScreenKey !== null && currentScreenKey !== nextKey;
  currentScreenKey = nextKey;

  const commit = () => {
    mutate();
    const frame = document.querySelector('[data-app-screen-frame]');
    if (frame) frame.dataset.screenKey = nextKey;
  };

  if (!changed || reducedMotion()) {
    activeViewTransition?.skipTransition?.();
    activeViewTransition = null;
    commit();
    return;
  }

  activeViewTransition?.skipTransition?.();
  document.documentElement.classList.add('ironlog-screen-transitioning');

  if (typeof document.startViewTransition === 'function') {
    try {
      activeViewTransition = document.startViewTransition(commit);
      activeViewTransition.finished.catch(() => {}).finally(finishTransition);
      return;
    } catch {
      activeViewTransition = null;
    }
  }

  commit();
  runFallback(document.querySelector('[data-app-screen-frame]'));
  window.setTimeout(finishTransition, 300);
}
