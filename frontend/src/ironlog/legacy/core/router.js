export const routes = Object.freeze(['home', 'workouts', 'statistics', 'settings']);

export function normalizeRoute(route) {
  return routes.includes(route) ? route : 'home';
}

export function routeFromLocation() {
  return normalizeRoute(location.hash.replace(/^#\/?/, ''));
}

export function navigate(route, { replace = false } = {}) {
  const next = normalizeRoute(route);
  const hash = `#/${next}`;

  // Clicking the already-active route should be a no-op. Besides avoiding an
  // unnecessary app render, this keeps transition/runtime listeners from
  // replaying animations for a screen that did not actually change.
  if (location.hash === hash) return next;

  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);

  window.dispatchEvent(new CustomEvent('ironlog:navigate', { detail: next }));
  return next;
}

export function listenToNavigation(callback) {
  let lastRoute = routeFromLocation();

  const notify = (route) => {
    const next = normalizeRoute(route);
    if (next === lastRoute) return;
    lastRoute = next;
    callback(next);
  };

  const handler = (event) => notify(event.detail || routeFromLocation());
  const popHandler = () => notify(routeFromLocation());

  window.addEventListener('ironlog:navigate', handler);
  window.addEventListener('popstate', popHandler);
  window.addEventListener('hashchange', popHandler);

  return () => {
    window.removeEventListener('ironlog:navigate', handler);
    window.removeEventListener('popstate', popHandler);
    window.removeEventListener('hashchange', popHandler);
  };
}
