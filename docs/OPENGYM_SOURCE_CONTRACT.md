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
