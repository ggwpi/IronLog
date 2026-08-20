import { animateMountedScreen } from './components/screen-transition.js';

const app = document.querySelector('#app');
let lastScreenKey = null;
let scheduled = false;

function stableClasses(element) {
  if (!element?.classList) return '';
  return [...element.classList]
    .filter((name) => ![
      'animate-enter', 'app-screen-frame--enter', 'motion-ready',
      'motion-state-change', 'is-state-shift', 'is-next-refresh',
    ].includes(name))
    .sort()
    .join('.');
}

function logicalSurface() {
  const content = document.querySelector('#appContent');
  if (content) {
    const child = [...content.children].find((element) => !element.classList.contains('data-banner')) || content;
    return { frame: content, child };
  }
  const child = app?.firstElementChild || null;
  return { frame: child, child };
}

function screenKey() {
  const { child } = logicalSurface();
  if (!child) return 'empty';

  const route = location.hash.replace(/^#\/?/, '') || 'home';
  const rootId = child.id || '';
  const rootClasses = stableClasses(child);
  const mode = child.matches?.('.active-workout-page') ? 'active-workout'
    : child.matches?.('.workouts-concept') ? 'workouts-overview'
    : child.matches?.('.login-screen') ? 'login'
    : child.matches?.('.auth-shell') ? 'auth'
    : rootClasses || child.tagName.toLowerCase();

  // Route + top-level screen identity changes for navigation/sub-pages, while
  // normal data refreshes keep the same key and therefore do not reanimate.
  return `${route}|${mode}|${rootId}`;
}

function settleScreen() {
  scheduled = false;
  const nextKey = screenKey();
  if (lastScreenKey === null) {
    lastScreenKey = nextKey;
    return;
  }
  if (nextKey === lastScreenKey) return;
  lastScreenKey = nextKey;

  const { frame } = logicalSurface();
  if (!frame || frame.closest?.('#launchScreen')) return;
  animateMountedScreen(frame);
}

function scheduleSettle() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => requestAnimationFrame(settleScreen));
}

if (app) {
  new MutationObserver(scheduleSettle).observe(app, { childList: true, subtree: true });
}
window.addEventListener('ironlog:navigate', scheduleSettle);
window.addEventListener('popstate', scheduleSettle);
window.addEventListener('hashchange', scheduleSettle);

scheduleSettle();
