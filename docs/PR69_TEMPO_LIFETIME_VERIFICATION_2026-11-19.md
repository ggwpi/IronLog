# Tempo and complete lifetime source continuation — 2026-11-19

**Draft / incomplete / no merge or production release.**

Baseline: `8756402f8a9af2857c0b279ac17df909c1e818ed` on the dedicated migration branch.
Vendor remains unchanged at `e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`.
The original checkout stays on `testbench`; all work is in its separate migration worktree.

## Runtime integration

- The existing Stats History card now calls the complete original `lifetime.js`, replacing the
  previous extracted implementation. The card and its rendering are unchanged.
- Six original files (`lifetime.js`, its tests, `cardio-goals.js`, `challenges.js`, `distance.js`,
  `units.js`) retain their exact pinned Git blobs. Windows CRLF vendor working files are not used
  as the byte source: raw `git show` supplies the originals. Boundary shims keep IronLog's existing
  catalogue, dates, speed settings, bars, modules and history helpers.
- The history boundary retains IronLog's existing volume interpretation. New challenge, bodyweight
  volume, goals, distance controls and unit-conversion workflows are not activated by importing
  dependencies. The existing runtime still uses its original unit conversion and sync algorithms.
- Original `tempo.js` supplies normalization, phases, parsing and target/set precedence unchanged.
  IronLog's actual `Stepper`, `Button`, `Switch`, `Row` and sheet host provide the editor: presets,
  all four phases, explosive lift, save, cancel and returning to exercise tempo.
- Existing rep-exercise configuration can save planned tempo. Working rep sets expose a menu item
  and, when a tempo exists, a 44px inline action with isolated LTR notation inside Hebrew/RTL.
  Plain rows have no added inline element. Warm-up/cardio rows do not gain a rep-tempo action.
- Only the selected session row's optional metadata changes. Existing load/reps/completion, sides,
  notes, tags, media, stored history and routines stay intact. Stale session/entry/row-count guards
  reject saves after those coordinates change while the sheet is open.
- Old unstamped writers use the existing API's unknown-field preservation for set/routine tempos.
  Modern stamped removal remains intentional clearing. No sync algorithm or API runtime was changed.

## Verification

Local frontend: **6,071 passed / 6 failed**, **6,077 tests / 511 files**, no skips. The six failures
are the unchanged Windows path expectations in mobile-bundle (4) and asset-pack (2) scripts.
API: **687 passed / 24 failed / 46 skipped**, 757 total; API runtime remains unchanged and the
existing Windows privilege/chmod/spec/source/timing failures remain visible. Production Vite
build and media staging passed (**6,554 stills + 6,554 animations**); plain Node loads both the
complete lifetime module and the MCP graph. Latest-head Linux CI is recorded in PR #69.
MCP: **96 passed / 1 failed**, 97 tests; its unchanged Unix-permission fixture fails on Windows,
and two `fs.watch` EPERM errors also occur in its unchanged state fixture. They are not suppressed.
Fatigue probes pass **108,000** monotonic and **1,800** deletion comparisons.

Early overlapping full-suite runs hit cold module-load timeouts; the final frontend run used
two workers with other heavy suites and dev servers stopped, without extending timeouts, weakening
assertions or skipping any tests. The Git `sh` path was supplied to the local test process.

Focused source/editor/configuration/locale/data tests passed **27/27** in seven files, including:

- Six raw source hashes and the four original lifetime tests.
- Existing IronLog lifetime regression tests; no history recalculation writes.
- Actual tempo editor saves/cancel/clear, explosive normalization and invalid all-zero rejection.
- Per-side values retained; a stale session or row count cannot receive an old picker value.
- Finish → JSON → existing API old-client enrichment → two-device merge → actual own CSV reader,
  retaining tempo, 500-character notes, tag, media and the other device's reps correction.
- Modern intentional removal is not resurrected.
- Existing exercise configuration saves planned tempo with the original loads/reps.
- All 19 packs contain the new wording; original upstream wording is used outside Hebrew, with
  explicit Brazilian overrides preserving its guarded inherited-locale snapshot.

Locales: **19 packs / 2,525 keys each**, in sync. Source-string audit retains its existing report-only
**52 missing-key backlog**; the eight new original likeness strings are translated too, even though
that UI is not mounted yet.

## Browser and visual evidence

Local Chromium, synthetic guests, all API responses mocked and external traffic blocked.
Phone viewport 390 × 844, reduced motion, Asia/Jerusalem, English/Hebrew and actual light/dark.
Baseline application source is archived from `8756402f`, using locked dependencies and separate
Vite caches. Palette-version fixtures and DOM theme assertions prevent false light-theme coverage.

- Actual set-number menu → tempo editor → original `5-0-X-0` preset → actual guest JSON save →
  inline reopening → clear. Original state is unchanged after clearing except for the expected
  existing monotonic sync clock. Inputs fit the phone viewport in both directions.
- Previous note/CSV browser stories pass again in all four combinations: 500-character editor,
  read-only downloads, duplicate-day protection and fresh confirmed import with active draft intact.
- Twelve populated Home/Stats/Workout baseline comparisons: **11 pixel-identical**, dark English
  Workout differs at **4 rounded-border pixels by one shade**. Dimensions match; no page errors.
  This selected matrix does not certify every sheet, animation, gesture, native platform or state.

Artifacts: [run manifest](./verification/pr69-tempo-lifetime-2026-11-19/run.json),
[stories](./verification/pr69-tempo-lifetime-2026-11-19/results.json),
[pixel comparison](./verification/pr69-tempo-lifetime-2026-11-19/pixel-report.json),
[Hebrew light tempo editor](./verification/pr69-tempo-lifetime-2026-11-19/migration-light-he-tempo-editor.png).

Reproduce with `ironlog-csv-visual.cjs` and `IRONLOG_VERIFY_TEMPO=1`,
`IRONLOG_BASELINE_SHA=8756402f8a9af2857c0b279ac17df909c1e818ed`, an independent temporary
`IRONLOG_VISUAL_OUT`, and stable loopback servers on 5180 (baseline) and 5179 (migration).
Provide the existing Playwright/Chromium/pngjs module paths as documented in the CSV report.
Run the pixel comparator only after the manifest says `passed`.

## Open gates

Tempo audio/haptic guide, complete history/native/platform coverage, cardio goals/activity UI,
distance mode, likeness UI, the remaining release ledger and full backup/restore/rollback verification
are still open. Importing a complete dependency is not feature certification. No production or
live user data was read or written; PR #69 must stay Draft.
