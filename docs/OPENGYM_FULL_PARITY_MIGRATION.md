# IronLog × openGym: full feature parity, IronLog visual design

Status: **IN PROGRESS — NOT SAFE TO MERGE OR DEPLOY**

Current user-directed milestone: finish the existing IronLog Web/PWA functionality first.
Use the existing production architecture and 20 route declarations as the baseline; new Web
product areas and native platforms are deferred. See the milestone in the feature audit.
The complete release ledger below is not a percentage-complete measure for this milestone.

The [original Daily Form continuation](./PR69_DAILY_FORM_VERIFICATION_2026-11-19.md) replaces the
extracted model and connects explicit lighter-session choices through IronLog's existing check-in,
weigh-in, session creation, finish and stamped daily map. Manual IronLog warm-up weights and old
history/media/routines remain protected. Native vitals and the broader insight matrix stay open.

Current traceable inventory: [OPENGYM_FEATURE_AUDIT.md](./OPENGYM_FEATURE_AUDIT.md).
It records every pinned source/configuration path, known original-code/adapted-code boundaries,
and 504 v1.4.3–v1.4.5 release criteria (500 still open). Local browser/test evidence is recorded in
[PR69_VERIFICATION_2026-11-19.md](./PR69_VERIFICATION_2026-11-19.md).
Neither document closes the full functional/native/data-restore gates.

The subsequent [tempo/lifetime continuation](./PR69_TEMPO_LIFETIME_VERIFICATION_2026-11-19.md)
replaces extracted lifetime code with its complete original module and connects original tempo
rules to IronLog's exercise settings and set controls. Audio/haptic guides and broader platform
parity remain open; the existing sync/auth/storage algorithms are unchanged.

The [weekly cardio goals continuation](./PR69_CARDIO_GOALS_VERIFICATION_2026-11-19.md) mounts the
complete original new feature leaf with IronLog's actual controls, store and scoped style tokens.
Original editor/engine logic is unchanged. Full activity import/sync, catalogue and native
verification remain separate open gates.

The [cardio distance continuation](./PR69_CARDIO_DISTANCE_VERIFICATION_2026-11-19.md) connects
unchanged original distance helpers to actual IronLog Cards/List/Compact/Focus controls and history
formatting. Explicit receiver preferences and conservative identity checks protect CSV metadata;
the schema cannot recover source logging intent. Full native/data-restore gates remain open.

The [complete-snapshot preservation gate](./PR69_COMPLETE_PROFILE_AUDIT_2026-11-19.md) adds a
read-only comparison over every existing JSON root field, including unknown/custom settings,
plus a local-file CLI. It complements the selected-field UI compatibility helper; it does not
create backups, restore media, migrate profiles or certify production data.

The [Focus metadata continuation](./PR69_FOCUS_METADATA_VERIFICATION_2026-11-19.md) exposes the
same existing note, original tag and tempo editors in IronLog's custom Focus set menu. Default
layout and backend remain; complete native/tempo-guide/restore gates are still open.

The CSV/note continuation now imports original CSV modules unchanged, exposes read-only exports
through existing IronLog controls, routes common own-workout CSV files into the existing import
confirmation/merge, and retains IronLog's 500-character notes in the editor/history/MCP/CSV boundary.
See [its verification report](./PR69_CSV_NOTES_VERIFICATION_2026-11-19.md) for real light/dark/RTL
browser evidence and explicit remaining CSV/body/native limitations. This is not full parity or
a replacement for complete JSON/media backups.

**Immutable upstream source contract:** [OPENGYM_SOURCE_CONTRACT.md](./OPENGYM_SOURCE_CONTRACT.md). openGym v1.4.5 is pinned as a complete Git submodule; every upstream algorithm must stay unmodified, with IronLog-only component/state boundaries. A source snapshot is not proof of runtime integration.
  
IronLog baseline: `79fc61eed2000049424591b2bde4ec7f20fa6615`  
Upstream baseline to integrate: `DuarteSantos8/openGym@e4a68a94c42a3c17cbd560d66ce2e46a7048ab99` (v1.4.5).

## Current verified implementation scope (branch only)

