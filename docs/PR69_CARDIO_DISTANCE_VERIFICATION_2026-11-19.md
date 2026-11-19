# Cardio distance continuation — 2026-11-19

**Draft / incomplete / no merge or production release.** Baseline:
`30c50647579373c60b0538c6cdf9a43d4f0d4e7e`. Vendor remains pinned and clean at
`e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`.

## Integration and compatibility

- The complete original `distance.js` and original tests remain byte-exact, protected by raw
  Git-blob assertions. IronLog's actual Cards/List/Compact/Focus controls call the original
  preference, distance conversion, derived-distance and speed-settlement helpers.
- Existing speed display stays the default. The existing exercise menu changes only `cardioBy`;
  it does not rewrite sets. Explicit distance and duration edits use original calculations.
  Miles remain independent of weight units. Existing completed/locked Focus controls stay locked.
- Saved distance rows use original distance/pace formatting through IronLog's history label
  boundary. Old speed-only labels, other workout modes, layout, charts, sheets and fonts remain.
  This does not replace the complete history model or implement resistance-level entry.
- Existing finish, JSON, cloud merge and import confirmation paths remain. Fixtures cover
  500-character notes, tags, media references, offline drafts, duplicate-day protection,
  concurrent language changes and an old API client. Server logic is unchanged: `km` is an
  existing known field, so an old client's deliberate omission still clears it.
- The original CSV schema represents distance but omits logging intent. The post-parse boundary
  restores explicit `km` only when the receiving profile already selects distance for that
  exercise. It never guesses intent. Notes opt-out still works independently. The original
  parser/exporter algorithms and schema are unchanged.
- Legacy unnamed workouts receive the original parser's `Imported` name. Metadata follows
  only unambiguous identities, including original formula protection and custom-ID matching.
  Ambiguous identities retain original parser output rather than assigning another session's
  metadata. CSV remains an incomplete interchange format: it cannot replace JSON/media backups
  or guarantee full notes/distance metadata for every identity collision.
- Four new keys use pinned upstream translations plus Hebrew in all 19 existing packs
  (2,554 keys each). Existing regional inheritance safeguards remain; report-only backlog: 52.

## Verification

- 262 focused tests passed before the final locale test; all added tests also ran in the full suite.
- Full local frontend: **6,178 passed / 6 unchanged Windows path failures**, 6,184 tests in
  526 files, no skips. API: **690 passed / 24 existing Windows failures / 46 skipped**, 760 total.
  MCP: **96 passed / 1 existing Windows permission failure**, plus two `fs.watch` EPERM errors.
  No assertions, timeouts or tests were relaxed. Latest-head Linux results are recorded in PR #69.
- Plain-Node MCP graph, production Vite build, media staging (6,554 stills + 6,554 animations),
  fatigue probes (108,000 + 1,800), locale checks and source inventory pass.
- Local Chromium uses synthetic guests, mocked APIs and blocked external traffic, 390 × 844,
  English/Hebrew, true light/dark, Asia/Jerusalem and isolated baseline/current Vite caches.
  Actual Focus menu and distance/duration inputs preserve row metadata; 4 mi becomes
  6.4374 km and 12.46 km/h at 31 min. Existing cardio-goal, Recovery dismiss/Undo,
  tempo and 500-character note/CSV stories are rerun.

Artifacts: [manifest](./verification/pr69-cardio-distance-2026-11-19/run.json),
[stories](./verification/pr69-cardio-distance-2026-11-19/results.json),
[pixel report](./verification/pr69-cardio-distance-2026-11-19/pixel-report.json),
[Hebrew light Focus](./verification/pr69-cardio-distance-2026-11-19/migration-light-he-cardio-focus-distance-miles.png).

Reproduce `ironlog-csv-visual.cjs` with `IRONLOG_VERIFY_DISTANCE=1`, `IRONLOG_VERIFY_RECOVERY=1`,
`IRONLOG_VERIFY_CARDIO=1`, `IRONLOG_VERIFY_TEMPO=1`, the baseline above and independent temporary
output. Compare with `IRONLOG_EXTRA_SCREENS=recovery-enabled,cardio-speed,cardio-focus-speed`.
Pointer position is reset before both builds' screenshots to avoid differing desktop hover states.
Only a fresh passed manifest permits copying evidence. The pixel report retains all differences.
Of 24 comparisons, 22 are pixel-identical. Each light-theme Focus-speed scene differs at four
rounded-edge pixels by at most one channel level; dimensions and content match. The report does
not label these two scenes pixel-identical or certify the full animation/gesture matrix.

## Open gates

Full catalogue/activity/fatigue/native parity, resistance levels, Focus set-note/tag/tempo controls,
tempo guide, full CSV/restore/media/conflict matrices and the remaining feature ledger stay open.
Android SDK/device and Xcode/device verification are unavailable in this Windows environment.
No live account, database, production environment or user data was accessed or changed.
