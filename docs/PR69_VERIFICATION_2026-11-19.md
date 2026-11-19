# PR #69 continuation verification — 2026-11-19

**Draft / not feature complete / not approved for merge or production.**

Worktree: `C:/Projects/IronLog-migration`, branch
`feature/opengym-full-ironlog-ui-safe-migration`, starting from `cdf7f16`.
Original `C:/Projects/IronLog` checkout retained on `testbench`; no initial uncommitted changes.
Submodule initialized at `e4a68a94c42a3c17cbd560d66ce2e46a7048ab99` and left unmodified.

## Browser story and visual comparison

Local Chromium, 390 × 844 viewport, dark theme, reduced motion, Asia/Jerusalem timezone.
Baseline is the exact frontend/API source archived from `cdf7f16`; both servers use the same
installed frontend dependencies. Isolated browser contexts contain only synthetic guest fixtures.
All non-loopback requests are blocked, all `/api` requests are mocked, and no database or real
account is used. These are **web phone-viewport** checks, not physical-device or native builds.

| Scene against `cdf7f16` | English | Hebrew / RTL |
| --- | --- | --- |
| Populated Home, full page | 0 changed pixels | 0 changed pixels |
| Populated Stats, full page | 0 changed pixels | 0 changed pixels |
| Active Workout, plain sets | 4 changed pixels, each 1 channel shade at a rounded border | 0 changed pixels |

The four English border pixels are recorded, not suppressed. Both screenshots have the same
dimensions. No changed content or layout was found in these six comparisons; this does not
establish a 100% visual match across every screen/state. No page errors were recorded.

Actual browser interaction passed in **both** languages:

1. Existing set-number menu → Colour tag → Blue in the existing IronLog bottom sheet.
2. Original set values and second set unchanged; original saved history unchanged.
3. Tag persisted through IronLog's actual guest JSON storage path.
4. Existing completion builder retains the tag; existing history/detail sheet shows its shape/name.

The fixture completion uses the same volume helper as the normal save flow. It does not invoke a
production account or cloud endpoint. Broader persistence/sync is tested separately with fixtures.

Artifacts: [pixel report](./verification/pr69-2026-11-19/pixel-report.json),
[browser result records](./verification/pr69-2026-11-19/results.json),
[Hebrew tag picker](./verification/pr69-2026-11-19/migration-he-tag-picker.png),
[Hebrew tagged history](./verification/pr69-2026-11-19/migration-he-tagged-history.png).
The same folder contains all six baseline/current screen pairs and the tag-flow screenshots.

Reproduction:

- Initialize the submodule; install dependencies from `frontend/package-lock.json`.
- Archive baseline `cdf7f16`'s `frontend` and `api` into a temporary directory; provide the same
  frontend node_modules via a junction/symlink or a separate locked install. Do not switch a dirty
  checkout or overwrite anybody's local work.
- Run baseline Vite on loopback port 5180 and this branch's Vite on loopback port 5179.
- Install Playwright and pngjs in a separate QA tools directory; set `IRONLOG_PLAYWRIGHT_MODULE`
  and `IRONLOG_PNG_MODULE` to their module paths if they are outside normal Node resolution.
  Set `IRONLOG_CHROMIUM_PATH` when using an installed Chromium/Chrome instead of Playwright's browser.
- Run `node frontend/scripts/ironlog-migration-visual.cjs`, then
  `node frontend/scripts/compare-ironlog-migration-visual.cjs`.
- Outputs default to the OS temporary `ironlog-pr69-visual` folder; `IRONLOG_VISUAL_OUT` overrides it.
  Inspect the pixel report and screenshots. Differences are reported without a tolerance that
  silently accepts them.

## Automated checks

Windows host, Node 24.22.3; locked installs with lifecycle scripts disabled, API optional AI runtime
omitted. npm was absent from PATH and was provisioned in a temporary tools folder, without edits
to package manifests/lockfiles. Git Bash supplies `sh` for the shell contract tests.

- Tag/menu/history targeted suite: **269 passed** before the later Modules boundaries.
- Final Modules/source/data/localization boundary suite: **86 passed** in 10 files.
- New API tag preservation plus existing sync-stamp suite: **23 passed**, no skips.
- Frontend Vite production build: **passed**; existing chunk-size/dynamic-import warnings remain.
- Root media build stage: **6,554 stills and 6,554 animations** copied to the ignored local build.
- Locale check: **19 packs, 2,499 keys each, in sync**.
- Source-string check: report-only; existing untranslated-source backlog remains. The new tag
  labels have dedicated 19-language regression coverage. Do not claim every older new feature
  is fully localized.
- Fatigue probes: **108,000 comparisons**, largest increase 0; **1,800** randomized deletion
  comparisons non-increasing, passed.
- MCP plain-Node import graph: **passed**. MCP full suite: **94 passed, 1 failed**, a pre-existing
  Unix permission test that cannot enforce chmod denial on this Windows host.
- API full suite: **684 passed, 25 failed, 46 skipped** (755 total). No API runtime code changed
  in this continuation. Failures include privilege dropping, chmod/file-access assumptions,
  a spec/source check and timing-sensitive push behavior; they are not waived. Missing isolated
  database fixtures account for skipped cloud tests. Linux CI and isolated Postgres must pass.
- Final frontend full suite: **5,952 passed, 6 failed** in 497 files. All six remaining failures
  are in unchanged Windows path expectations in `check-mobile-bundle.test.mjs` (4) and
  `android-asset-packs.test.js` (2). All newly added runtime/UI/source/data tests pass.
  GitHub Linux CI results are recorded in the PR after the branch push.

Full local Windows failures are retained as failures. No tests have been skipped, relaxed or
deleted to make the suite green. `.gitattributes` makes source, generated text and CSP checks
consistent across Windows/Linux; the upstream raw-blob provenance checks remain strict.

## Required remaining evidence

- Linux frontend/API/MCP/container tests and isolated database-backed auth/sync/isolation checks.
- Physical mobile, light theme, accessibility/keyboard, gestures, all sheets, splash/loading and
  animation checks. These screenshots cover only the selected populated dark phone scenes.
- Android/iOS/watch builds and device testing; Xcode cannot run on this Windows host.
- Full source/dependency/service parity in [the feature audit](./OPENGYM_FEATURE_AUDIT.md).
- Compatible upstream CSV exports/imports and full old/new/offline conflict/restore matrix.
- Independently restorable local, database and media backups and rollback drill. These are not
  provided by synthetic JSON round trips. **No live user data access is authorized or performed.**

No merge, production deployment, production configuration/schema change or live-account read/write.
