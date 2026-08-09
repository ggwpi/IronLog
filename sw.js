const CACHE = 'ironlog-foundation-v20';
const CORE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/styles.css',
  '/src/components/anatomy-visual.css',
  '/src/features/home/home.css',
  '/src/nav-glass.css',
  '/src/app.js',
  '/src/core/store.js',
  '/src/core/storage.js',
  '/src/core/router.js',
  '/src/core/escape-html.js',
  '/src/assets/anatomy-assets.js',
  '/src/components/anatomy-visual.js',
  '/src/components/icons.js',
  '/src/components/ui.js',
  '/src/components/bottom-nav.js',
  '/src/features/auth/login-screen.js',
  '/src/features/home/home-screen.js',
  '/src/features/workouts/workout-catalog.js',
  '/src/features/workouts/workouts-screen.js',
  '/src/features/statistics/statistics-screen.js',
  '/src/features/settings/settings-screen.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
