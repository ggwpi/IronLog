# IronLog

IronLog now uses [openGym](https://github.com/DuarteSantos8/openGym)'s full training application as its foundation, with the original IronLog Hebrew home, workouts and statistics UI and theory widgets. The upstream planning, rotation, progression, exercise catalogue, guided sessions, rest timer, imports, offline storage, passkeys and sync remain available.

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

## IronLog UI and widgets

- The original page renderers and CSS are preserved in `frontend/src/ironlog/legacy` and `original.css`. A shadow root isolates their styling from openGym's session editor.
- `model.js` adapts completed workouts, set effort, weights and routines to the original widgets. Both interfaces read the same training history.
- The statistics page retains IronLog's weight target band, estimated 1RM, weekly effective muscle sets, RIR adherence, sleep/readiness and mesocycle widgets, followed by openGym's charts and body maps.
- Expand **IronLog · התאוששות ומחזור אימון** in Stats to log sleep/readiness or configure a cycle. These are persisted through the same store and backup system. Deload weeks 4/8/12 are reminders, not automatic changes to your routines.
- Original weight-gain and volume targets are planning heuristics. Unsupported sub-muscle distinctions are omitted rather than inferred from broader catalogue groups.
- Plan also offers the original six-day IronLog programme, including all 38 original exercises, rest times and specific muscle-credit metadata. Adding it preserves existing routines.
- Routine editing, weekday and rotation planning remain in Plan, below the original workout cards.

## Existing IronLog account and data

The original application remains available at `/classic/` (linked from Settings), with its existing Supabase account and data. The original root `src/` and migrations are preserved. No cloud database migration or deletion is performed. The new engine uses openGym's data format; old Supabase records are **not automatically imported**. Back up your old records before switching. Existing `ironlog.v3` local data is also left untouched.

## Tests

```sh
npm test
npm test --prefix api
```

Upstream frontend/API tests are retained. `frontend/src/ironlog/model.test.js` checks the data adapter's unit conversion, completed working sets, secondary muscle credit, empty data and stale check-ins.

## Source and licensing

Based on openGym commit `e348fc17c42c7e9a211c5972e573ad3698190ee2` (v1.4.1 source), adapted for IronLog. Copyright and third-party notices remain in [NOTICE.md](NOTICE.md). The adapted application is distributed under [AGPL-3.0-or-later](LICENSE); Settings links to this fork's source and upstream.

Exercise animations have separate Gym visual terms: the included unmodified 180px media may remain with a **non-commercial fork** and its notices. Commercial use requires a separate licence from Gym visual. See [media notice](catalogue/media/NOTICE.md).
