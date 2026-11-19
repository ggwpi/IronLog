# Immutable openGym v1.4.5 source + IronLog presentation contract

## Pinned source (never edit vendor source)
Source repository: https://github.com/DuarteSantos8/openGym
Pinned commit: `e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`
Location: `upstream/opengym-v1.4.5/` — a Git submodule (gitlink), NOT copied/reimplemented feature code.

```bash
git submodule update --init upstream/opengym-v1.4.5
git -C upstream/opengym-v1.4.5 rev-parse HEAD
```

The second command **must** print the pinned commit above. Plain Git checkout can leave the submodule directory empty until initialized. This source is available for direct integration and auditing, but **the mere presence of the submodule is not complete runtime feature parity**. The current runtime continues to use its existing modules until each real call site is safely integrated and tested. No source changes, API writes or deployments occur by checking out the submodule.

## Integration invariants
1. Never reimplement or rewrite openGym algorithms. Preserve exact upstream code and public behavior. Import the original module; keep its own imports/dependencies intact.
2. In IronLog's own existing view/components, route upstream results and interactions through its physical IronLog components and design tokens. Do not mount upstream screens, apply upstream CSS or introduce a parallel design system.
3. Visual precedence: IronLog's customized splash/boot/loading and transitions; typography; native cards, charts, tab/navigation; expanded bottom sheets and their interaction/logic changes; Home greeting; gestures; accessibility; language selection, Hebrew and RTL.
4. Also retain IronLog's **backend** customizations, identifiers, stored state, media, offline queues and synchronization. Map boundaries at entry/exit points, not by editing upstream internals; prevent destructive migrations and writes to real accounts.
5. If upstream and IronLog semantics conflict (e.g. default visibility of a new badge), leave upstream intact and implement the compatibility decision in IronLog's existing presentation/state boundary, with both upstream and fork-specific tests.
6. Do not delete or rewrite existing IronLog behavior/data to force full parity. Confirm every integration with full CI and mobile/RTL regression testing; preserve backup/restore/rollback gates. PR #69 remains **Draft** and must not merge to main or reach production until all gates pass.

## Daily Form and lighter-session boundary

The complete original Daily Form/session-adaptation closure is now imported unchanged with raw
source checks. IronLog retains actual catalogue IDs, cloud merge, translations, deload registration
and all UI/start/weigh-in paths. The adapter projects only its manual-warm-up guard into the original
engine and restores metadata afterwards. See [verification and limits](./PR69_DAILY_FORM_VERIFICATION_2026-11-19.md).

## Cardio distance boundary

Complete unchanged original distance helpers/tests now drive IronLog's existing workout controls
and history formatting. Menu preference changes do not rewrite rows. CSV restores exact distance
only for an explicitly selected receiver preference and unambiguous metadata identity; its original
parser/schema remain unchanged. See [evidence and limitations](./PR69_CARDIO_DISTANCE_VERIFICATION_2026-11-19.md).

## Complete lifetime module and tempo boundary

`lifetime-totals.js` now re-exports the complete original `opengym-v145/lifetime.js` rather than
an extracted version. Six additional raw-blob checks protect that module, its original tests,
and the original cardio/challenge/distance/unit dependency sources. Dependency adapters retain
IronLog's catalogue, equipment, history, speed and Modules semantics; the volume boundary is still
IronLog's existing interpretation, so new challenge/volume/goal behavior is not certified by source presence.

Original `tempo.js` supplies all tempo normalization, parsing and precedence. IronLog's existing
configuration, set menus, controls and sheet host expose those values without replacing any
upstream algorithm, sync routine or existing component. Data fixtures distinguish old unstamped
unknown-field preservation from a modern intentional removal. Audio/haptic guide and wider native
parity remain open. See the [tempo/lifetime evidence](./PR69_TEMPO_LIFETIME_VERIFICATION_2026-11-19.md).

## New weekly cardio feature leaf

The complete original new `components/CardioWeek.jsx` and its original tests are imported with raw
Git-blob guards. It calls the existing physical IronLog `ui.jsx`, `Icon`, store and sheet host;
its engine public path re-exports the isolated original module. No existing IronLog screen,
component or chart is replaced and no upstream stylesheet is mounted. A new scoped stylesheet
adapts only this new leaf's data attributes to existing IronLog tokens. Original goal editing,
validation, ordering, unit conversion and chart calculations stay untouched inside the original code.
This does not permit substituting upstream screens or CSS for existing customized surfaces.
See [cardio evidence and remaining gates](./PR69_CARDIO_GOALS_VERIFICATION_2026-11-19.md).