- A destructive legacy reset at startup has been replaced with a no-delete guard and regression tests.
- A **read-only** migration audit can reject dropped or changed original workout records, sets, loads, routines, measurements, media references, owner-related data fields and active session records on JSON fixture comparisons. This is NOT a backup or a live migration.
- openGym v1.4.5's `lifetimeTotals` calculation and `strength-level` engine were ported with automated tests. IronLog Stats now renders the new calculations in existing IronLog `.card`, `.row`, `Button`, `Segmented`, and `Stepper` components; its strength preferences open through IronLog's existing bottom-sheet system.
- **Not yet feature-parity complete:** the remaining openGym cards, settings, native apps, server integrations and architecture changes have not been ported. Tests/Preview must pass before these changes are considered verified.

## Recovery Hint parity boundary (read-only, opt-in)

- The complete original 1.4.5 Home Recovery Hint module and its original tests are now imported unchanged. A separate read-only boundary projects missing lats/deltoid-head names from IronLog's existing aggregate fatigue values. Explicit split values win. The existing Stats/body-map fatigue algorithm is retained; no saved exercise, workout or body-map field is rewritten.
- The familiar IronLog Home card appears **only** when the person explicitly enables `Recovery tips` in Look & Home, has sufficiently recent workout history, and has a relevant recovery insight. Prior profiles never see a new Home card by default.
- Dismissal stores a single day and supports Undo. Toggling Recovery tips on clears a previous dismissal. Both preferences are included in the non-destructive audit.
- Existing stored sport maps now count toward the original hint's last-worked dates, preventing false neglect advice after football or a run. An activities-only state change refreshes the actual card. Full activity capture/import/sync and sport-based fatigue/native parity remain open; nothing is inferred or written into a profile automatically.
- Recovery Hint message/interaction strings are localized for all 19 IronLog locale packs. Non-Hebrew text comes from the pinned openGym v1.4.5 packs, while the fork supplies Hebrew; Brazilian Portuguese keeps its upstream regional overrides and inherits shared strings from pt. Locale-presence/placeholder regression tests were added. This is **not** proof of screenshot or native feature parity.
- Sixteen selected Home/Stats/Workout/enabled-hint phone scenes compare pixel-identically against `d918f8de` in English/Hebrew and true light/dark. Actual dismiss/Undo/guest JSON and activities-only refresh pass. See [the original Recovery Hint report](./PR69_RECOVERY_ORIGINAL_VERIFICATION_2026-11-19.md). Full visuals/native/restored-data certification remains open; this is not production approval.

## Today's mini body map (openGym v1.4.5, opt-in)

- The upstream planned-workout thumbnail projects all exercises of today's routines into an effective-sets map. It is **read-only** and uses IronLog's own original `BodyMap`, muscle metadata, accent palette, and Today-row markup; no upstream UI components/styles were copied.
- `Settings → Look & Home → Muscle map` controls `showWorkoutMusclePreview`. It is **off by default** for existing and new profiles: the exact existing Start badge, splash, loading, greeting, Home cards, chart, tab bar, and bottom sheets remain unchanged until enabled.
- When enabled, only today's pending planned workout row gains a decorative, `aria-hidden` body thumbnail. Completed, running, freestyle, or empty plans do not gain a thumbnail. Empty or no-load routines return no thumbnail. The existing Start action is unchanged; no extra click target or focus target.
- A small scoped CSS file sizes the map; shared design tokens and original IronLog global CSS are not edited. This is a web preview slice only, not full upstream multi-session/split-day parity; no migration, historical exercise edits, or remote profile data updates are involved.
- Unit/Home UI and multi-device settings-sync fixture tests are included. Full mobile/RTL/screenshot review still required.

## Workouts left this week (#753, openGym 1.4.5)

