# IronLog

IronLog now uses [openGym](https://github.com/DuarteSantos8/openGym)'s full training application as its foundation, with one Hebrew/RTL interface styled for IronLog and theory insights integrated into the native widgets. The upstream planning, rotation, progression, exercise catalogue, guided sessions, rest timer, imports, offline storage, passkeys and sync remain available.

## Run locally

Requires Node 22.12+ (or Node 24).

```sh
npm ci --ignore-scripts --prefix frontend
npm ci --ignore-scripts --omit=optional --prefix api
npm run start:api
# In a second terminal:
npm run dev
```

Open http://localhost:5173. Continue without an account for local training; passkey accounts require the API. The dev proxy uses the backend's default origin, http://localhost:8080. For production passkeys, configure `RP_ID` and `ORIGIN` for your HTTPS domain.

## Self-host the full application

```sh
cp .env.example .env
# Set RP_ID and ORIGIN for your domain in .env.
docker compose up -d --build
```

The compose file builds this IronLog source; it does not pull the unmodified openGym frontend. Keep backups of `data/`. See [self-hosting](docs/SELF_HOSTING.md).

## Static/Vercel build

```sh
npm ci --ignore-scripts --prefix frontend
npm run build
```

Output is `frontend/dist`, including the exercise media. `vercel.json` explicitly uses the static builder, so the self-hosted `api/` source is not incorrectly deployed as individual serverless functions. Static hosting supports guest/local training. Account sync, passkeys, uploads and the server-side coach require the included Node API behind a same-origin `/api` proxy; static hosting alone does not provide those endpoints.

## Hebrew

The app starts in Hebrew with full RTL layout, Hebrew exercise names and details, localized dates and counts, and isolated LTR numeric fields and timers. Existing installs receive a one-time language upgrade while keeping their workout data. See [Hebrew support](docs/HEBREW.md).

## IronLog UI and widgets

- A single React interface uses openGym's native screens and shared store, with IronLog's graphite/lime surfaces, Hebrew typography, anatomy previews and five-tab navigation. The duplicate legacy pages, Shadow DOM and their positioning rules have been removed.
- Home reads today's actual plan through openGym's scheduling helpers, including rotations, overrides, completed sessions and active workouts. No programme or session is generated as fallback content.
- Volume references are integrated into the native weekly-volume card, RIR target adherence into the effort card, and the seven-day weight trend into the bodyweight chart. Both native charts and IronLog insights use the same completed working sets and muscle-credit functions.
- Recovery check-ins supplement the native fatigue map without replacing or changing its calculation. They are entered explicitly and stored with the profile; absent measurements stay empty.
- A configured training cycle displays actual logged sessions per week. Time elapsed never marks a week as trained, and no deload weeks are invented.
- Original volume and mass-gain ranges are labelled planning references. Catalogue muscle groups are used directly; unsupported sub-muscle distinctions are not inferred.
- Routine editing, weekday/rotation planning, starter-plan selection, exercise details and workout logging remain openGym's native flows. The previous IronLog programme injector has been removed; existing user plans remain intact.

## Existing IronLog account and data

The original application remains available at `/classic/` (linked from Settings), with its existing Supabase account and data. The original root `src/` and migrations are preserved. No cloud database migration or deletion is performed. The new engine uses openGym's data format; old Supabase records are **not automatically imported**. Back up your old records before switching. Existing `ironlog.v3` local data is also left untouched.

## Tests

```sh
npm test
npm test --prefix api
```

Upstream frontend/API tests are retained. `frontend/src/ironlog/training.test.js` checks parity with native muscle credits, week boundaries, rotations, completed working sets, missing/rated effort, weight windows, check-ins and actual cycle history.

## Source and licensing

Based on openGym commit `e348fc17c42c7e9a211c5972e573ad3698190ee2` (v1.4.1 source), adapted for IronLog. Copyright and third-party notices remain in [NOTICE.md](NOTICE.md). The adapted application is distributed under [AGPL-3.0-or-later](LICENSE); Settings links to this fork's source and upstream.

Exercise animations have separate Gym visual terms: the included unmodified 180px media may remain with a **non-commercial fork** and its notices. Commercial use requires a separate licence from Gym visual. See [media notice](catalogue/media/NOTICE.md).