## Complete local JSON preservation gate

`auditCompleteProfilePreservation` and the local-file
`scripts/check-ironlog-profile-preservation.mjs` CLI compare every existing JSON root field,
including future/custom settings; only root protocol clocks may advance monotonically.
The old selected-field helper remains for compatibility tests of intentional UI edits and
must not be mistaken for full snapshot certification. No account, migration, sync interception
or data write occurs. See [scope and verification](./PR69_COMPLETE_PROFILE_AUDIT_2026-11-19.md).

## Complete Recovery Hint source and legacy fatigue boundary

The complete original `recovery-hint.js`, original tests and original `recovery.js` dependency
retain pinned blobs in the isolated namespace. The public hint boundary keeps IronLog opt-in
and projects only missing split-muscle names from old aggregate fatigue values, without touching
the input or any profile. It delegates hint rules and text to the original module. The original
fatigue dependency supplies its original regression context; the actual existing Stats/body-map
fatigue model is not replaced. The existing Home card adds only an activities-map memo dependency.
See [actual card/data/RTL evidence and remaining gates](./PR69_RECOVERY_ORIGINAL_VERIFICATION_2026-11-19.md).

## Correction of prior Set Trend implementation
`frontend/src/lib/set-trend.js` and `set-trend.test.js` are restored **byte-for-byte to upstream v1.4.5**. The openGym `setTrendOn` default is ON as upstream originally defines. IronLog's existing Workout and saved-workout bottom sheet show the marker only when `S.setTrend === true` (their own UI preference gate), so existing user visuals remain opt-in without altering upstream behavior. IronLog UI tests cover default-off display, opt-in and unchanged workouts. The unchanged upstream blobs are asserted by the integrity regression.

**Scope status:** Complete upstream source is pinned as a Git submodule; only previously integrated functions are wired in IronLog. Remaining functionality/visual/data-safety parity has not been delivered or validated.

## Original cardio pace module (new-workout defaults only)
`frontend/src/lib/cardio-kind.js` is byte-for-byte from pinned openGym v1.4.5 (`31434387a57045b43a247755b0970f75df869224`). IronLog's existing `history.defaultConfig` calls the **unmodified upstream** `cardioStartSpeed`, and passes the existing IronLog profile's speed-unit preference. All creation UI entry points (quick add, workout, routine, swap, and bottom configuration sheet) continue to use IronLog's original components, sheet and store. This only applies when a NEW cardio config is created; existing saved routines, sets, workout history, other account state and Supabase synchronization are not migrated, reset, or rewritten. Separate tests assert exact source provenance, source behavior, IronLog UI/create semantics and unchanged multi-device history.

## Original Modules engine and per-key cloud sync (v1.4.5)
- `frontend/src/lib/modules.js` and its upstream tests are imported **byte-for-byte** from pinned openGym and verified by upstream Git blob SHA (`3677676cbf74b3c87e1e4321e81bd8dd7d98dd79`). Do not rewrite its logic.
- The existing physical IronLog Home QR card and Look & Home switch now call upstream `isOn(S, 'checkin')`. The switch also preserves the older `checkIn` field for old IronLog clients while saving the upstream per-module choice via `setModule`; old profiles see the same UI and behavior.
- Added `modules` as a **per-key** sync map to the existing IronLog browser and API server stamp/merge contracts. Module changes in separate clients are stamped as `modules.body` and `modules.coach`, not as a single settings value, so concurrent updates cannot trample each other. No schema or Supabase write is performed by this code change.
- Verified with frontend cloud merge + API stamp tests, preserved workouts/routines/custom IDs/media, untouched upstream source. This only wires the module engine and **check-in** surface: other module-controlled cards, pages and services are **not yet gated**. Do not represent this as full Modules feature parity.
- Do not alter design primitives (fonts, splash/loading, bottom sheets, nav, Home cards) or live data. CI and manual RTL/mobile/data restore gates still apply.