- Ported openGym v1.4.5 `week-left.js` and its original unit tests. The countdown uses the existing IronLog `weekTally`, today's still-open planned routines, and an optional 1–7 rotation target, so it does not count future or unrelated workouts as completions.
- `Settings → Plan & schedule → Workouts per week` sets a rotation target (0/off or 1–7), without altering workout history, routines, rotation queue, or dates. The target is irrelevant to Fixed Week.
- `Settings → Look & Home → Workouts left this week` opt-in (`showWorkoutsLeftHome`) displays a single text line after the existing IronLog week strip/queue. Off by default to retain the original Home hero, streak, cards, charts, tab bar, splash, gestures and sheets.
- Added user-data preservation audit coverage for the opt-in flag and rotation target, plus cross-device setting sync regression.
- The full countdown UI copy is localized in all **19 IronLog language packs**, with a key/placeholder regression test. Existing upstream v1.4.5 wording is used where available; the fork supplies Hebrew. pt-BR keeps explicit overrides for all new keys, preserving its inherited-translation fingerprint. No writes to production state or database, no new APIs and no destructive migration.
- **Parity boundary:** Home/PWA slice only; openGym native widget snapshots and full native platforms remain future work. Visual screenshot checks and restored-user-data tests remain required.

## Immutable visual baseline

All existing components/screens remain the visual source of truth, including the splash/logo, boot/loading animation, workout-load transitions, Home greeting, Home card arrangement, existing card/expanded card appearance, charts, bottom sheets and swipe gestures, navigation bar, iconography, RTL layout and light/dark palettes. A feature may add a surface where needed, but must not replace or restyle existing IronLog surfaces. Compare screenshots in each state before any production merge.

## Non-negotiable product contract

1. Preserve the physical IronLog visual design: navigation bar, typography, spacing, card surfaces, sheets, animations, graphs, palettes, accessibility and layouts. Add all upstream cards and screens using this exact design system. Do not overlay a second UI or embed upstream screens.
2. Preserve complete upstream feature behavior, with all settings, interactions, explanatory states, calculations and native hooks. No placeholder buttons.
3. Preserve all existing user data: workouts, sets, weights, history, personal records, routines, body measurements, photos/videos, favorites, pending offline changes, sync metadata, accounts, settings and custom exercises. No reset/reseed. IDs, dates and units must remain semantically identical.
4. Preserve IronLog cloud/backend integrations and branded identity. Do not replace authentication or data services without verified compatibility.
5. No changes to `main`, production database or Vercel production environment until there is passing CI, migration verification, UI visual approval and a rollback/backup drill.

## Data migration contract

- **Backup before any migration:** independent, restorable snapshots of the active server database and storage; locally export each user profile and pending offline queue. Validate checksum and a full restore to an isolated environment. This repository does not provide access to production databases; do not assume backup exists.
- Make migrations **additive** and **idempotent**. Preserve unknown fields to enable forward/backward compatibility. Do not use destructive deletes or renames before a separate approved retention period.
- Migration must be side-effect-free on legacy data until imported output is validated; use separate namespace / staging copy and atomic commit with recovery on failure.
- Validate parity for at least: number and IDs of workouts/routines/custom exercises; each set's load, reps, time, effort and date; body weight and measurements; PRs; media references and actual files; local pending edits; account ownership and permissions; correct display units and locale.
- Exercise catalogue IDs might have changed upstream. Map stable IDs without rewriting historical workout entries; unknown exercises must remain representable.
- Test: old client -> new client -> old client reading unchanged data; multiple devices editing while offline; interrupted migration; duplicate run; storage full; invalid data; revoked access; guest-to-account adoption; timezone boundaries; media still available.
- **Critical finding:** `frontend/src/lib/cloud-reset.js` previously deleted legacy localStorage, IndexedDB and native files when `VITE_BACKEND_GENERATION=ironlog-cloud-1`. A preservation-only startup gate is introduced on this branch to prevent such deletes. It does **not** transfer legacy keys into cloud namespace or migrate production data. A separately verified migration is REQUIRED before rollout.

## Implementation sequence

