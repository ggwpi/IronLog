# Complete original Recovery Hint continuation — 2026-11-19

**Draft / incomplete / no merge or production release.**

Baseline: `d918f8de0ff9e67483cad1401edb32b857d62089`; unchanged pinned vendor:
`e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`.

## Original source and preserved IronLog behavior

- The earlier adapted `recovery-hint.js` is replaced with a short public boundary around the
  complete original namespace module. The original hint module/tests and original fatigue
  dependency retain raw Git blobs, checked by three new assertions.
- The boundary retains IronLog's explicit opt-in without changing upstream's default. It copies
  the supplied fatigue map and projects only absent lats/deltoid-head names from the existing
  upper-back/deltoid aggregates. Explicit split values, including zero, remain authoritative.
  Neither the input map nor workouts/settings/profile fields are changed.
- Hint rules, last-worked reads, wording and preference helper delegate to original code. Existing
  stored sport maps now prevent false legs-neglected advice. No activity is inferred or written.
- The actual existing Home card, buttons, sheet action, dismiss/Undo behavior, health-module gate,
  default visibility, fonts, cards, CSS, navigation, splash/loading and animations remain.
  Its only component change is adding `S.activities` to the memo dependencies, fixing stale advice
  when a sync changes activities without changing the workout array.
- IronLog's actual existing Stats/body-map fatigue engine remains untouched. The complete original
  fatigue module supplies the original tests' context; it is not substituted for that custom model.
  History/catalogue/formula/effort/locale adapters remain explicit, including Hebrew.

## Evidence

- **58 focused tests passed** in seven files: original hint tests, raw source hashes, existing
  IronLog golden/opt-in/settings/data/locales tests, explicit split-value precedence, frozen legacy
  fatigue input and complete-profile preservation, stored sport and the actual card's activities-only
  refresh. The original upstream default remains intact inside the namespace.
- Full local frontend: **6,158 passed / 6 unchanged Windows path failures**, **6,164 tests / 522
  files**, no skips. API: **689 passed / 24 existing Windows failures / 46 skipped**, 759 total.
  MCP: **96 passed / 1 unchanged permission failure**, 97 total, plus two Windows `fs.watch` EPERM
  fixture errors, not suppressed. Plain-Node MCP graph, production Vite build, media staging
  (6,554 stills + 6,554 animations) and fatigue probes (108,000 + 1,800) pass. Latest-head Linux CI
  is recorded in PR #69. No assertions, timeouts or tests were relaxed.
- The existing 19 locale packs remain synchronized at **2,550 keys each**. Source-string audit
  retains the existing report-only 52-key backlog; hint wording uses its already localized keys.

Local Chromium uses synthetic guests, all API mocked/external traffic blocked, 390 × 844, reduced
motion and Asia/Jerusalem. Baseline application source is archived from `d918f8de` with the same
locked dependencies and separate Vite caches; DOM assertions prove actual requested light/dark.

In English/Hebrew and both themes:

1. The unchanged actual Home card displays the same enabled leg-neglect hint as the baseline.
2. Actual Hide for today persists its date to guest JSON; actual Undo brings the card back.
3. A stored football activity is added as an isolated incoming-state fixture, retaining the same
   workout array. The card recomputes and the false legs-neglected advice disappears.
4. The full profile after calculation is exactly the injected snapshot; rendering writes nothing.
5. Existing cardio goal/editor/JSON, tempo editor/clear and 500-character notes/CSV stories pass again.

**All 16 selected baseline comparisons are pixel-identical**, including all four enabled-card
scenes and the usual Home/Stats/Workout scenes. Dimensions match; no page errors. This does not
certify the entire UI/gesture/animation/native matrix.

Artifacts: [manifest](./verification/pr69-recovery-original-2026-11-19/run.json),
[stories](./verification/pr69-recovery-original-2026-11-19/results.json),
[pixel report](./verification/pr69-recovery-original-2026-11-19/pixel-report.json),
[enabled light Hebrew card](./verification/pr69-recovery-original-2026-11-19/migration-light-he-recovery-enabled.png),
[after stored sport](./verification/pr69-recovery-original-2026-11-19/migration-light-he-recovery-activity.png).

Reproduce the existing visual script with `IRONLOG_VERIFY_RECOVERY=1`, `IRONLOG_VERIFY_CARDIO=1`,
`IRONLOG_VERIFY_TEMPO=1`, `IRONLOG_BASELINE_SHA=d918f8de0ff9e67483cad1401edb32b857d62089`,
`IRONLOG_EXTRA_SCREENS=recovery-enabled`, independent temporary output and stable loopback
baseline/current servers on 5180/5179. Only compare/copy artifacts after a `passed` manifest.

## Remaining boundaries

Full new catalogue/history/fatigue semantics, activity capture/import/sync, sport-based native
fatigue/vitals, device builds, all visual states, independently restored backups/media and the
remaining release ledger stay open. Source presence alone is not feature certification.
No production, main, deployment or live-user operation occurred. Keep PR #69 Draft.
