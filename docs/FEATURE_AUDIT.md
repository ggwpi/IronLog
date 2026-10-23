# IronLog / openGym feature audit — 23 October 2026

Reference: IronLog main `f6fd3ce`, imported openGym `e348fc17` (1.4.1), and upstream main `e9a303877d02e4237b183f96a9a6603990e8fafb` (1.4.2). Production checked: https://ironlog-v2-two.vercel.app. This is an investigation; no account data, sample training records or backend configuration was changed.

## Findings

| Feature | Status and evidence | What is needed |
| --- | --- | --- |
| AI Coach, questionnaire, chat, plan generation and reviews | Code exists. Web `coachAvailable` requires a signed-in user and enabled server configuration (`frontend/src/lib/coach.js`). Live `/api/config` returns HTTP 404, not configuration JSON. | Run the upstream Node API with persistent storage, same-origin API routing, authentication and a configured AI provider. Upgrade its security fixes before exposing it. Do not enable demo mode: it uses canned responses. |
| Accounts, passkeys, cross-device profile sync, pairing and administration | API source exists, but live `/api/me` also returns HTTP 404. `vercel.json` builds only the static frontend. | Deploy and connect the actual API; a static frontend cannot provide these services. |
| Catalogue exercise pictures and animations | Present: build stages 6,554 WebP stills and 6,554 MP4 clips, including figure variants. Production `/exercise-media/still/0001.webp` returns 200 `image/webp`; `/exercise-media/clip/0001.mp4` returns 200 `video/mp4`. These are representative asset checks, not an exhaustive download audit. | No blanket image replacement is needed. Workout media visibility also depends on the user's animation settings. See the licence restriction below. |
| Older IronLog custom exercises | Historical preset `49f9b2c8:frontend/src/ironlog/preset.json` defined custom exercises without media attachments. Custom exercises use `CustomMedia.jsx` and their own media references, rather than automatically inheriting catalogue pictures. The preset is no longer injected. | If these records remain in a user's profile, explicitly map appropriate catalogue alternatives or attach permitted media. Do not rewrite exercise IDs or historical workouts automatically. This audit cannot inspect the user's device-local profile. |
| Custom exercise uploads and progress photos | Present. Files are kept locally in IndexedDB (`media-store.js`); workout media and the progress gallery exist. Missing files can be retrieved from a server only when authenticated and media-enabled (`CustomMedia.jsx`). | Local uploads are separate from server sync. Cross-device recovery requires the API. In 1.4.1 the gallery shortcut attaches to today's logged workout; 1.4.2 adds photos for any day, multiple selection and gallery deletion with Undo. |
| Planning, rotation, guided workouts, progression, fatigue, muscle balance and strength statistics | Core API, store, Plan, Stats and Workout files match the imported 1.4.1 source in a direct Git comparison. These are present, rather than substituted widgets. | No evidence of omitted source in these flows. Meaningful charts require real workout history. This is source parity, not a claim that every flow was tested with the user's data. |
| Push reminders and server-assisted features | Their source exists; the production API is absent. Native reminders and web push are different mechanisms. | Configure the backend and web-push credentials for web reminders; verify delivery on a real installed iPhone. |
| Native iPhone/Watch features | The installed website is a PWA, not the upstream native iOS application. Upstream 1.4.2 introduces Apple Watch, widgets, Live Activities/Dynamic Island, Apple Health and native animation packs. | These need a native build and platform integrations; installing the website cannot enable them. |

## Changes added upstream after IronLog's imported version

Upstream 1.4.2 was published on 23 October. In addition to the native features above, it adds alternative exercises in routines, configurable warm-up rests, bar weights by bar type, skipping finished exercises, automatic advancement after timed exercises, smaller change plates, earlier-date weigh-ins, improved progress photos, Coach consent and account deletion. It also fixes workout persistence, guest backup merging, muscle-balance navigation and several security issues.

These are version gaps, not features removed during IronLog branding. See upstream [v1.4.2 changelog](https://github.com/DuarteSantos8/openGym/blob/e9a303877d02e4237b183f96a9a6603990e8fafb/CHANGELOG.md). This audit does not silently upgrade 471 changed files. Upgrade and verify 1.4.2 before deploying its API: the release fixes sign-in origin checks, path handling, push subscription ownership and Coach sandbox checks, among other issues.

## Exercise-media licence

The code is AGPL, but the Gym visual images and animations are **not**. `catalogue/media/NOTICE.md` expressly restricts the supplied assets to openGym and requires a separate licence for independent apps. IronLog currently ships these files. Confirm permission for this branded distribution or replace the media with properly licensed assets; source availability does not establish media reuse rights. No new assets were copied for this audit.

## Recommended order

1. Upgrade to upstream 1.4.2 while preserving IronLog branding, dock and user data.
2. Resolve media reuse permission and choose persistent API hosting; connect the upstream API to `/api` and verify sign-in/sync.
3. Configure Coach and verify actual provider responses, consent and generated plans with a real account.
4. Inspect any legacy custom exercises on the user's device before proposing catalogue mappings.
5. Treat native iPhone/Watch integrations as a separate deliverable.

## Navigation verification

This change makes the dock 82 CSS pixels tall instead of 58, increases icons and labels, raises the controls above the bottom edge, and retains the blurred background connected to the viewport bottom. The cold-launch viewport tracker is preserved. Browser checks cover 320/390/430/1280 px, LTR/RTL, direct routes, themes and simulated installed-iPhone stale viewport readings. Real iPhone Safari hardware is not available in this environment.
