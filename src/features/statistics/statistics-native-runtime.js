const app = document.querySelector('#app');
const seen = new Set();
let observer = null;
let statsRouteActive = false;
let syncQueued = false;

function isStatisticsRoute() {
  const route = location.hash.replace(/^#\/?/, '').split('?')[0];
  return route === 'statistics' || Boolean(document.querySelector('.statistics-page--native'));
}

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
}

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const key = element.dataset.statsKey || `section-${[...document.querySelectorAll('[data-stats-animate]')].indexOf(element)}`;
      seen.add(key);
      element.classList.add('is-visible');
      observer.unobserve(element);
    });
  }, { root: null, rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
  return observer;
}

function revealStatistics() {
  syncQueued = false;
  const page = document.querySelector('.statistics-page--native');
  const active = isStatisticsRoute();

  if (!active || !page) {
    if (statsRouteActive) {
      seen.clear();
      observer?.disconnect();
      observer = null;
    }
    statsRouteActive = false;
    return;
  }

  statsRouteActive = true;
  page.classList.add('stats-native-live');
  const reduced = prefersReducedMotion();

  page.querySelectorAll('[data-stats-animate]').forEach((element) => {
    const key = element.dataset.statsKey || '';
    if (reduced || seen.has(key)) {
      element.classList.add('is-visible');
      return;
    }
    getObserver().observe(element);
  });
}

function scheduleReveal() {
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => requestAnimationFrame(revealStatistics));
}

if (app) new MutationObserver(scheduleReveal).observe(app, { childList: true, subtree: true });
addEventListener('hashchange', scheduleReveal);
addEventListener('popstate', scheduleReveal);
addEventListener('pageshow', scheduleReveal);
window.addEventListener('ironlog:navigate', scheduleReveal);

scheduleReveal();
