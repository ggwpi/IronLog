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
  if (replace) history.replaceState(null, '', hash);
  else if (location.hash !== hash) history.pushState(null, '', hash);
  window.dispatchEvent(new CustomEvent('ironlog:navigate', { detail: next }));
}

export function listenToNavigation(callback) {
  const handler = (event) => callback(event.detail || routeFromLocation());
  const popHandler = () => callback(routeFromLocation());
  window.addEventListener('ironlog:navigate', handler);
  window.addEventListener('popstate', popHandler);
  window.addEventListener('hashchange', popHandler);
  return () => {
    window.removeEventListener('ironlog:navigate', handler);
    window.removeEventListener('popstate', popHandler);
    window.removeEventListener('hashchange', popHandler);
  };
}