1. Inventory exact upstream functionality and files since 1.4.2, including new cards, stats, planning, equipment, motivation, community, Coach, circuits, iOS/Android/Watch native features.
2. Capture IronLog appearance baselines across phone/tablet/desktop: navigation, cards, charts, all core pages, RTL, light/dark, active workouts, empty and populated states. Freeze design tokens in `frontend/src/index.css`, `frontend/src/ironlog-brand.css` and shared components.
3. Port upstream domain models, calculation libs, persistence contracts and tests first, preserving IronLog's existing custom logic, cloud sync, and API contracts.
4. Port each upstream feature view/card as a native IronLog React/CSS component; share style tokens and interaction primitives rather than copying upstream styling. Feature-parity checklist must account for every action and setting.
5. Add backwards-compatible migrations with fixture tests and reversible rollout. No real user data touched during development.
6. Run existing unit + integration suites, build web and native, run visual regression against saved IronLog screenshots, verify keyboard/touch/RTL/accessibility. Compare behavior with upstream v1.4.5.
7. Produce staging Preview and test on a restore of **sanitized** production data with explicit permission. Only then approve a staged production release with monitoring and rollback.

## Feature parity checklist

- [ ] Home: mini muscle maps, weekly set targets, recovery tips, streak/challenges, recaps, Wrapped, deload suggestions, daily form/check-ins
- [ ] Stats: Strength Levels, effort/volume insights, cardio goals, lifetime totals, relative strength, recovery, bodyweight trend and photos
- [ ] Workout: circuits/EMOM, live workout volume, form video, backup exercise swaps, expanded progression and deload, per-exercise gym equipment
- [ ] Planning and exercises: all upstream plans, training options, modules, exercise library and metadata
- [ ] Sharing and community: share cards, recap images, community plans/content
- [ ] Accounts/data: compatible imports/exports, offline editing and 2-device merge, all upstream options
- [ ] Coach, integrations and MCP, webhooks, reminders
- [ ] Native iOS/Android/Watch features (require native builds; web PWA cannot emulate platform-only capabilities)
- [ ] Exact IronLog navigation/cards/charts/sheets visual regression
- [ ] Verified non-destructive data migration, backup restoration and rollback

A checkbox can only be checked after implementation and automated/manual proof. **Do not merge this document as evidence of feature completion.**

## Set-by-set trends (openGym v1.4.5 #907)

- Ported upstream's read-only set-by-set calculations and source regression tests: preceding session, warm-ups, assistance, unilateral sets, cardio, holds and estimated 1RM when weight and reps disagree.
- Rendered inside IronLog's **existing** set-number button and saved-workout bottom sheet. No upstream CSS, card/graph/navigation redesign or splash/loading changes.
- Opt-in `setTrend === true` only (off by default even if the field is absent). The native IronLog Settings → Workout → Fine-tuning Row/Switch enables it; no historical workouts/sets are rewritten.
- Added preference-sync and preservation-audit fixtures. **Still pending:** CI for this commit, mobile/RTL screenshots, independently restored backups, full parity and production release gates. Do not merge or deploy.

## Cardio default-speed original-code slice (v1.4.5)
- Original upstream `cardio-kind.js` imported unchanged, with pinned Git blob verification. Its `cardioStartSpeed` is used only by IronLog's new-cardio-config creation path, including existing sheets and quick-add flows; active profile `speedUnit` is passed without touching saved values.
- UI source files remain IronLog's own; no splash, loading, font, bottom-sheet presentation, existing workout record, remote sync, Supabase schema, or production account is changed.
- Cross-device in-memory merge regression verifies workout history, IDs, weigh-ins and unchanged routine definitions survive; adding a new routine remains a normal explicit user action through the existing IronLog persistence system.
- Full parity, restored backups and mobile RTL visual comparisons remain release blockers.

## Original openGym Modules engine + IronLog cloud integration (partial)
- Imported original `modules.js` and upstream tests unchanged and pinned their content hashes.
- Client (`frontend/src/lib/sync-merge.js`) and server (`api/sync-stamps.js`) now synchronize module choices per key. This preserves concurrent settings from different devices in the existing IronLog Supabase-bound profile JSON; NO database migrations, user data writes or deployments were performed.
- Existing IronLog Home check-in card and its current Settings toggle use upstream `isOn` and `setModule`, while keeping the legacy `checkIn` field for old clients. Rest of the UI, splash/boot/loading, native sheets, navigation and historical records remain unchanged.
- **Partial integration only:** other module visibility/service gates, backwards old-client toggling after an explicit new Modules setting, full source parity, RTL visuals and backup/restore not yet certified. Do not merge or deploy.