## Body, Motivation, Strength UI adapter slice (IronLog Home and Stats)
The original, immutable `modules.js` engine's `isOn(S, id)` now gates the existing IronLog bodyweight, streak and strength-specific display surfaces on Home and Stats; original cards, graphs, sheets, fonts, animation, loading/splash and navigation stay structurally unchanged. An absent `S.modules` still enables every module, retaining old users' visual defaults. Explicit opt-out **hides only UI**; workouts, media, routines, logged bodyweight and any Supabase/cloud document fields stay intact and are not migrated or rewritten. Original IronLog-specific `showWeightCard` setting still has precedence. Other modules/services and module Settings UI remain incomplete, and this slice is NOT feature parity.

## Continuation audit and immutable dependency boundary (2026-11-19)

The [feature audit](./OPENGYM_FEATURE_AUDIT.md) contains a repository-wide source inventory and
504 individually linked release criteria. These are an inventory of work, not completed parity.

`lib/opengym-v145/muscle-targets.js` and its original tests now contain the complete pinned
upstream files unchanged. The old `lib/muscle-targets.js` public path only re-exports them.
Their original relative imports remain intact: sibling `format.js` and `muscles.js` are explicit
IronLog boundary adapters. The latter uses the existing isolated muscle projection; this does not
certify the legacy exercise catalogue as the exact new upstream catalogue. No workout is rewritten.

`lib/set-tags.js` is the original upstream blob `8c6c8fabe7cca9ac70276cc9bd7524150ea9e7e8`.
IronLog's existing set-number button/menu and workout-detail sheet consume it. Plain sets have no
marker. Tag changes use the existing store, completion, JSON and cloud-stamp paths; older-client
preservation has a pure API fixture. Existing IronLog set notes keep their custom editor/length.
CSV import/export and native tag surfaces are still missing; do not label this complete tag parity.

Additional original Modules boundaries gate effort entry/Stats, the pre-workout Body prompt,
Health sync, Recovery Hint and Daily Form summary. Pausing Health retains credentials and written
IDs and catches up on re-enabling. This is not full module/service parity, in-flight cancellation,
all alternate start paths or native-vitals collection.

`.gitattributes` fixes LF text checkout for scripts, CSP/generated hashes and immutable sources on
Windows; no business logic is changed by line-ending rules. Source-integrity tests still compare
raw Git blob hashes, without relaxing the upstream provenance assertions.

## Original CSV closure and IronLog note compatibility (second continuation)

The complete pinned `export-csv.js`, `import-csv.js` and ten pure dependencies are now imported
unchanged under `lib/opengym-v145/`, with four original upstream test files. Sixteen raw Git-blob
checks protect these exact files. Sibling catalogue, dates, history, translation, Hevy-map and tag
shims resolve to IronLog's existing implementations; no upstream screen or CSS is mounted.

`lib/ironlog-csv.js` routes only recognized own-workout CSV files through the original reader.
All other current IronLog third-party/XML readers and its existing date-preserving import merge
remain in place. Post-parse metadata adaptation restores IronLog's longer set-note column: the
unmodified upstream reader still has its original 140-character behavior when called directly,
while the IronLog boundary retains existing 500-character notes. Original serialization is reused
to associate formula-protected names, sessions, set numbers and IDs; the adapter does not visit
or rewrite existing stored workouts. Newly imported band references retain definitions through
IronLog's existing ID union without normalizing existing definitions or dropping unknown fields.

The existing IronLog set-note editor (500 characters, existing keyboard/sheet logic) is now reachable
from the set menu and inline note. Original `setNoteOf` and `setTagCell` are used for read-only
history and MCP projection, retaining long notes and omitting media references from the MCP set.
API fixtures preserve known note round-trips and intentional legacy note clearing separately
from unknown-tag preservation; the existing server conflict/merge logic is not changed.

CSV is **not** the full JSON/media backup. Its upstream schema omits workout IDs, media and other
state; only completed sets are exported. Existing days win on import as before. Body/measurement
CSV export is read-only; full new measurement/multiple-weigh-in imports and sync are not enabled.
The all/custom date sheet uses existing IronLog controls; upstream report-range presets and
automatic normalization await their original dependency integration. Coach payload notes, native
device flows and the remaining parity ledger stay open. See the dedicated CSV verification report.
