# IronLog × openGym: full feature parity, IronLog visual design

Status: **IN PROGRESS — NOT SAFE TO MERGE OR DEPLOY**

The [original Daily Form continuation](./PR69_DAILY_FORM_VERIFICATION_2026-11-19.md) replaces the
extracted model and connects explicit lighter-session choices through IronLog's existing check-in,
weigh-in, session creation, finish and stamped daily map. Manual IronLog warm-up weights and old
history/media/routines remain protected. Native vitals and the broader insight matrix stay open.

Current traceable inventory: [OPENGYM_FEATURE_AUDIT.md](./OPENGYM_FEATURE_AUDIT.md).
It records every pinned source/configuration path, known original-code/adapted-code boundaries,
and 504 v1.4.3–v1.4.5 release criteria (502 still open). Local browser/test evidence is recorded in
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
