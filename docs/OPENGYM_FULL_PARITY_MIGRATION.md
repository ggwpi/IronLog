# IronLog × openGym: full feature parity, IronLog visual design

Status: **IN PROGRESS — NOT SAFE TO MERGE OR DEPLOY**

**Immutable upstream source contract:** [OPENGYM_SOURCE_CONTRACT.md](./OPENGYM_SOURCE_CONTRACT.md). openGym v1.4.5 is pinned as a complete Git submodule; every upstream algorithm must stay unmodified, with IronLog-only component/state boundaries. A source snapshot is not proof of runtime integration.
  
IronLog baseline: `79fc61eed2000049424591b2bde4ec7f20fa6615`  
Upstream baseline to integrate: `DuarteSantos8/openGym@e4a68a94c42a3c17cbd560d66ce2e46a7048ab99` (v1.4.5).

## Current verified implementation scope (branch only)

- A destructive legacy reset at startup has been replaced with a no-delete guard and regression tests.
- A **read-only** migration audit can reject dropped or changed original workout records, sets, loads, routines, measurements, media references, owner-related data fields and active session records on JSON fixture comparisons. This is NOT a backup or a live migration.
- openGym v1.4.5's `lifetimeTotals` calculation and `strength-level` engine were ported with automated tests. IronLog Stats now renders the new calculations in existing IronLog `.card`, `.row`, `Button`, `Segmented`, and `Stepper` components; its strength preferences open through IronLog's existing bottom-sheet system.
- **Not yet feature-parity complete:** the remaining openGym cards, settings, native apps, server integrations and architecture changes have not been ported. Tests/Preview must pass before these changes are considered verified.

## Recovery Hint parity boundary (read-only, opt-in)

- The upstream 1.4.5 Home Recovery Hint algorithm and regression cases have been adapted to IronLog's **existing** muscle load/fatigue model. Until the full newer exercise catalogue and history interpretation are migrated, old IronLog groups `upper-back` and `deltoids` represent lats and all deltoid heads. No saved exercise, workout, or body-map field is rewritten.
- The familiar IronLog Home card appears **only** when the person explicitly enables `Recovery tips` in Look & Home, has sufficiently recent workout history, and has a relevant recovery insight. Prior profiles never see a new Home card by default.
- Dismissal stores a single day and supports Undo. Toggling Recovery tips on clears a previous dismissal. Both preferences are included in the non-destructive audit.
- Sport activity stimuli (running, football, cycling) remain **unimplemented** in this fork and are not silently inferred. Recovery advice based on those activities must wait for the actual activity log and recovery parity, with additional integration tests.
- Recovery Hint message/interaction strings are localized for all 19 IronLog locale packs. Non-Hebrew text comes from the pinned openGym v1.4.5 packs, while the fork supplies Hebrew; Brazilian Portuguese keeps its upstream regional overrides and inherits shared strings from pt. Locale-presence/placeholder regression tests were added. This is **not** proof of screenshot or native feature parity.
- No visual/screenshot comparison or restored production-data test has been performed. The feature is only eligible for preview testing, not production release.

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