## Body/Motivation/Strength module display gates (partial)
- Used the exact upstream 1.4.5 `isOn` implementation in **existing** IronLog Home and Stats card rendering, with legacy default-on behavior and the old `showWeightCard` preference retained.
- Added render-level tests confirming the original Home greeting/QR, Stats exercise-progress/history and all workouts/bodyweight/media survive optional visibility changes; no data, sync or database schema writes.
- Still needs UI controls for all original modules, remaining views/services and verification of actual mobile/RTL display and independent restored backups; PR stays Draft.

## Automatic and saved warm-ups continuation

- Complete original ramp/recipe modules, original editor and tests are wired through actual IronLog controls and sheet host. The existing manual count stays available; default-off global generation, per-slot auto/own/none/count, preview and add/remove rows use original logic.
- Planned, freestyle and swap paths build the block; first-work-load edits reramp open generated rows on IronLog loading grids. Completed, edited and explicit manual loads remain protected. Keep these warm-ups uses the existing duplicate-occurrence resolver and preserves workout/history data. Plan sharing/import and existing cloud stamping retain new recipe fields.
- Existing volume/charts remain IronLog's. The editor describes that effective behavior without rewriting a stored future volume preference. No native/provider/store/UI replacement or database migration is introduced.
- Automated verification: 6,368 frontend passes / 6 unchanged Windows path failures (6,374 tests, 539 files); API 694 passes / 24 existing Windows failures / 46 skips (764 total); MCP 96 passes / 1 existing permission failure plus two Windows fs.watch errors. Plain-Node graph, build, media (6,554 + 6,554), fatigue probes (108,000 + 1,800), 19 locale packs × 2,599 keys and source checks pass. Source-string backlog stays 52.
- One missing import in the swap path was corrected after the full run caught it; its six tests and the final complete frontend run pass apart from the known platform failures. Latest-head Linux results are recorded in PR #69. No additional visual runner changes or temporary test tools are included in this batch.


## Cardio resistance integration (2026-11-20)

The unchanged pinned resistance helpers supply bounds and column selection. IronLog's existing
Cards/List/Compact/Focus controls, routine editor, history/text/finish, plan interchange, own and
third-party CSV, and read-only MCP now retain resistance levels. The searchable Level switch in
Workout → Fine-tuning is off by default. Existing grade controls, navigation and saved rows remain
under their original IronLog components; no schema/auth/storage changes or remote data access.

Regression cases cover 1–30 bounds and clearing, default-hidden and completed controls, long Hebrew
notes/media, planned/previous rows, plan and CSV round trips, and old/modern sync writes.
Final local frontend: 6,381 passed, six unchanged Windows path failures (6,387 total / 539 files).
API: 696 passed, 24 unchanged Windows failures, 46 skipped (766 total); failing names match the
preceding warm-up run. MCP: 97 passed, one unchanged Windows permissions failure, two existing
watcher EPERM errors. Plain-Node import graph, production build, 6,554 stills/6,554 animations,
108,000 fatigue and 1,800 history comparisons pass. All 19 locales contain 2,600 matching keys.
Warm-up commit 3d75d41b has green Linux CI run 44613304455 (all five jobs).
These checks verify this integration; broader native, restore and full feature parity remain open.


## Original tempo guide integration (2026-11-20)

The complete original Tempo component, audio engine/rest table and their original tests are
imported unchanged and protected by five raw Git-blob checks. IronLog's existing tempo editor
opens the guide inside its existing sheet host; existing editor controls remain. Original count-in,
phase timing, audio-clock scheduling/cancellation, haptics, repetition count and sound/buzz
preferences are used. IronLog's existing beep/chime/silent-mode/native-haptic behavior is retained.
Guide completion returns through existing Done handlers in all layouts; the actual Focus flow is
covered with a long Hebrew note, tag and media. Changed session, row or prescription rejects stale
completion. A preview of an unsaved tempo never changes the stored prescription.

