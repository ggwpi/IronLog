# Focus set metadata continuation — 2026-11-19

**Draft / incomplete / no merge or production release.** Baseline:
`435ff5983b0529bc41c78fdaaab9a5ddb27e7c87`; pinned vendor unchanged.

IronLog's existing Focus set menu now opens the same 500-character note editor, original colour
tag picker and tempo editor as its other workout layouts. The tag and tempo helpers remain
unchanged original algorithms. Tempo is offered for working rep sets only. Existing note limits,
sheet host, JSON persistence, row fields, load/reps/completion and other set actions remain.
There is no new standalone Focus button, inline layout element, CSS, locale key or backend change.

Five new actual-store UI tests cover long-note save/guest JSON, tag set/clear on a completed row,
tempo preset/exercise fallback and warm-up/cardio exclusions. Existing unilateral drop/burst tests
select actions by label and assert the expanded menu exactly. Their load/reps/side assertions
remain unchanged. The two affected view suites pass **245 tests**.

Final complete frontend: **6,183 passed / 6 unchanged Windows path failures**, 6,189 tests / 526
files, no skips. API: **690 passed / 24 existing Windows failures / 46 skipped**, 760 total.
MCP: **96 passed / 1 existing permission failure**, plus two Windows `fs.watch` EPERM fixture
errors. Plain-Node graph, production build, media staging (6,554 stills + 6,554 animations),
fatigue probes (108,000 + 1,800), locale check (19 × 2,554 keys) and source inventory pass.
The report-only 52-string backlog remains. Latest-head Linux CI is recorded in PR #69.
No assertions, timeouts or tests are disabled or relaxed.

Browser uses synthetic guests with mocked APIs and blocked external traffic, 390 × 844,
English/Hebrew, actual light/dark and isolated baseline/current caches. Actual Focus set menu →
500-character note save → original tag/tempo pickers → guest JSON → note reopen → same metadata
in Cards is asserted, including unchanged other sets. Prior distance/cardio/Recovery/tempo/CSV
stories run again. Existing selected default screens, including rep Focus, are compared with the
baseline; all differences remain in the pixel report.
Of 28 comparisons, 26 are pixel-identical. Each light-theme cardio Focus-speed scene retains the
four rounded-edge pixel differences of at most one channel level seen in the preceding batch.
Dimensions and content match; no page errors or reloads occur. This does not certify all UI states.

Artifacts: [manifest](./verification/pr69-focus-metadata-2026-11-19/run.json),
[stories](./verification/pr69-focus-metadata-2026-11-19/results.json),
[pixel report](./verification/pr69-focus-metadata-2026-11-19/pixel-report.json).
Reproduce the common visual runner with `IRONLOG_VERIFY_FOCUS_METADATA=1` plus distance, Recovery,
cardio and tempo flags, baseline above, and
`IRONLOG_EXTRA_SCREENS=recovery-enabled,cardio-speed,cardio-focus-speed,focus-workout`.

This closes access to the tested set editors in the custom Focus layout. It does not certify
native/watch support, the tempo audio/haptic guide, every history/metadata/conflict/restore case,
all visuals/animations or full feature parity. No live user data or production was accessed.
