# Weekly cardio goals continuation — 2026-11-19

**Draft / incomplete / no merge or production release.**

Baseline: `2ef56e91dc3b109102c6a9ae34d2b61bba958267`; unchanged vendor pin:
`e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`. Original checkout and user data remain untouched.

## Original logic and IronLog boundaries

- Complete original `CardioWeek.jsx`, its component tests and the original cardio-goal engine tests
  retain exact upstream Git blobs, checked by three additional provenance assertions. The original
  engine and its dependencies were already imported intact in the preceding lifetime slice.
- The new Stats feature leaf uses the existing physical IronLog `Row`, `Section`, `Button`,
  `Segmented`, `Stepper`, SVG renderer, state store/update and sheet host. No existing screen,
  navigation, chart, card, global CSS, font, splash/loading or animation is replaced. The new CSS
  targets only this feature's data attributes and uses existing IronLog tokens.
- Original goal validation/editor behavior stays unchanged: per-activity minutes/distance/sessions,
  adding/editing/removing, selecting the first goal, profile speed units, the mirrored old
  `cardioGoal` number, eight profile-week totals and existing sport-map reads. No goals are written
  until the person saves; an unconfigured profile without cardio gains no card.
- Catalogue/IDs/history/speed/week-start remain IronLog's. No workout is recalculated or rewritten.
  Existing JSON/cloud/auth/sync/unit conversion remains in use; no schema or API runtime changes.
- Original geometry for the missing snowflake/stairs/tree icons is added through the existing SVG
  renderer. Existing icon geometry is unchanged; a regression checks all eleven activity kinds.
- All 19 packs contain the new strings and dynamic kind/unit labels. Upstream translations are
  used outside Hebrew; Brazilian overrides keep its reviewed inheritance fingerprint unchanged.

## Local evidence

- Original engine/component plus source/locale/real-store compatibility tests: **35 passed** in
  six files. They include goal addition/reordering/removal/cancel; frozen profile rendering;
  old-minute goal compatibility; units, activity categories and original calculation cases.
- The actual IronLog store retains existing workouts, IDs, loads/reps, 500-character notes,
  tags, media, custom exercises, weigh-ins, modules and the pending active draft while a goal changes.
- Pure API fixtures pass **2/2**: an old unstamped minutes edit retains unknown multi-goal settings;
  a modern explicit clear stays cleared. Neither test accesses a database/account.
- Final full frontend: **6,101 passed / 6 unchanged Windows path failures**,
  **6,107 tests / 516 files**, no skips, including the icon and frozen-profile cases.
  Latest-head Linux CI is recorded in PR #69.
- Full API: **689 passed / 24 failed / 46 skipped**, 759 total. API runtime is unchanged; existing
  Windows privilege/chmod/spec/source/timing failures remain visible.
- Full MCP: **96 passed / 1 unchanged Unix-permission failure**, 97 total, plus two Windows
  `fs.watch` EPERM fixture errors; not suppressed. Plain-Node MCP graph passes.
- Production Vite build and media staging pass (**6,554 stills + 6,554 animations**). Fatigue
  probes pass **108,000 + 1,800** comparisons. Final checks: **19 packs / 2,550 keys each**, in sync;
  source-string audit retains the existing report-only **52 missing-key backlog**.

## Actual browser and visual evidence

Local Chromium at 390 × 844, reduced motion, Asia/Jerusalem, English/Hebrew and true light/dark.
All API requests are mocked; every external request is blocked. Baseline source is archived from
`2ef56e91`, with the same locked dependencies, separate Vite caches and stable source files.
Fixtures assert the requested DOM theme and contain the existing palette-version stamp.

For each of the four combinations:

1. Existing Stats opens the original goal sheet through the actual button.
2. Add a running distance goal, add the legacy any-minutes goal, then move it first.
3. Actual guest JSON stores the two goals in that order and mirrors `cardioGoal: 150`.
4. Existing history/bodyweight and the offline active draft are unchanged; eight week bars render.
   Editor inputs fit the phone viewport. The synthetic cardio workout includes a realistic name,
   zero lifted volume and explicit clock fields so it does not manufacture a History `NaN` label.
5. Existing tempo, 500-character notes, read-only CSV downloads, duplicate protection and confirmed
   fresh import stories pass again after restoring only the isolated fixture between stories.

Final selected baseline Home/Stats/Workout comparison: **11 pixel-identical**; dark Hebrew Workout
differs at **four rounded-border pixels by one shade**. Dimensions match; no page errors.
This is not the full device/state/gesture/animation matrix.

Artifacts: [manifest](./verification/pr69-cardio-goals-2026-11-19/run.json),
[stories](./verification/pr69-cardio-goals-2026-11-19/results.json),
[pixel report](./verification/pr69-cardio-goals-2026-11-19/pixel-report.json),
[light Hebrew editor](./verification/pr69-cardio-goals-2026-11-19/migration-light-he-cardio-goal-editor.png),
[saved card](./verification/pr69-cardio-goals-2026-11-19/migration-light-he-cardio-goals-saved.png).

Reproduce using the existing CSV visual script with `IRONLOG_VERIFY_CARDIO=1`,
`IRONLOG_VERIFY_TEMPO=1`, `IRONLOG_BASELINE_SHA=2ef56e91dc3b109102c6a9ae34d2b61bba958267`,
independent temporary output and loopback baseline/current servers on 5180/5179. Only compare/copy
artifacts after `run.json` says `passed`. Tool paths are documented in the prior CSV report.

## Remaining boundaries

Full newer catalogue and activity capture/import/sync are not ported by this card; existing sport
maps are read without modification. Distance workout entry, tempo audio/haptic guide, full native
platform builds/devices, every visual state, backup restoration and the remaining release ledger
remain open. This Windows environment lacks Xcode and an installed Android SDK. No production
deployment, live data access or destructive migration occurred; keep PR #69 Draft.
