# Original Daily Form and lighter sessions — 2026-11-19

Draft continuation from `dea7525ce71c3e4c4e15badecf1010731d0fc85d`. No merge, production,
live account or database access. Pinned vendor remains unchanged.

## Original code and IronLog boundaries

The extracted Daily Form implementation is replaced by the complete original model and original
test file. Its full session-adaptation dependency closure is isolated under
`lib/opengym-v145/session-engine/`; 48 raw Git-blob assertions protect original algorithms/data.
Relative source paths are retained, including the pure backend streak helper. No upstream
components, stores, network clients, providers or sheets are loaded by this closure.

Explicit boundaries retain IronLog's actual catalogue/aliases, translations, per-day cloud merge
and registered deload source. The original catalogue algorithm has its own lookup and receives
this profile's custom exercises and weight-step settings. It never replaces the actual UI index.
Its private custom-name registration uses the complete original translation-core dependency.
Imported dependency code is not proof that other programmes, warm-ups, units or Coach features
are integrated into the real UI.

IronLog's actual four-question sheet, rating buttons, score, Start/Skip actions, bottom-sheet
host, weigh-in and navigation remain. On a rough day, the existing Segmented control offers only
available lighter choices. As planned remains selected by default. Changing the answers to a
good day suppresses a previously selected lighter choice; Skip writes no answer or adaptation.

Actual combined-entry preview is read-only. The selected option passes through the existing
weigh-in and into the new session. Original `goLighter` applies 10% lower load rounded down to
loadable weights, or removes one open work set where possible. Its original progression pause
is retained on entries and survives IronLog's finish builder. The planned routines, old workouts,
history/media, bodyweight and other profile fields are not rewritten. Adaptation and new-session
creation persist atomically through IronLog's existing store update.

IronLog marks explicit manual warm-up weights with `weightOrigin`; the original live-ramp engine
recognizes `edited`. The boundary temporarily projects that guard, calls the unchanged algorithm,
and restores the exact prior presence/value of `edited` in a `finally` block. Manual warm-up loads,
notes and media remain exact; ordinary original generated/open-ramp behavior remains unchanged.

## Verification

- 98 focused original/source/locales/actual start/weigh-in/combined-session tests passed before
  the final manual-warm-up cases; the final four-file source/model/UI group passes 85 tests.
- Actual-store UI tests cover unchanged preview, default plan, explicit load/sets, changed answers,
  Skip, the real required-weigh-in callback, Health-off gate, complete-profile preservation,
  saved progression exclusion and two-device stamped merge. Manual warm-up cases cover absent
  and explicitly false `edited`; completed and open-row notes/media/tags remain.
- Two pure API tests verify an old unstamped writer retains the daily lighter answer and saved
  results, while a modern explicit per-day clear remains cleared. API/auth/schema/cloud runtime
  algorithms are unchanged. Existing active-session synchronization semantics are retained.
- All 19 locale packs have 2,567 keys; 13 additional control/dependency strings use pinned
  upstream wording plus Hebrew. Regional inheritance checks remain; report-only backlog stays 52.
- Final frontend: **6,259 passed / 6 unchanged Windows path failures**, 6,265 tests / 530 files,
  no skips. API: **692 passed / 24 existing Windows failures / 46 skipped**, 762 total. MCP:
  **96 passed / 1 existing permission failure**, plus two Windows `fs.watch` EPERM fixture errors.
  Plain-Node graph, production build, media staging (6,554 stills + 6,554 animations), fatigue
  probes (108,000 + 1,800), locale/source checks pass. Latest-head Linux results are in PR #69.
  No tests, timeouts or assertions are disabled or relaxed.

The common browser runner additionally verifies actual Home Start → unchanged check-in → explicit
lighter choice → new session/guest JSON in English/Hebrew and true light/dark. Existing saved
history/media, routines and bodyweight are compared exactly; 80 kg becomes 70 kg on the original
2.5 kg grid. Previous Focus/distance/cardio/Recovery/tempo/CSV stories run again. APIs are mocked,
external traffic blocked, and baseline/current sources and caches are isolated at 390 × 844.

Reproduce with `IRONLOG_VERIFY_DAILY_FORM=1` plus preceding flags, baseline above and
`IRONLOG_EXTRA_SCREENS=recovery-enabled,cardio-speed,cardio-focus-speed,focus-workout,daily-form`.
Only fresh passed artifacts may be copied; the pixel report retains every difference.
All four unchanged check-in scenes are pixel-identical. Overall, **31 of 32 comparisons are
pixel-identical**; the dark Hebrew Stats scene differs at 27 pixels by at most one channel level,
with matching dimensions/content. Actual interaction stories pass without page errors or reloads.

Artifacts: [manifest](./verification/pr69-daily-form-2026-11-19/run.json),
[stories](./verification/pr69-daily-form-2026-11-19/results.json),
[pixel report](./verification/pr69-daily-form-2026-11-19/pixel-report.json).

## Remaining scope

Native sleep/vitals collection and prefill, complete Daily Form insight options, all other session/
Coach/programme/warm-up/unit workflows and the full UI/native/backup-restore matrices remain
separate gates. This report certifies the tested web start/adaptation behavior, not full parity.
