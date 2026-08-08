# IronLog

Clean, source-controlled rebuild of the IronLog workout tracker.

## Included
- Six-day hypertrophy program.
- Big Screen guided workout mode with direct exercise selection.
- Set-by-set load, reps and RIR tracking.
- Previous-set hints and automatic rest timer.
- Fit-content workout sheet that can expand to full screen by swiping up.
- Workout history, body-weight tracking, JSON backup/restore.
- LocalStorage persistence and offline service-worker cache.
- Static files only: no Base64/GZIP boot loader and no `atob()` startup path.

## Source layout
- `index.html` — app shell and screens.
- `src/data.js` — six-day workout program.
- `src/storage.js` — persistent data layer.
- `src/app.js` — workout/session logic.
- `src/styles.css` — responsive iPhone-first UI.
- `sw.js` — offline cache.
- `manifest.webmanifest` — installable web app metadata.
- `vercel.json` — static Vercel configuration.

## Deploy
Deploy the repository root as a static Vercel project. No build command is required.
