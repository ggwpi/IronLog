// Boundary: keep IronLog's recorded dates and note limit; no profile writes here.
export * from '../history.js'
// Retain IronLog's existing volume interpretation at the boundary. New warm-up/bodyweight
// volume and challenges still require their separate integration and verification.
export { workoutVolume as sessionVolume } from '../history.js'
