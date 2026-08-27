import './statistics-detail-runtime.js';

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
      observer?.unobserve(element);
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

function resetDisclosureBody(body) {
  body.style.removeProperty('height');
  body.style.removeProperty('opacity');
  body.style.removeProperty('transform');
  body.style.removeProperty('overflow');
}

function animateDisclosure(details, opening) {
  const body = details.querySelector(':scope > .native-disclosure-body');
  if (!body) {
    details.open = opening;
    return;
  }

  if (prefersReducedMotion() || typeof body.animate !== 'function') {
    details.open = opening;
    details.classList.remove('is-closing');
    resetDisclosureBody(body);
    return;
  }

  if (details.dataset.animating === 'true') return;
  details.dataset.animating = 'true';

  const easing = 'cubic-bezier(.16,.82,.18,1)';

  if (opening) {
    details.classList.remove('is-closing');
    details.open = true;
    resetDisclosureBody(body);
    const targetHeight = Math.max(1, body.scrollHeight);
    body.style.height = '0px';
    body.style.opacity = '0';
    body.style.transform = 'translateY(-8px)';
    body.style.overflow = 'hidden';

    const animation = body.animate([
      { height: '0px', opacity: 0, transform: 'translateY(-8px)' },
      { height: `${targetHeight}px`, opacity: 1, transform: 'translateY(0)' },
    ], { duration: 560, easing, fill: 'forwards' });

    animation.onfinish = () => {
      delete details.dataset.animating;
      resetDisclosureBody(body);
    };
    animation.oncancel = animation.onfinish;
    return;
  }

  details.classList.add('is-closing');
  const startHeight = Math.max(1, body.getBoundingClientRect().height || body.scrollHeight);
  body.style.overflow = 'hidden';

  const animation = body.animate([
    { height: `${startHeight}px`, opacity: 1, transform: 'translateY(0)' },
    { height: '0px', opacity: 0, transform: 'translateY(-7px)' },
  ], { duration: 460, easing, fill: 'forwards' });

  animation.onfinish = () => {
    details.open = false;
    details.classList.remove('is-closing');
    delete details.dataset.animating;
    resetDisclosureBody(body);
  };
  animation.oncancel = animation.onfinish;
}

document.addEventListener('click', (event) => {
  const summary = event.target.closest('.statistics-page--native .native-disclosure > summary');
  if (!summary) return;
  const details = summary.parentElement;
  if (!(details instanceof HTMLDetailsElement)) return;
  if (prefersReducedMotion()) return;
  event.preventDefault();
  animateDisclosure(details, !details.open);
});

if (app) new MutationObserver(scheduleReveal).observe(app, { childList: true, subtree: true });
addEventListener('hashchange', scheduleReveal);
addEventListener('popstate', scheduleReveal);
addEventListener('pageshow', scheduleReveal);
window.addEventListener('ironlog:navigate', scheduleReveal);

scheduleReveal();
