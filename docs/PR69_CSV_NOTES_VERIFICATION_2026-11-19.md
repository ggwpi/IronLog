# CSV and set-note continuation verification — 2026-11-19

**Draft / incomplete / no merge or production release.**

Branch: `feature/opengym-full-ironlog-ui-safe-migration`. Start/baseline: `1696160064c61b474e91c91b58107fca029711d0`.
Upstream remains the unchanged submodule at `e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`.
No source, configuration or data on main/production is changed. No live user account is read or written.

## Source and behavior

- Twelve complete original CSV/dependency modules and four original test files are copied unchanged
  into `frontend/src/lib/opengym-v145/`; sixteen raw Git-blob checks protect them. Boundary shims
  retain IronLog's catalogue, IDs, dates, locale and existing helpers.
- Original workout/body CSV serialization is read-only and exposed in existing Settings → Data &
  backup using IronLog's `Row`, `Button`, `Segmented`, `TextField` and existing bottom-sheet host.
  Browser filenames use IronLog; native sharing reuses the existing `shareExport` function.
- Own-workout CSV detection delegates to the original recognizer/reader. Other current third-party
  and XML imports retain their original IronLog reader. Confirmation and actual writes still use
  IronLog's existing `update`/import merge; existing dates are left alone and duplicate imports add
  nothing. Existing offline drafts, settings, routines, media references and cloud machinery remain.
- The original reader's 140-character note limit stays unchanged inside upstream. A separate
  metadata adapter restores the longer source column after parsing, including formula guards,
  session/set identity and IronLog's existing 500-character notes. It changes only new parser output.
  If a receiving profile already owns the same custom exercise under another ID, the original
  `priorCustom` identity helper aligns metadata with the reader's chosen local ID; a regression
  test verifies the complete long note survives without replacing that ID or existing data.
- The existing set-note editor keeps its 500-character limit, keyboard behavior and layout. Its
  menu/inline actions are now reachable and saved notes display in existing history.
- MCP's existing read-only set projection adds upstream `note` and `color_tag` via unchanged helpers;
  absent/unknown fields retain the old response shape, full IronLog notes are retained and set media
  references are not added to responses. No MCP client or real profile was queried.
- API fixtures preserve long known-note round trips and intentional old-client note clearing.
  IronLog already treats omission of a known `note` field as deliberate clearing; changing that to
  restore every omitted note would break an existing customization. Unknown tags remain protected.
  API runtime/auth/sync logic is unchanged.

## Local automated evidence

- Full frontend suite at the integration checkpoint: **6,051 passed / 6 failed**, 506 files,
  6,057 tests. The six failures are unchanged Windows path expectations in mobile-bundle (4)
  and asset-pack (2) script tests. No tests were weakened or disabled.
- Initial parallel frontend/API run additionally hit a cold module-load timeout and a genuine
  missing Slavic measurement plural. The plural forms were corrected in ru/uk/pl; the phone
  remote-sync suite passed **26/26** independently and in the final full frontend run (no skips).
- Final locale/source/data/provenance targeted tests: **59 passed** in five files, including
  pt-BR inheritance, Slavic plural forms, all 19 packs, source hashes and CSV compatibility.
  Slavic changes preserve proper one/few/many forms; explicit Brazilian labels preserve its
  existing inherited-locale boundary.
- Earlier focused actual controls/editor/import/source suite: **291 passed** in six files.
- Production frontend build passed. Final locale check: **19 packs, 2,507 keys each**, in sync.
  Source-string audit remains report-only at its pre-slice **52 missing keys**; no new untranslated
  labels are left by this slice. From/To and the newly imported Black colour label are localized.
- Fatigue probes passed: **108,000** comparisons (largest increase 0) and **1,800** randomized
  deletion comparisons. Media staging retains **6,554 stills + 6,554 animations**.
- MCP suite: **96 passed / 1 failed**, 97 tests; unchanged Windows permission-denial fixture fails.
  The new metadata tests pass. The complete MCP graph loads under plain Node.