The final full frontend run passes 6,449 cases with only the same six Windows path failures
(6,455 total / 542 files). Actual audio-bus cancellation/isolation and plural-placeholder tests pass;
all 19 locales contain 2,616 matching keys. Real-device/background audio and haptics still need
native hardware verification. This does not certify complete migration or native parity.

For this batch, API again has 696 pass / 24 unchanged Windows failures / 46 skips (766 total);
MCP has 97 pass / one unchanged permissions failure and two unchanged watcher errors. The failing
API names match ed247ff4 exactly. Plain-Node MCP loading, production build, 6,554 stills/6,554
animations, locale parity, 108,000 fatigue and 1,800 history comparisons pass. No live data or
production environment was accessed. Resistance commit ed247ff4 has all five Linux CI jobs green
in Tests #240 (run 44658984478).


## CSV range presets and Coach set-note boundaries (2026-11-20)

The existing CSV sheet now offers four weeks and three months, calculated by the complete
unchanged original report module. All/open-ended custom ranges and inverted-date protection keep
IronLog's existing behavior. The original report's other dependencies remain behind explicit
IronLog storage/native-fetch/secret/Modules boundaries; importing them does not enable reports,
nutrition pairing, network calls or writes. Full performance-report/nutrition parity is not claimed.
Actual sheet tests cover counts, downloads, no fetch/profile writes and switching away from an
invalid custom draft. Source checks and month-end/leap-year/inclusive-day regressions pass.

Coach full-session snapshots now use the complete original set-note reader through a boundary
that retains IronLog's 500-character cap. Review, question, debrief and running-session fixtures
keep Hebrew notes without media, future fields or source mutation. Empty/non-string notes remain
absent and oversized values remain bounded. The existing numeric allowlist, authentication and
provider selection are unchanged. All 52 targeted payload/source/privacy tests pass. No provider
or live account was called. Root documentation-tool dependencies were installed from the existing
lockfile with verified SHA-512 integrity; catalogue/prompt and API-document generation checks pass.

Full local validation: frontend 6,455 pass / six unchanged Windows path failures (6,461 / 543
files); API 701 pass / 24 unchanged Windows failures / 46 skips (771 total), with identical failing
names to the prior batch. MCP 97 pass / one unchanged permissions failure and two existing
watcher errors. Production build, plain-Node MCP/core loading, 6,554 stills/6,554 animations,
108,000 fatigue and 1,800 history comparisons pass. All 19 locales have 2,618 keys; the existing
missing-string backlog stays at 52. Tempo commit 997f82cb has all five Linux CI jobs green in
Tests #241 (run 44660273239). Native/hardware, restore and wider feature-parity gates remain open.


## Multiple daily readings and safe body-data imports (2026-11-20)

Original weigh-ins and measurement models/tests are retained unchanged, with raw-blob guards.
IronLog's existing forms/history now support opt-in time logging, individual reading edit/move,
delete/Undo, first/average/last daily values and the original chart-time reader. Legacy single-day
behavior remains the default. Reading/day metadata survive writes, merges and unit conversion.
An explicit cross-day move remaps a colliding day-local id through the original id generator;
time/metadata collisions are rejected before mutation rather than replacing a different reading.

Own-body CSV and explicitly enabled timed foreign/XML imports use the original parser/merger on
a compatibility projection. The actual preview and import agree, including additional readings on
existing days and measurement-only files. Existing measurement days/definitions stay unchanged;
new accepted data are appended. Custom typed units and zero scores use original validation/display/
series rules through IronLog's existing form/chart components. Untouched canonical centimetres and
mass precision remain stored exactly, even when the displayed value rounds. Unknown record/field
metadata are retained. Legacy server writers cannot drop reading lists, tombstones, typed units or
new measurement fields; known clears and modern stamped changes retain their existing semantics.

Final local frontend: 6,527 pass / six unchanged Windows path failures (6,533 tests, 547 files).
API: 704 pass / 24 unchanged Windows failures / 46 skip (774 total); failure names match the prior
batch. MCP: 97 pass / one unchanged permissions failure, plus two existing watcher errors. API/MCP
Node loading, production build, 6,554 stills/6,554 animations, generated assets/API docs and fatigue
probes (108,000 comparisons plus 1,800 history comparisons) pass. All 19 locales have 2,629 keys;
the source-string backlog remains 52. No Python/debug test scripts, live data access, schema or
production changes. Native Health reading capture/export, BP/pulse controls, remaining body goals,
full restored-profile/media and native device matrices still require integration/verification.

