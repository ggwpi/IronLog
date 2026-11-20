// Data-preservation gate for IronLog upgrades.
//
// Older releases used this startup hook to DELETE legacy localStorage, IndexedDB,
// and Capacitor files when VITE_BACKEND_GENERATION was activated. A user's workout
// history can exist only in those places, particularly for guest / offline profiles.
// An upstream upgrade must never destroy that history.
//
// This function intentionally does NOT migrate or delete anything. A future,
// separately tested migration must make a verified backup, preserve identity and
// ownership, perform an additive copy, and validate its outcome BEFORE any cleanup.
// Keep the async signature: main.jsx awaits it before importing the app.
export async function resetLegacyData() {
  return false
}