- Full API: **686 passed / 24 failed / 46 skipped**, 756 tests. API runtime is unchanged;
  Windows privilege/chmod, spec/source and timing failures remain visible. Pure sync/tag/note
  fixtures pass **24/24**, exercising no database or live account. Fresh Linux CI results are
  recorded in the PR; isolated Postgres/auth/sync CI remains a required gate.

## Actual browser stories

Chromium at 390 × 844, reduced motion, Asia/Jerusalem timezone, separate synthetic guest contexts.
Every API call is mocked and all non-loopback requests are blocked. Baseline application source is
archived from `16961600`; it uses the same locked dependencies. Only its temporary Vite cache
directory is isolated to avoid sharing optimizer/HMR state with the migration server.

The profile fixture explicitly has `ironlogPaletteVersion: 1`: it represents a profile after
IronLog's existing one-time palette setup, so a requested light preference is not reset to dark.
Every capture asserts `document.documentElement.dataset.theme` equals the requested setting.
Unexpected page reloads during capture fail the run instead of silently discarding fixture data.

Passed in **English and Hebrew/RTL, with actual dark and light theme settings**:

1. Existing set-number menu → existing set-note sheet; 500 characters accepted without changing
   load/reps/done state; saved through actual guest JSON storage and displayed inline.
2. Existing Settings row → CSV sheet; manual date fields fit the phone viewport in both directions.
3. Actual browser downloads of workout and body CSV, with IronLog filenames and canonical columns.
   Both exports leave the entire store snapshot unchanged.
4. Uploading the downloaded workout file through the existing import input: duplicate-day import
   is disabled; cancel leaves records untouched.
5. In a fresh synthetic history, actual confirmation imports the same file with exercise ID,
   colour and 500-character note retained. The active offline draft and weigh-ins remain intact.

Twelve populated Home/Stats/Workout comparisons against `16961600`:

- **10 pixel-identical** comparisons.
- Dark English and Hebrew Workout each differ at **4 rounded-border pixels, max channel difference 1**.
- All dimensions match. Differences are recorded without a tolerance that hides them.
- No page errors; all four browser stories pass.

Artifacts: [run status](./verification/pr69-csv-notes-2026-11-19/run.json),
[browser records](./verification/pr69-csv-notes-2026-11-19/results.json),
[pixel report](./verification/pr69-csv-notes-2026-11-19/pixel-report.json),
[light Hebrew date controls](./verification/pr69-csv-notes-2026-11-19/migration-light-he-csv-custom-dates.png),
[existing dark Hebrew note editor](./verification/pr69-csv-notes-2026-11-19/migration-dark-he-set-note-editor.png).
The artifact folder also contains all baseline/current screenshots and synthetic CSV downloads.

Reproduce with baseline Vite on loopback 5180, migration Vite on loopback 5179, stable frontend
sources and independent optimizer caches. Install Playwright/pngjs outside the repo or provide
`IRONLOG_PLAYWRIGHT_MODULE`, `IRONLOG_PNG_MODULE`, `IRONLOG_CHROMIUM_PATH`. Run
`node frontend/scripts/ironlog-csv-visual.cjs`; only after a zero exit run the comparator with
`IRONLOG_VISUAL_OUT` set to the OS temporary `ironlog-pr69-csv-visual` directory:
`node frontend/scripts/compare-ironlog-migration-visual.cjs`. A run manifest must say `passed`.

## Remaining boundaries

CSV is **not a full backup**: original columns omit workout IDs, media, routines and other profile
metadata, and only completed sets are exported. JSON/media backups remain necessary. Existing
records are not replaced to force a CSV round trip. The current tests cover common scalar/drop/
per-side/tag/tempo/unit/custom-ID cases, not every repeated-exercise/unknown-field/timezone scenario.

The sheet supports all/manual dates; upstream report-range presets and automatic normalization
await their original dependency integration. Body/measurement CSV export is enabled, but full
new measurement and multiple-weigh-in import/sync are not ported. Full bands/tempo workout controls,
Coach set-note payloads, native sharing on real devices, all screen/gesture/animation/splash states,
physical mobile/Watch builds, sanitized restore and independently verified backups remain open.

The branch and PR remain Draft. No production deployment or live data operation is authorized.