## Body measurement integration and existing deployment boundary (2026-11-20)

The existing IronLog forms now expose paired blood pressure, pulse, note history and compatible
custom-unit changes using the original model's validation and series. Independent cm/in display
preference does not convert stored measurements. Existing cards, chart renderer, fields and sheet
host remain. Regressions cover invalid pairs/ranges, raw precision, Hebrew notes and units changing
while a form is open. All 19 locale packs contain 2,639 keys, with no increase to the 52-string
pre-existing translation backlog.

`bodyDataVersion: 1` is a per-request capability on the existing profile PUT, not a persisted
profile flag. Both API handlers protect newer fields from incapable stamped/unstamped writers,
including BP-only/zero-score days and timed reading conversion during kg/lb switches. Modern
explicit clears, legacy visible-day deletion and reset behavior are covered. The server uses
the complete raw original reading model and a generated original converter, with provenance and
cross-runtime parity checks. No schema, authentication or storage redesign was introduced.

Full local verification: frontend 6,537 pass / six unchanged Windows failures (6,543 / 548 files);
API 711 pass / the same 24 Windows failures / 46 skips (781 total). MCP 97 pass / one unchanged
permissions failure plus two existing watcher errors. Build, media 6,554+6,554, plain-Node loading,
generated assets/docs and fatigue/history probes pass. e3d0236f has all five Linux CI jobs green
in Tests #243, run 44669504747; the following commit must pass its own CI.

Read `CLAUDE.md`, `docs/IRONLOG_CLOUD.md` and the earlier deployment audit; compared the existing
cloud handler/profile implementation against `origin/main` and `origin/feat/supabase-backend`.
The working Supabase/Vercel boundary is inherited. Historical cleanup/provisioning instructions
are not migration actions and were not executed. This batch neither deploys nor accesses live data.
It does not certify the remaining upstream functionality or native/restore/visual matrices.

## Original resistance bands through IronLog (2026-11-20)

Complete original band editor/chips/model and tests use IronLog's existing controls and sheet
host. Actual configuration save, Cards/List/Compact/Focus, original plan/history seeding and
climbing, labels, CSV and read-only MCP are connected. Unknown inventory/set metadata, 500-char
Hebrew notes, canonical kg resistance, explicit per-exercise preferences and profile-isolated
labels have regressions. Original source remains protected by raw Git-blob guards. The remaining
per-side, summary, portable-plan and native matrices are not certified by these web tests.

The request's `trainingDataVersion: 1` distinguishes capable writers from old clients that merely
echo unknown profile fields. Existing stamped/unstamped compatibility preserves band data; an
ambiguous legacy structural edit is refused before persistence. Capable clears and resets work.
The existing per-key conflict mechanism merges exercise choices; Supabase/schema/auth stay intact.

Full final frontend: 6,568 passed / six unchanged Windows path failures (6,574 / 553 files).
API: 716 passed / the identical 24 Windows failures / 46 skipped (786). MCP: 98 passed / one
unchanged permissions failure and two existing watcher errors. Build, 6,554+6,554 media, Node
loading, generated artifacts, 108,000 fatigue and 1,800 history probes pass. All 19 locales have
2,655 keys; the pre-existing untranslated backlog remains 52. No manual browser/Python/debug
test scripts or live-data operations were used. Current-head Linux CI remains a separate gate.

## Modules settings, routing and service pause/resume (2026-11-20)

The existing IronLog Settings shell hosts controls for nine existing feature areas and the
original presets. Original map/default/preset algorithms are unchanged. Actual picker/switch
tests keep workouts, Hebrew notes, media, body data and unknown module choices. Route tests
exercise Body, check-in and Coach deep links, then restore the original measurements route.
Search/page and plate/warm-up display gates follow the same model. Upstream-only services are
not shown as functioning switches; native/connection-confirmation matrices remain open.

Existing client, Supabase cadence and self-hosted cadence boundaries pause scheduled Coach work
without clearing consent, configuration, history or proposals. Watch queue tests verify pause,
re-enable and switching off during an in-flight drain, without prematurely acknowledging ticks.
Native-bridge fixtures verify paused snapshots and unchanged device/session data; Body/Health
values are hidden from snapshots. The isolated cloud cadence fixture tests off and resume.

Full frontend: 6,577 passed / six unchanged Windows failures (6,583 / 555 files). API: 716 passed /
24 existing Windows failures / 46 skips (786); MCP: 98 passed / one existing permissions failure
and two watcher errors. Build/media, Node-loading, generated artifacts, fatigue/history probes
and 19 locales with 2,667 keys pass. The translation backlog remains 52. Band head fd31b115 has
all five Linux jobs green in Tests #246, run 44702296146. This following head needs its own CI.

## Original circuits through IronLog (2026-11-20)

Full original Circuit/AMRAP/EMOM/Intervals/Tabata/run-walk planning, clock and scoring models
are connected through IronLog's existing routine rows, sheet host and Cards/List/Compact/Focus.
Regular restores the original routine; saved run/walk sessions alone advance their programme.
Actual UI tests cover all presets, all four layouts, ticking/completion/save/results, Hebrew
500-character notes, unknown metadata, owner-switch clock restoration and stale-slot safety.
The existing owner-specific active-session persistence holds a raw clock checkpoint. Original
speech/clock DTOs feed the existing native bridges without claiming real-device validation.

Request capability trainingDataVersion: 2 protects circuit configuration, preType and results
from v0/v1 writers. Seven API regressions cover stamped/unstamped preservation, modern clears
and unsafe legacy unlinks. Supabase, auth, schema and production data remain untouched.

Full frontend: 6,635 passed / six unchanged Windows failures (6,641 / 561 files). API: 723 pass /
24 identical Windows failures / 46 skips (793). MCP: 98 pass / one existing permissions failure
plus two watcher errors. Build, 6,554+6,554 media, Node graphs and fatigue/history probes pass.
All 19 packs contain 2,702 keys; pre-existing untranslated backlog remains 52. Modules head
adc765ac has all five Linux CI jobs green in Tests #247, run 44704354710. This new head needs
its own CI; native/full restored-profile/full upstream parity remain unverified.

## Existing Web/PWA equipment completion (2026-11-20)

Compared origin/main at 79fc61ee and the existing Supabase branch. Vercel routing, cloud entry
point, authentication, frontend API and cloud-generation storage are inherited; the earlier
cloud-handler deltas are the two request capabilities and Coach module gate. No replacement
backend or new product routes are needed for the current milestone.

The original per-gym inventory model now runs through the existing store update, Settings and
workout menu. Existing inventory sheets copy from another gym; machine stacks are edited in
existing exercise-detail/configuration sheets. Original parsers, unit-aware readers, switch-time
rounding and stack progression remain unchanged. Completed sets, previous workout/media/notes,
unknown inventory metadata and concurrent offline changes have regressions. Stacks sync using
existing per-exercise stamped maps. Eleven focused tests pass, including actual sheet interactions.

Full local frontend: 6,646 passed / the same six Windows failures (6,652 / 564 files). API:
726 passed / the identical 24 Windows failures / 46 skips (796). MCP: 98 passed / one existing
permissions failure plus two watcher errors. Build, 6,554+6,554 media, generated assets/docs, Node
graphs and fatigue/history probes pass. Final field-style changes were followed by all eleven
focused tests, another build and media staging. Nineteen locale packs have 2,715 keys; the old
source-string backlog stays 52. No Python/browser/manual test artifacts or production access.

Circuit head 5c368ba1 passed all five Linux jobs in Tests #248, run 44711400214, including the
isolated cloud database/auth/sync gate. The following equipment commit needs its own CI.
New programmes pages, Journal, Tools, community, trainers, assistants, integrations and native
platforms remain deferred expansion work. This does not certify full v1.4.5 feature parity.
