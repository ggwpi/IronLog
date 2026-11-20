# openGym v1.4.5 → IronLog feature audit

PR #69 remains **Draft, incomplete, not approved for merge or production**.

## Current milestone: expand IronLog Web/PWA in the isolated preview

The owner accepted workouts, body weight, photos and cross-device sync on 2026-11-20 and
requested continued addition of new Web features before a production/PWA release. The existing
Supabase/Vercel architecture and actual IronLog components remain the integration boundaries.
Programmes add two routes under Plan; the existing routes and main navigation remain.

The programme batch connects original block scheduling, starter templates, week targets,
start/pause/resume/end/repeat and file interchange to those boundaries. Original tests and
additional actual-store/UI/API regressions cover the integration; full release parity remains open.
Tools now connects the original lifting/body/pace calculators through existing IronLog controls.
Journal, community, trainer dashboards, assistant connections and integration services
remain open Web expansion work. Native platforms remain outside the user-directed milestone.
The full-source ledger below is an inventory, not a percentage-complete measure.

Audited source pin: `e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`.
Continuation baseline: `cdf7f169f644c0a0c7e600400d0d5ae1b65b4a0c`.
IronLog UI baseline remains its existing components, not upstream screens or CSS.

## Evidence and interpretation

`node scripts/audit-opengym-parity.mjs --write` inventories every pinned executable-source and
structured-data/configuration path, including native, backend, catalogue and presentation files.
It rejects a wrong/dirty submodule, reads local files without executing application startup or
connecting to an account, and records upstream Git blobs and local hashes in
[OPENGYM_SOURCE_INVENTORY.json](./OPENGYM_SOURCE_INVENTORY.json). `--check` detects a stale report.
Binary media are excluded; media preservation needs separate file checksums and restore testing.

**File counts are not feature counts.** A different file can be a required IronLog customization;
an absent original path can have an adapter under another name. An exact algorithm can still use
older dependencies, catalogue mappings or persistence semantics. No file is automatically marked
functionally certified. Do not replace a differing file wholesale to make this inventory green.

The source inventory covers the full pinned repository. The release-criteria ledger below covers
the v1.4.3–v1.4.5 delta individually, including bug fixes; inherited v1.4.2 features still need
regression checks. This is an exhaustive source/release inventory, **not a completed semantic audit
of every route, service or native platform**. Unchecked means more integration or proof is required.

Four release criteria are verified for shared web paths: Daily Form 1.4.5:230/:232 ([evidence](./PR69_DAILY_FORM_VERIFICATION_2026-11-19.md)) and resistance levels 1.4.5:348/:349 (original helpers, actual editor/four-layout/history/CSV/sync regressions, green Linux Tests #240 at ed247ff4). The other 500 criteria remain open. This does not close native or full feature parity.

## Integration findings and next batches

| Area | Current IronLog integration / evidence | Missing integration or proof |
| --- | --- | --- |
| Immutable source | Git submodule at the required pin; exact-source hash tests | Every remaining imported module and its dependency semantics |
| IronLog visuals | Actual existing `Home`, `Stats`, `Workout`, `sheets.jsx`, `ui.jsx`; selected phone dark screenshots against `cdf7f16` and light/dark English/Hebrew comparisons against `16961600` | Full light/dark scene matrix, tablet/desktop, empty/error/loading/splash states, all sheets, gestures and native screens |
| Lifetime totals | Existing Stats History card now calls complete unchanged original `lifetime.js`; original tests and six raw source hashes; compatible history/catalogue/equipment boundaries | Likeness UI and full native/catalogue parity; imported dependency code alone is not runtime integration |
| Strength levels | `strength-level.js` original source; existing card and demographics sheet; provenance tests | Full upstream context/settings and platform parity |
| Relative strength | `relative-strength.js` original source; IronLog chart | Complete upstream context, muscle catalogue and display proof |
| Weekly muscle targets | Original complete module and original tests under `lib/opengym-v145/`; old public path re-exports it | Dependency adapter intentionally retains isolated `muscles-v145.js`; full exercise-model parity remains open |
| Recovery Hint | Complete original module/tests; actual opt-in Home card and IronLog fatigue model retained through read-only old-name projection; stored sport prevents false neglect; activities-only memo refresh; 16 selected baseline scenes pixel-identical | Full activity capture/sync, full catalogue and fatigue/native parity; existing Stats fatigue engine intentionally remains IronLog's |
| Mini muscle map | Existing opt-in Today-row `BodyMap` | Upstream multiple sessions/split-day semantics and new catalogue |
| Weekly countdown | Original `week-left.js`; existing opt-in Home text and rotation target | Native widgets and complete schedule parity |
| Deload | Original `deload-cycle.js`; existing Home/Settings and planned rep-session boundaries | All programme-specific behavior, native controls and visual proof |
| Daily Form | Complete original model/tests and session-adaptation closure; actual IronLog check-in/Start/weigh-in/finish; explicit load/sets choices, default/Skip/Health gate, 500-character notes/media, manual-warm-up guard and stamped/API compatibility fixtures | Native sleep/vitals collection/prefill, complete insight options and full platform/restore matrix |
| Form insights | Existing Stats rows and original pure insight functions/tests | New volume/bodyweight/warm-up options and native vital collection |
| Set trends | Original `set-trend.js` and tests; existing set-number button and history sheet; opt-in outside algorithm | Full device/interaction matrix |
| Cardio defaults | Original `cardio-kind.js`; all existing new-config entry points pass profile speed units; original resistance helpers now feed opt-in configuration and all four actual workout layouts, history, plans, CSV and read-only MCP | Complete native cardio UI and full platform matrix remain open |
| Weekly cardio goals | Complete original `CardioWeek.jsx`, original component/engine tests; Stats leaf uses actual IronLog UI/store and scoped token styling; minutes/distance/sessions, ordering/removal and legacy-goal compatibility tested | Full native devices and complete activity import/sync; catalogue semantics remain IronLog's |
| Set colour tags | Original `set-tags.js`; existing menu/history; original CSV writer/reader now retain tags on tested plain/warm-up/drop/per-side rows; read-only MCP colour projection | Full per-side native flows/watch support and complete platform matrix; not full tag feature parity |
| Set notes | Original read helper through existing menu/history/MCP/Coach full-session payloads, existing 500-character editor retained; original CSV reader plus separate long-note compatibility adapter | Broader native/offline/privacy matrix; original sanitizer must not replace IronLog's editor |
| CSV | Complete original writer/reader/dependency closure, four original test files, raw-blob checks; existing all/custom sheet plus original four-week/three-month report ranges and download/native-share boundary; common own-workout CSV imports through existing confirm/merge | Broader body/measurement/import metadata/format/timezone matrix; original CSV omits IDs/media and cannot replace JSON backups |
| Modules engine / sync | Original engine/tests and per-key sync; actual IronLog Settings controls/presets for nine existing feature areas; Settings search/page gates, Body/check-in/Coach deep links, plate display, scheduled Coach and queued watch pause/resume regressions | Upstream-only video/integration/community/seasonal services, complete native surfaces and connection/visual matrices remain open |
| Effort module | Original upstream `effortOf` gate inside IronLog history helper; existing Workout/Stats display boundaries | Settings/search/history chart-detail gates and all native effort surfaces |
| Body module | Existing Home/Stats/pre-workout gates; retained weigh-in preference/data; measurements/photos deep links and Settings/search gates; watch weigh-in/default weight hidden and restored | Remaining widgets/native surfaces and alternate-start matrix |
| Health module | Original native sync pause gate; credentials/written IDs retained; pause/resume catch-up fixture; Recovery/Daily Form display gates | Native vitals/read gates, live HR, health pages/search, watch health state and in-flight operations |
| Modules compatibility | Existing missing-key defaults retained, unknown fields preserved | Explicit new Modules choices vs later toggles from older clients |
| Multiple weigh-ins | Complete original reading model/tests; opt-in time control in existing editor, individual edit/move/delete/Undo, first/average/last daily value, original chart-time reader; metadata-preserving write/merge, nested clocks, unit conversion and legacy API guards; own-body/timed import preview and no-overwrite merge | Native Health sample capture/export and complete platform/restore/goal-trend matrix remain open |
| Measurements | Existing IronLog form/card/chart components use original typed-unit, BP/pulse validation/series and note helpers; independent cm/in preference, compatible existing-field unit selection, paired BP controls, pulse chart and 500-character notes; precision, metadata and concurrent unit changes have regressions | Broader native/import, visual and restored-profile matrices remain open |
| Progress photos | Existing IronLog media/history | Original comparisons, tagging/privacy and shared-media permissions |
| Resistance bands | Complete original model, editor/chips and original tests; Root configuration save, Cards/List/Compact/Focus, original seeding/progression, history labels, CSV and read-only MCP; metadata, kg resistance, per-key preferences and old-client guards | Full per-side/plan interchange, summary, native and restored-profile matrices remain open |
| Distance / tempo / per-set records | Complete original distance helpers/tests now drive Cards/List/Compact/Focus and distance history labels; explicit receiver CSV mode, finish/JSON/offline/sync/API fixtures; original tempo uses existing configuration/menu/inline controls; custom Focus set menu opens the same original tag/tempo and 500-character note editors; resistance levels use original bounds/column selection in existing controls with compatibility fixtures; the complete original tempo guide/audio queue now opens from the existing editor and returns completion through IronLog, with stale-state and metadata guards | Broader native/history matrix and per-set records remain open; real-device background audio/haptics remain unverified |
| Circuits / AMRAP / EMOM / Tabata / run-walk | Complete unchanged original models, clock, speech, card and tests; existing IronLog routine picker, all four workout layouts, player sheet, finish/history results and saved run/walk progression; per-owner clock restoration, metadata and old-client compatibility tests | Native device/background cues, broader per-side/portable-plan and restored-profile matrices remain open |
| Warm-ups / plates / equipment by gym | Complete original ramp/recipe models and editor; existing IronLog Settings, session builders and workout layouts; original per-gym inventory/switch/copy and machine-stack readers/progression now feed existing editors and store updates, with metadata/offline/legacy regressions | Complete volume options, per-exercise units and native/restore matrix remain open; existing charts keep IronLog volume semantics |
| Challenges / recaps / Wrapped / streak levels | Existing IronLog streak; partial Motivation display gates | Original challenge/recap/notification engines and current UI adapters |
| Sharing / community | Existing IronLog sharing behavior | Original card export, community data/services, permissions and UI adapters |
| Coach | Existing customized frontend/backend integration retained | All upstream mid-workout adaptation, providers, consent, scheduling and capability gates |
| Integrations / MCP / webhooks | Existing IronLog backend and read-only MCP retained | Full upstream directory, signed hooks, scoped tokens, HTTPS MCP, reminders and gate wiring |
| Trainers / gyms / OIDC / nutrition | Not integrated | Full original services and permissions adapted to IronLog auth/data; no auth replacement or production schema changes |
| Voice / seasonal / reminders / tools | Existing IronLog timer/theme features retained | Original voice profiles, cues, seasonal/calendar/tools functions and module gates |
| iOS / Android / Apple Watch / Wear OS / Garmin / Zepp | Pinned source available, existing IronLog projects retained | Source-by-source integration, platform SDK/device builds and native QA; browser tests do not certify these |
| Data compatibility | No-delete startup guard, selected-field compatibility audit and strict complete-JSON gate/CLI protecting every existing root field; fixture JSON, sync, API preservation tests | Full import/export/old-client/offline conflict matrix, interrupted/storage-full cases, guest adoption, actual media files and independent restored-snapshot certification |
| Supabase/auth/storage | Existing IronLog implementations retained; no schema or production account changes | Isolated DB-backed regression gate and sanitized restore, with no live-account access |
| Backup/restore/rollback | JSON fixture round-trip is tested | Independently restorable production/local/media backups are **not** created or certified by this work; production access is prohibited |

## Checked slices (not whole-feature certification)

- [x] Pinned submodule initialized and read; original checkout left on `testbench`.
- [x] Source provenance regression extended for unchanged strength/deload, colour tags and original muscle targets.
- [x] Set tag assignment/removal tested through existing IronLog menus for all six colours.
- [x] Warm-up/cardio/hold/per-side/drop tag records tested through finish, JSON and multi-device merge.
- [x] Older-client server save preserves tags, notes, media references and custom exercise IDs on fixtures.
- [x] All 19 IronLog locale packs contain colour names and new menu labels, including Hebrew.
- [x] Local Chromium tag picker → active set → guest JSON → completed-history display in English and Hebrew/RTL.
- [x] Targeted phone dark-theme Home/Stats/Workout comparison against `cdf7f16`; see verification report for exact pixel differences.
- [x] Original CSV closure and common own-workout round trips, including tags, units, drops, per-side sets and IronLog 500-character notes, tested without replacing the old merge.
- [x] Actual browser CSV download/import confirmation and long-note editor in English/Hebrew, with requested light/dark theme verified in the DOM and isolated guest storage.
- [x] Twelve populated phone scenes compared against `16961600`; ten exact, two each with four one-shade border pixels; this is not the full UI matrix.
- [x] Read-only MCP notes/tags and legacy server note-clear behavior have dedicated regression fixtures; no live account read/write.
- [x] Complete original lifetime module replaces the earlier extracted calculation; dependency boundaries retain IronLog history and equipment semantics.
- [x] Original tempo interpretation through existing exercise configuration and set-menu/sheet controls; real guest JSON edit/clear flow in English/Hebrew and true light/dark.
- [x] Original cardio goal editor/card/engine tests, actual IronLog persistence and old-client fixtures; phone goal addition/order/save story in English/Hebrew and true light/dark.
- [x] Complete-snapshot gate/CLI rejects lost or changed custom settings and unknown fields; invalid JSON shapes, private-value diagnostics and unchanged input-file bytes tested without account access.
- [x] Complete original Recovery Hint replaces the earlier adapted engine, with IronLog opt-in/fatigue-name boundaries; actual dismiss/Undo/activities-only refresh verified and four enabled-card baseline scenes identical.
- [ ] Full upstream functionality, every custom frontend/backend behavior and native platform verified.
- [ ] Full UI, accessibility, animation, touch/gesture, splash/loading and device matrix verified.
- [ ] Data backup restoration and rollback certified. No live data access authorized.

See [PR69_VERIFICATION_2026-11-19.md](./PR69_VERIFICATION_2026-11-19.md) for commands, results and limitations.
The subsequent CSV/note slice is recorded in [PR69_CSV_NOTES_VERIFICATION_2026-11-19.md](./PR69_CSV_NOTES_VERIFICATION_2026-11-19.md).

## Release criteria ledger

Every criterion below is deliberately open until its *whole behavior* has implementation and
regression evidence. The checked slices above do not close multi-feature release bullets.


### v1.4.5


#### Apple Watch, redesigned and in step with the phone

- [ ] [1.4.5:10](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L10) Watch redesign: idea and first versions by @cubetes (#832 to #966), and so is most of the last round (#1066, #1068, #1069, #1076, #1100, #1107, #1108, #1187, thanks @cubetes).
- [ ] [1.4.5:11](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L11) The watch wears openGym's look: the app's greys, its rounded type and its accent colour (your own, if you picked one on the phone). On watchOS 26 every button is Liquid Glass. The start screen says Today beside the clock, tells you how big the routine is (exercises and sets) and has one big Start, with the other routines as rows under it.
- [ ] [1.4.5:12](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L12) The watch speaks all 26 of openGym's languages: Czech, Danish, Persian, Indonesian, Lithuanian, Swedish and Vietnamese are new.
- [ ] [1.4.5:13](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L13) One session screen instead of a stack of pages: the set in the middle, the rest on the same page after it, and a swipe right for the Overview with every exercise, its sets and supersets grouped. Tap a row to jump there. Finish is a one-second hold at the bottom of the Overview, so a workout never ends on a stray tap, and the Overview comes up by itself after the last set.
- [ ] [1.4.5:14](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L14) The set page reads like Apple's Workout: which set it is on a pill beside the clock, the exercise big under it (warm-up, left or right beside it), the numbers in boxes with their names on top, last time, and one wide Done. The Digital Crown turns the outlined number one step per click, in the exercise's own steps, and never flips exercises again; tap the other box to hand it the crown, tap an outlined box again for a keypad when you need 62.25 kg.
- [ ] [1.4.5:15](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L15) Fix a set you already logged: ‹ goes back to it with what you logged, change a number and Save. › goes forward, past the set up next too.
- [ ] [1.4.5:16](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L16) The rest: a big countdown beside the clock, your heart rate and the workout's time, and Up next with the next set's weight and reps, so you can load the bar while you breathe (#1100; #911, thanks @rhjensen79 for the idea). Rate the effort while you rest: four chips (RIR 0, 1, 2, 3+ or RPE 10, 9, 8, ≤7, whichever the phone logs), one tap and it's on the set. −15 s, Skip and +15 s wait a second before they take a tap, and ‹ opens the set you just did to fix it while the clock keeps running.
- [ ] [1.4.5:17](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L17) Timed holds: a big countdown with a bar that turns orange for the last five seconds and a click for each of the last three. Finishing the workout mid-hold logs the seconds you held instead of dropping the set. Per-side sets say Left or Right on the set, the hold and Up next, and supersets name their partner under the exercise.
- [ ] [1.4.5:18](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L18) Metrics is a stack now: the summary the way Apple's Workout draws it, then Heart rate (average, max, min and a line of the whole workout), Effort (how hard each exercise was), Zones (time in each heart-rate zone) and Muscles (sets per muscle today) (#1068, #1108, #1187). Zones works from your date of birth in Apple Health and only asks for it once you switch on Settings → Integrations → Apple Health → Birth date, for heart-rate zones. Apple's own music controls are one more swipe away, and lowering your wrist on the Overview or the music takes the watch back to the set.
- [ ] [1.4.5:19](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L19) The Overview shows each exercise's picture, the still of the animation the phone already sends for the workout, greyed once it's done.
- [ ] [1.4.5:20](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L20) The weigh-in, the summary and "All done?" got the new look. "All done?" is a card instead of a system alert, says how long nothing happened, sends Finish to the Overview's hold, and goes away by itself when you log a set on the phone. The summary shows the time big, and its Done ignores taps for its first second.
- [ ] [1.4.5:21](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L21) It follows the phone: a set ticked on the iPhone moves the watch to the next one, on that exercise or another, and the last set of an exercise takes it to the next exercise instead of leaving it on "All sets done" (#1066, thanks @cubetes). A rest paused on the phone stands still on the wrist, with only Skip live.
- [ ] [1.4.5:22](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L22) A rest that ran out while the screen was off goes back to the set page when you raise your wrist, and never starts a timed hold nobody saw (#1101, #884).
- [ ] [1.4.5:23](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L23) The watch says plainly whether your sets reached the iPhone: a small orange arrow with a count beside the clock while sets are on their way (a crossed-out phone when it is out of reach), "Waiting to sync 3" or "All synced" on the Overview and the summary, and the count on the complication and in the Smart Stack, even after the workout ended. It comes straight from the outbox, so it is right after a relaunch too.
- [ ] [1.4.5:24](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L24) Calmer, clearer motion: screens fade into each other instead of cutting, ‹ and › slide the set in from the side you went to while the arrows and Done stay put, and the 3-2-1 before a workout (or a hold that starts by itself) drains its ring smoothly, springs each number in and ends on GO! in the full ring. With Reduce Motion on it's short fades only, and in Always On nothing moves.
- [ ] [1.4.5:25](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L25) Long names fit: workout and routine names keep clear of the round corners on every case size, a long exercise name gets smaller or takes another line instead of ending in "…", and Skip shows its symbol where the word does not fit. Checked in the simulator on 40, 42, 46 and 49 mm, in German and Russian and at the largest text size.
- [ ] [1.4.5:26](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L26) Fixed: the end of a rest or a timed set keeps you in the app instead of dropping you on the watch face, and the rest countdown no longer crashes at 0:00 (#936, #883, thanks @cubetes in #955). With Apple Health off, watchOS can still go back to the clock, and the Overview now says how to avoid that.
- [ ] [1.4.5:27](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L27) Fixed: a snapshot from the phone no longer undoes a ±15 s on the watch or brings back a rest you skipped there, and the summary keeps its heart rate when watchOS ended the workout session itself (thanks @cubetes in #1073).
- [ ] [1.4.5:28](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L28) On the iPhone, Settings → Watches → Apple Watch says for each state of the link what to do next and keeps itself up to date while it's open. Apple Health opens the Apple Health page straight away (#1069), the rest timer is picked from two pictures of the watch, Calories works and the "Time so far" switch that did nothing is gone (#1076, thanks @cubetes).

#### Wear OS, the same watch on every Wear OS wrist

- [ ] [1.4.5:31](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L31) Wear OS gets the watch redesign, idea and first versions by @cubetes, and so is most of the last round (#1024, #1027, #1029, #1030, #1031, #1033, #1165, #1168 to #1172, #1174, #1175, #1180 to #1184, #1188, #1189, thanks @cubetes). Pixel Watch, Galaxy Watch and every other Wear OS watch now look and work like the Apple Watch: one design on every wrist.
- [ ] [1.4.5:32](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L32) openGym's look on Wear OS: the app's dark greys and your accent colour from the phone. Start says Today beside the clock, shows the routine's exercises and sets, one wide Start and the build number at the bottom.
- [ ] [1.4.5:33](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L33) The Wear OS watch speaks all 26 of openGym's languages: Czech, Danish, Persian, Indonesian, Lithuanian and Vietnamese are new there.
- [ ] [1.4.5:34](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L34) One session screen: swipe between the Overview, the set, Metrics and music controls. The rest and holds run on the set page, Finish is a one-second hold, and the Overview shows up by itself after your last set.
- [ ] [1.4.5:35](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L35) The set page: weight and reps in big boxes in Apple Workout's style (#1175), and the exercise's animation beside them like on the Apple Watch, held still with Remove animations and left out in Always On (#1170; where the phone app has the standard animations). The crown (or the rotating bezel) turns the outlined number, tap it again for a keypad, and ‹ › take you back to a logged set to fix it, with your heart rate for the set kept.
- [ ] [1.4.5:36](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L36) The rest like the Apple Watch's (#1174, #1184): a big countdown whose last three seconds turn orange, a +15 s pill that adds up your taps (#1181), Up next with the next set's weight and reps (#911), and the effort chips while you rest (RIR or RPE, whichever the phone logs). −15 s, Skip and +15 s wait a second after Done, a hold's bar goes orange for the last five seconds, the superset partner is named, and finishing mid-hold keeps the seconds you held.
- [ ] [1.4.5:37](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L37) Metrics: time, heart rate with its max and min, sets, volume and calories, on Metrics and on the summary (#1171, #1180). Under it Heart rate, Effort, Zones and Muscles pages like on the Apple Watch (#1172, #1188, #1189). Zones works from the birth year you gave openGym on the phone and says how to add one when it is missing. Calories need the physical activity permission, which the watch asks for once.
- [ ] [1.4.5:38](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L38) Buzzes you can feel: Wear OS 3 watches vibrate at all now, and logging a set there no longer stops the app (found by @cubetes in #1168). The watch buzzes where the Apple Watch does, and "rest's over" comes once more after 5 seconds unless you touch the watch first.
- [ ] [1.4.5:39](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L39) Readable on every watch: no text under 12 sp (#1183), every screen fits a 40/41 mm watch at the largest text size (buttons shrink their word or show just the icon, the set page measures what fits), the clock line at the top stays on its curve instead of running into the exercise name, and "Still training?" says its whole sentence. The first sync after installing opens the start screen at the top, and the page dots follow a page you jumped to from the Overview. TalkBack can change the numbers with More and Less, and Always On shifts its pixels so the screen does not burn in (#1169).
- [ ] [1.4.5:40](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L40) A long-text complication for the wide slots on a watch face (#1182), next to the Tile and the small complication, all with the sync count.
- [ ] [1.4.5:41](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L41) The weigh-in before a watch start, "All done?" after 20 quiet minutes (it asks, it never ends a workout on its own), a summary with the time big, and a Now playing remote for music on the watch, with one tap to the system's Media Controls for music on your phone.
- [ ] [1.4.5:42](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L42) It follows the phone: Skip, +15 s or a pause on the phone moves the watch's rest too, and a set ticked on the phone moves the watch along, to the next set, the superset partner or the exercise you ticked it on (#1165, thanks @cubetes; #1149). The effort chips then rate that set. Moving, adding or removing an exercise on the phone leaves the watch on the one you are doing, and a weight changed on the phone for your next set shows on the watch, unless you already turned the crown.
- [ ] [1.4.5:43](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L43) Wear OS catches up with the Apple Watch, thanks @cubetes (#1030, #1031, #1033): a set you tick on the phone gets the watch's heart rate, each rest's heart rate lands on the set before it, a run or yoga session is recorded as one instead of strength training, and a workout left open on the charger rests the heart-rate sensor after 3 quiet hours instead of draining the battery.
- [ ] [1.4.5:44](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L44) Samsung Health or another app already recording a workout? openGym leaves it running and only reads your heart rate.
- [ ] [1.4.5:45](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L45) Sync you can see: an orange arrow with a count beside the clock while sets wait for the phone, "Waiting to sync 3" or "All synced" in words, and the count on the Tile and the complications. "Waiting to sync" clears as soon as the phone has stored a set, app open or not, and "All synced" waits until the phone has actually answered once.
- [ ] [1.4.5:46](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L46) The watch keeps itself awake through a rest so its buzz is not late with the screen off, "Phone out of reach" follows the phone within half a minute, and a phone reachable over Wi-Fi counts as in reach.
- [ ] [1.4.5:47](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L47) Fixing a weight on the phone half an hour after your last set counts as the workout going on, so the watch no longer asks "All done?" a minute later. And when the phone sees you walk out of the gym, "Looks like you left the gym" shows up on the watch too, and the phone no longer overrules a watch that ended the workout for that reason.
- [ ] [1.4.5:48](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L48) Calm motion: screens fade, ‹ › slide the set in from the side you went, and a 3-2-1 ring ends on Go!. Remove animations means short fades only, and in Always On the watch draws outlines and nothing moves.
- [ ] [1.4.5:49](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L49) New on Android: Settings → Watches → Wear OS watch. It says whether a watch is connected, whether openGym is on it, whether it is in reach and when it last checked in, and what to do next in each case. Until now Android had no watch page at all.
- [ ] [1.4.5:50](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L50) Fixed: a snapshot from the phone could undo a ±15 s or bring back a rest you skipped on the watch; the summary's heart rate ran into the round edge ("164 max" cut off); the rest screen's "Next: …" line was in English in every language; and the app crashed when a workout ended while it was still starting.

#### Garmin, talking to the phone at last

- [ ] [1.4.5:53](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L53) The phone apps now talk to the openGym Garmin watch app (Connect IQ): your workout shows on the wrist, sets, starts, finishes and discards logged there land on the phone, and the Garmin can start today's routine by itself. On Android it goes through Garmin Connect; on the iPhone you pick your watch once. The watch side needs openGym 1.4.5 on your phone.
- [ ] [1.4.5:54](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L54) Get it from the Connect IQ Store: Settings → Watches → Garmin → Get openGym for Garmin opens its store page. The same page lists which Garmins the phone knows, whether openGym is on them, and the watch switches (send workouts, open on the watch when a workout starts). A watch out of reach is asked to come closer instead of being offered the app, and Look again works after a Garmin Connect that was too old or got stuck.
- [ ] [1.4.5:55](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L55) Garmin gets the watch redesign, idea and first versions by @cubetes. Forerunner, fēnix, Venu, vívoactive, Instinct and the rest now look and work like the Apple Watch and Wear OS, fitted to what each Garmin can do.
- [ ] [1.4.5:56](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L56) openGym's look on Garmin: black, your accent colour from the phone, numbers in boxes. Start says Today, shows the routine's exercises and sets and one Start. Black-and-white screens (Instinct) get outlines, and the number you are changing turns white on black.
- [ ] [1.4.5:57](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L57) One session screen: the Overview, the set and Metrics side by side. Swipe on touch watches, or pick them from the menu on watches with buttons. The rest and holds run on the set page, and the Overview shows up by itself after your last set. Touch and hold its Finish to end the workout, or confirm from the menu.
- [ ] [1.4.5:58](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L58) The set page like Apple Workout: UP and DOWN (or a swipe) change the outlined number, BACK switches weight and reps like before. Previous set in the menu (or ‹ beside Done) opens a logged set to fix it, and your heart rate for it stays.
- [ ] [1.4.5:59](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L59) Rest and holds: RIR or RPE while you rest (chips on touch watches, in the menu on the others), −15 s, Skip and +15 s that wait a second after Done, a hold with its own 3-2-1 and a bar that goes orange for the last five seconds, the superset partner by name, and finishing mid-hold keeps the seconds you held.
- [ ] [1.4.5:60](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L60) It follows the phone: Skip, +15 s or a pause on the phone shows on the wrist ("Paused", with the time standing still), and the watch's own +15, −15 and Skip move the phone's rest. On the bigger Garmins a set ticked on the phone moves the watch along too; the smallest ones (Forerunner 55 and 245, Venu Sq, fēnix 6, enduro, Instinct) don't have the memory for that.
- [ ] [1.4.5:61](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L61) Metrics (time, heart rate, sets, volume, calories), a summary with the time big, and "Still training?" after 20 quiet minutes or as soon as the phone saw you leave the gym. Keep going tells the phone too. Music stays with Garmin's own controls.
- [ ] [1.4.5:62](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L62) Sync you can see: an orange arrow with a count beside the clock while sets wait for the phone, and "Waiting to sync 3" or "All synced" on the Overview and the summary. It counts sets, not messages.
- [ ] [1.4.5:63](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L63) The Garmin keeps every event until the phone confirms it applied it, like the other watches, so a set logged while openGym on the phone was closed is not lost. A whole workout logged with the phone away drains in one go without the watch jumping back, an event sent again long after the phone applied it is confirmed again, so a watch that was away for a whole workout lets go of all of it, and the link no longer stops for good: it comes back after Garmin Connect was updated or restarted, and keeps quiet while the phone does.
- [ ] [1.4.5:64](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L64) A watch that never heard from the phone says where to go: Settings, then Garmin, in openGym on your phone. Android runs nothing of Garmin's until you open that page once, and never without Garmin Connect installed (the page says so). On the iPhone it says when Garmin Connect is missing.
- [ ] [1.4.5:65](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L65) Small watches, big workouts: on the Instinct 2 family (96 KB for an app) the watch keeps the first 16 sets of today's routine (the rest arrives from the phone) and holds 6 sets for the phone at a time; the others wait their turn and go out as soon as there is room. The 128 KB watches hold new sets back the same way once memory runs low, so a long workout with the phone at home no longer runs them out of memory. To fit at all, those smallest watches leave out Metrics, the effort chips, "Still training?" and the hold timer (Done logs a hold's seconds on the set).
- [ ] [1.4.5:66](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L66) A 3-2-1 that ends on Go! before a workout started on the watch. It drains smoothly on AMOLED screens and steps once a second on the others, which stay still otherwise.
- [ ] [1.4.5:67](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L67) The Garmin speaks 22 of openGym's languages now: Czech, Danish, Indonesian, Lithuanian and Vietnamese are new. (Connect IQ has no Hindi, Bengali or Persian, and only one Portuguese.)
- [ ] [1.4.5:68](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L68) The Garmin app ran in Garmin's simulator on ten watches, Forerunner 55 to fēnix 8: every screen sizes its big numbers to the watch, so nothing overlaps on the small ones, and nothing hides under the Instinct's little round window anymore.
- [ ] [1.4.5:69](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L69) Fixed: on the Venu Sq 2 the top button did nothing. It starts, logs a set and skips the rest like START on the other watches.
- [ ] [1.4.5:70](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L70) Fixed: on the Forerunner 55 and the Instinct 2 the summary's title and long exercise names were cut off. They wrap onto a second line and get a smaller font before anything is cut. "Not synced yet" reads whole on the Instinct too.
- [ ] [1.4.5:71](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L71) Fixed: a snapshot from the phone could undo a ±15 s or bring back a rest you skipped on the watch, and on the small watches "Timed holds start by themselves" logged a hold as done the moment the rest ended.
- [ ] [1.4.5:72](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L72) The F-Droid build stays free of Garmin's closed SDK, so it has no Garmin link; its Garmin page says so.

#### Watch sync: one rest timer, every set once

- [ ] [1.4.5:75](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L75) One rest for the phone and every watch: a rest started anywhere ends at the same second everywhere, +15 s, −15 s and Skip on any of them move the others, a pause on the phone holds the watch, and opening the phone app no longer restarts the watch's rest. A watch whose clock is a little off is allowed for (#882, #936, #1149).
- [ ] [1.4.5:76](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L76) Every set of a running workout has an id now, shared by the phone and all three watches. A tick lands on the right set even after sets moved, the same exercise twice keeps its sets apart, and a set you make a warm-up on the phone stays the same set (#1162).
- [ ] [1.4.5:77](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L77) Apple Watch and Wear OS keep every set, start, finish and discard in an outbox of their own and send it again until the phone confirms it applied it. A failed transfer, a killed app or a phone that was off all day no longer eats a set.
- [ ] [1.4.5:78](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L78) A set logged at the wrist is never dropped, even when the phone took that exercise out or the routine was edited or deleted since the watch last heard. A workout finished on the watch ends at the moment you tapped Finish, not when the phone heard of it.
- [ ] [1.4.5:79](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L79) The phone sends a change to the watches at once instead of waiting, and whatever waits goes out when you lock the phone. Apple Watch sets reach the iPhone in a moment while it is near, so logging on both devices back and forth stays in step (#882).
- [ ] [1.4.5:80](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L80) iPhone: the watch link starts with the app, even when iOS wakes it in the background, so sets land while the phone sleeps in your pocket. One limit stays for now: with the iPhone app in the background, what you do on the watch shows on the phone when you open the app. Nothing is lost on the way.
- [ ] [1.4.5:81](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L81) A set unticked or edited on the phone stays that way on the watch, instead of the watch insisting on its own copy, and an older fix from the wrist no longer undoes a newer one from the phone.
- [ ] [1.4.5:82](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L82) The rest after a set ticked on the watch counts on the phone from the tick, so both ring together, and a phone that had been away no longer runs rests for sets done long ago.
- [ ] [1.4.5:83](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L83) A workout started on the watch and ended on the phone before the watch heard about it no longer keeps running on the wrist. Sets logged on the watch after you saved the workout on the phone join the saved workout, even for an exercise the phone had left empty.
- [ ] [1.4.5:84](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L84) A late copy of a watch workout's start no longer starts it all over again, and a watch workout started while another one ran on the phone waits its turn, however long that takes, instead of being thrown away.
- [ ] [1.4.5:85](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L85) Fixed: a phone clock set back a little made the watch ignore the phone until the clock caught up, and on Wear OS and Garmin a +15 or Skip pressed right after Done could be undone a few seconds later by the phone's copy of that same rest.
- [ ] [1.4.5:86](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L86) Settings → Watches → Apple Watch and Wear OS watch: "Last heard from the watch" counts the newest set, rest or status that reached the phone, not only when the watch app started (#1151).
- [ ] [1.4.5:87](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L87) How we know: the sync has a simulator and a random test that plays thousands of lost, doubled and late messages, killed apps and clocks apart (docs/WATCH_SYNC.md), and each watch's own sync code has tests of its own. Not on real wrists yet, so tell us what you see.

#### Your workout at a glance: the live widget

- [ ] [1.4.5:90](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L90) The Lock Screen, the Dynamic Island, the Android notification (a Live Update on Android 16) and the Home Screen widget show what matters for the set you are on, with Log set right there.
- [ ] [1.4.5:91](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L91) It follows the exercise and the moment by itself: weight × reps for a lift, the band for band work, the clock for a timed hold, time and speed or distance for cardio, metres and load for a carry, the partner in a superset. During a rest you get a big countdown with "Up next", or "Next exercise" before a new one. Nothing to set up.
- [ ] [1.4.5:92](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L92) Settings → Workout → Live widget opens on a status card: a switch for this phone, a plain warning with one tap to fix it when Live Activities or notifications are off, and Try it on this phone, which puts a sample on your real Lock Screen or notification for two minutes. Turn Live Activities on in the iPhone's Settings and they work without restarting the app.
- [ ] [1.4.5:93](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L93) Under it a pinned preview of your own phone's screens in three moments (a set, a rest, all done), and the switches grouped by moment: During a set, During a rest, The whole workout and In the app. Flip one and the preview goes where it shows; one that cannot show says why. The choices: heart rate, what's next, time since start, effort, record hints, calories, the exercise picture, and the buttons − + for weight and reps, +15 s on rests (iPhone), Next exercise and Pause. Pick a Clean or a Detailed look.
- [ ] [1.4.5:94](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L94) For power users: Per exercise type gives strength, bands, holds, cardio and carries an own setup, with Warm-up and Add set among the buttons. And an optional strip in the workout shows only what the screen does not already: the exercise after this one, heart rate and calories.
- [ ] [1.4.5:95](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L95) Not showing up? A row at the bottom lists the usual reasons on your phone and what to do about each.
- [ ] [1.4.5:96](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L96) The buttons work from the Lock Screen and the notification without opening the app (on a locked iPhone, iOS may ask for Face ID or your passcode first), and a tap there and one in the app can never log the same set twice. On the iPhone the card changes the moment you tap and only the numbers roll, and Warm-up and Add set answer from the Lock Screen too. Finish opens the app, since saving asks what to keep.
- [ ] [1.4.5:97](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L97) Heart rate shows only when something measures it: headphones or the phone's workout, or the last set your watch measured.
- [ ] [1.4.5:98](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L98) The Android notification builds on the one whose idea (and first version) is by @Andrew-A-A (#874).

#### Circuits, AMRAP, EMOM, Tabata and run/walk

- [ ] [1.4.5:101](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L101) A routine can run on the clock now: Plan → a routine → Routine type → Circuit, AMRAP, EMOM, Intervals (Tabata 20/10 × 8 is one tap) or Run/walk program. A superset can do the same from its name above the exercises (How it runs), so a finisher can sit after your strength work, and a one-exercise EMOM is fine.
- [ ] [1.4.5:102](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L102) A full-screen player with a big clock, the station you are on with its animation, what comes next, Pause, Done and Skip. Beeps, a buzz and 3-2-1 at the end of each interval, the voice says "Go! Burpees" when Spoken cues are on (the speaker in the player switches them), the screen stays on, and a locked phone still rings every interval. The Lock Screen and the workout notification count it down too.
- [ ] [1.4.5:103](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L103) Every station lands in the workout as a normal set as it happens, so history, stats, records and progression just work. The workout keeps the rounds, the AMRAP score (rounds + reps), the round times and how that compares with last time ("Round 3 today: 12 s faster").
- [ ] [1.4.5:104](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L104) After a finished run: one more rep or five more seconds per station for next time, one tap to put it in the routine. The run/walk program moves up a level after three finished runs.
- [ ] [1.4.5:105](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L105) Apple Watch, Wear OS and Garmin show the station you are on and count down the circuit's rests.
- [ ] [1.4.5:106](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L106) Fixed: the + and − buttons of a number field told a screen reader "Increase" and "Decrease" in English whatever the app's language.

#### The AI Coach, easier and handier

- [ ] [1.4.5:109](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L109) Setting up the Coach is a few taps: big cards for OpenRouter, Claude, GPT, Gemini and a model on your own network. Sign in with OpenRouter and one login covers Claude, GPT, Gemini and more, billed to your own OpenRouter credits.
- [ ] [1.4.5:110](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L110) For Claude, GPT and Gemini: a link straight to the provider's key page, paste the key (a key of another provider switches over by itself), Test it, pick a model with a rough price hint. "On my network" finds Ollama, LM Studio or llama.cpp for you.
- [ ] [1.4.5:111](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L111) Ask the Coach to do things, not just answer: "make me 3 full-body routines with only bodyweight and a pull-up bar", "a quick workout for today", "swap the leg press", "put Legs on Thursday", "remember my left knee is sensitive". Every change shows up as a preview you say yes to, and plan changes can be undone.
- [ ] [1.4.5:112](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L112) The Coach reads more of what you track: strength trends, body measurements and, only if you switch it on, sleep, heart rate, steps and how you feel. Coach menu → What the Coach sees lists all of it, with a switch for each.
- [ ] [1.4.5:113](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L113) Web research, if you want it: the Coach can look things up with your provider's own search and links the pages it read. Off until the admin and you both switch it on.
- [ ] [1.4.5:114](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L114) A routines library the Coach can pick from: the starter plans now, community routines from opengym.ch later.
- [ ] [1.4.5:115](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L115) Claude and ChatGPT can use your openGym as a connector: add the address from Settings → Integrations → API tokens as a custom connector and sign in with openGym. You pick what it may see and change, and you can revoke it any time.
- [ ] [1.4.5:116](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L116) Fixed: long-thinking models died as "could not reach" on mobile data (#1035). Answers stream now, and a dropped connection says so.

#### Use the AI you already pay for

- [ ] [1.4.5:119](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L119) Settings → Use your subscription: add openGym to Claude, ChatGPT or Gemini as a connector and let the assistant you already pay for read your training and write routines. No API key, no second bill. Three steps per app, a Copy button and a QR code for the address, a link straight to the right settings page, and a status that turns green with "Connected via Claude" once it has used openGym. Disconnect any of them there too.
- [ ] [1.4.5:120](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L120) Gemini works where Google has custom apps (some plans and countries for now), and the screen says so instead of pretending.
- [ ] [1.4.5:121](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L121) No server, just the phone? The screen says honestly why a connector cannot reach it and shows what works instead: OpenRouter, an API key or a model on your network.
- [ ] [1.4.5:122](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L122) Got Claude Max, Ultra or Team? Your plan includes monthly API credits, and the Anthropic card in the Coach setup links straight to the key page. Gemini's free key is a one-minute job now: open AI Studio, copy, paste, and openGym tests it by itself.
- [ ] [1.4.5:123](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L123) The connector sign-in got sturdier: refresh tokens so Claude and ChatGPT stay connected, Claude's and ChatGPT's own client identity (no registration needed), the checks ChatGPT asks for, and it works under a subpath (BASE_PATH) too. Assistants can search the exercise library by name, muscle or equipment, so a routine they write uses exactly the exercise you meant.
- [ ] [1.4.5:124](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L124) Admins: the Claude Code setup token stays, with a plain warning that Anthropic only allows it in Claude Code. For your own instance there is a preview to run the Coach on your ChatGPT plan (COACH_CHATGPT_PLAN=on, Sign in with ChatGPT).

#### Trainers and gyms (self-hosted, `TRAINERS=on`, off by default)

- [ ] [1.4.5:127](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L127) Gyms, gym leads and trainers on one server. An admin creates a gym and gives people the lead or trainer role, or lets someone train freely without a gym (#119, ideas by Alex Marin (trapy on GitLab) and @hcke).
- [ ] [1.4.5:128](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L128) A trainer hands you a code or a QR. You see who they are, which gym and who answers for your data, and pick per category what they may see, suggest or change. Nothing is shared until you say yes and they confirm.
- [ ] [1.4.5:129](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L129) With a gym trainer, the gym lead gets a row of their own: pre-filled with what your trainer sees, never more than see, and you can switch any of it off (`TRAINERS_LEAD_ACCESS` picks `row`, `mirror` or `none`).
- [ ] [1.4.5:130](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L130) Settings → Account → Trainer & gym shows exactly what each side sees, lets you change it or disconnect, and it counts on their next tap. Your sharing log lists every connection, change and look, only you read it, and it comes along in "Download my sharing record" and goes with your account.
- [ ] [1.4.5:131](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L131) Groundwork for the trainer dashboard, the shared library and sign-in with OIDC: one permission check for every new route, versioned consent records, per-account limits. See docs/TRAINERS.md.
- [ ] [1.4.5:132](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L132) The trainer dashboard: the people you train in one list with their last workout, streak, this week as dots and what needs you (missed plan days, new PRs, quiet for a week, weight on the move, a suggestion still waiting), with search, filters and sort. On a phone it is a list, on a wide screen the list and the person sit side by side. Idea and first version by @alexandreviolamelo (#974).
- [ ] [1.4.5:133](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L133) One member shows only what they shared: an overview with sessions per week, best lifts and weight, their workouts (without photos, and without notes unless they shared those), their plan and body weight. Anything not shared says so, and every look lands in their sharing log.
- [ ] [1.4.5:134](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L134) Assign one of your routines to one person or a whole selection, onto a weekday if you like, with a word for the road. Before you send it, the sheet says per person whether it goes in directly, waits as a suggestion or is skipped because they do not share plans. Their copy says it came from you; send it again and it replaces that copy.
- [ ] [1.4.5:135](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L135) Comment on a workout, log a weigh-in from the gym's scale: comments go to the member's inbox, never into their data.
- [ ] [1.4.5:136](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L136) What a member allows decides the rest: "Change directly" writes on the server through the same sync stamps a second device uses, so their phones merge it without losing a thing; "Suggest" waits in their inbox to be taken or left. Every change carries the trainer's name and the member can undo it, one change at a time, for 30 days, from Trainer & gym.
- [ ] [1.4.5:137](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L137) Members get a line on Home and a push when a trainer connects, when their sharing changes (not you? have a look), when a trainer changes or suggests something and when one leaves a note.
- [ ] [1.4.5:138](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L138) Gym leads see their gym: its trainers, every member who joined, their trainers and only what each member's lead row lets through. They add and remove trainers by account id and hand out a join code (GY-…) for the front desk, which joins the gym without any trainer.
- [ ] [1.4.5:139](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L139) A trainer leaving a gym (or a member leaving it) no longer just cuts things off: each member gets 30 days to keep that trainer privately, with the same sharing and without the gym lead, or the connection ends by itself.
- [ ] [1.4.5:140](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L140) Nutrition is a category you can share already; it stays empty until a nutrition app is linked. openNutrition plugs in with its read-only `summary:read` token (`NUTRITION_SOURCE`, `NUTRITION_URL`), and a trainer never sees the token.
- [ ] [1.4.5:141](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L141) "See what Marco sees" in Trainer & gym shows you the very screen your trainer gets.
- [ ] [1.4.5:142](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L142) Progress photos you share with a trainer they can now actually see: your day photos and workout photos, newest first, each file checked against your sharing on every look and logged. Your form videos, exercise pictures and profile picture stay yours. The photo count no longer said 0 either.
- [ ] [1.4.5:143](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L143) Trainers can fix a typo in a logged workout (Correct, on the workout): the weight, reps or name, never adding or removing sets. Like every other trainer change it is labelled with their name, waits for a yes at "Suggest", shows in your sharing log and is one tap to undo. Logging a whole workout and a body check-in for you now have buttons too.
- [ ] [1.4.5:144](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L144) "Keep training privately?" only shows up when that trainer may train people outside a gym on your server. Otherwise the connection just waits, in case they come back.
- [ ] [1.4.5:145](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L145) The streak in a trainer's list counts with the member's own phone's rules, freeze history included, so it is never a week off what the member sees.

#### Sign in with your identity provider (OIDC)

- [ ] [1.4.5:148](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L148) Self-hosting with Authentik, Authelia, Keycloak, voidAuth or Pocket ID? openGym signs people in through it now, next to passkeys: set OIDC_ISSUER and OIDC_CLIENT_ID and the sign-in screen gets a "Sign in with ..." button (#130, idea and first version by @melduarmir (#391), testing by @austinwilcox).
- [ ] [1.4.5:149](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L149) The phone app signs in the same way from "Connect to my server", in the system browser, and comes straight back to the app. No pairing code needed.
- [ ] [1.4.5:150](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L150) Accounts make themselves: being in the right group at your provider is the invite (OIDC_ALLOWED_GROUPS), and leaving it ends that profile's sessions. FIRST_USER_ADMIN works for the first provider sign-in too.
- [ ] [1.4.5:151](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L151) Groups can hand out roles (OIDC_ROLE_MAP): admin, trainer, gym lead and member per studio. A role you gave by hand stays put.
- [ ] [1.4.5:152](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L152) Already have a passkey profile? Settings → Account → Sign in with ... links it, after the usual passkey check. Linking by e-mail is opt-in and only for addresses the provider says are verified.
- [ ] [1.4.5:153](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L153) OIDC_ONLY makes the provider the one way in (admins keep their passkeys for a rainy day), OIDC_LOGOUT signs you out at the provider as well, and Admin → Identity provider shows whether it all works.
- [ ] [1.4.5:154](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L154) Recipes for each provider are in docs/SELF_HOSTING.md.

#### From the community

- [ ] [1.4.5:157](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L157) Danish: the app speaks Dansk now, exercise names too (thanks @jonasdkgit in #1039). Everything added since it was written is translated too.
- [ ] [1.4.5:158](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L158) Fixed: 75 exercises whose steps described a different movement, like scapula push-ups that bent the elbows or reverse-grip rows done with a normal grip (#1053, thanks @6801318d8d in #1056). Where a translation followed the old steps, it shows the corrected English until it is redone.
- [ ] [1.4.5:159](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L159) Easier to read: small notes in dialogs, the light "Sign in" pill, ticked sets and the search fields' hints all have more contrast, and the weigh-in nudges get a proper tap height (thanks @cubetes in #1040).
- [ ] [1.4.5:160](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L160) Self-hosting: the Docker images run on Node 26 and pick up the newest Node 26 and nginx 1.x fixes each time they are built (thanks @vkentta in #1059).
- [ ] [1.4.5:161](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L161) Fixed: planks, hangs and wall sits from FitNotes came in as cardio at 0 km/h. They are timed holds now, to the second.
- [ ] [1.4.5:162](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L162) Fixed: reloading the admin dashboard dropped you on Home.

#### From TestFlight

- [ ] [1.4.5:165](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L165) Fixed: spoken cues and your own voice clips are heard even with the end-of-rest sound off and the iPhone on silent. Music still only turns down for them.
- [ ] [1.4.5:166](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L166) Fixed: the back-to-top button did nothing on iPhone when you were all the way at the bottom of a long page.
- [ ] [1.4.5:167](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L167) Fixed: on a photo share card the logo sits on its own dark badge, and nothing runs over it any more. A card that is too full shortens the list or shrinks the map instead.
- [ ] [1.4.5:168](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L168) Fixed: "Next time: 0 kg, lighter" under every lift on the finish screen with pyramid sets or progression off. It now shows the set you will open with, or nothing.
- [ ] [1.4.5:169](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L169) Fixed: Apple Watch workouts could land in Apple Health with 0 kcal. The watch asks for the calorie permission an older version never asked for, and a watch workout without any energy gets the phone's estimate.
- [ ] [1.4.5:170](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L170) Share card colours: pick the background (openGym dark, black, white, your accent, any colour or see-through), the text and the highlights. The logo stays the logo.
- [ ] [1.4.5:171](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L171) "On the card" says what fits: the muscle map and the exercise list share the room now, and when something still does not fit on that size, its chip is marked and the sheet tells you.
- [ ] [1.4.5:172](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L172) Colour tags for sets: give any set one of six colours, each with its own shape and name. They show by the set number and in History, and go into the CSV export.
- [ ] [1.4.5:173](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L173) Bands in the Focus view and on per-side sets too, and a band can have a level or strength ("Heavy", "Level 3") beside or instead of its colour.
- [ ] [1.4.5:174](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L174) Voice: the moment sheets say up front that you can record your own voice or pick an audio file (MP3, M4A, WAV, AAC, OGG).
- [ ] [1.4.5:175](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L175) More room around the title and description fields when you share with your server, and under a custom exercise's description.

#### From the Reddit thread

- [ ] [1.4.5:178](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L178) Fixed: on iPhone the rest alerts could stop Spotify or leave it quiet. Every tone, clip and spoken line now only turns your music down for a moment and hands it back at full volume after the last one, also when you lock the phone mid-cue or a call comes in. Android gives the music back too when the voice engine drops a line.
- [ ] [1.4.5:179](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L179) Resistance bands: add your own (name, colour, resistance if you know it) under Settings → Equipment, then tap the band under each set. History reads "15 × Red + Yellow", the next session starts with last time's bands and hands you the next band once every set hit the top of its reps. Band exercises get the chips by themselves, any other exercise with Log with bands in its settings. The CSV has a bands column.
- [ ] [1.4.5:180](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L180) Carries and sleds by distance: an exercise can be tracked in Reps, Time or Distance now. Farmer's carries, yoke walks, sled pushes, pulls and drags and sprints start at metres per set with a load (#1011, #1012, idea and first version also by @baron-de-ropp in #177).
- [ ] [1.4.5:181](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L181) Drop-sets in the plan: on every set or only the last one, with how many drops and how much lighter, so the workout sets them up for you.

#### Text your size, forgotten workouts

- [ ] [1.4.5:184](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L184) Text size has six steps now, Smallest to Largest, with a preview right in the picker (Settings → Look & Home → Text size). Default follows your phone's own text size (Android font size, iPhone Dynamic Type) without doubling it, and a size of your own replaces the phone's instead of stacking on it.
- [ ] [1.4.5:185](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L185) Text that ignored the size now follows it, and the screens hold up at Smallest and Largest. Search finds it under "font", "text", "size" or "bigger" in every language.
- [ ] [1.4.5:186](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L186) Forgotten workouts: after a quiet spell (45 minutes unless you pick 30, 60, 90 or Off) the phone and your watch ask "Still training?" with Keep going or Finish (Settings → Workout → Forgotten workouts; idea and first version by @lodepav in #906).
- [ ] [1.4.5:187](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L187) Walked out of the gym with a workout running? With the gym reminder set up, the phone asks right away: finish now, keep going or discard. The places stay on your phone.
- [ ] [1.4.5:188](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L188) Nobody answers within 5 minutes (or 2, or 10), and the workout finishes by itself. It never throws anything away, and it ends at your last set plus its rest, so a forgotten evening still reads as the 52 minutes it was. Reopen it from the summary or History for 24 hours.
- [ ] [1.4.5:189](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L189) Apple Watch and Wear OS ask the same question and follow the same choices, Keep going on the wrist tells the phone too, and Wear OS now ends a forgotten workout as well (#904) once the phone is on 1.4.5.
- [ ] [1.4.5:190](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L190) Fixed: Android scaled only the letters with a big system font, not the rows and buttons around them, so set rows clipped. The whole layout grows now.

#### Fresh from the tracker

- [ ] [1.4.5:193](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L193) Plan → Routine from a past workout: pick something you did (imported histories too) and its exercises and sets become a routine to tweak. Also on the empty Plan once you have workouts (idea by @alexgrandasoto, #1010).
- [ ] [1.4.5:194](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L194) Body measurements: a custom field can be renamed now, and every reading stays with it (#1009, thanks @claire-puppylove).
- [ ] [1.4.5:195](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L195) Health Connect: body water from your scale (Renpho and friends) shows next to body fat, lean and bone mass (#1014, thanks @elmillgoa).
- [ ] [1.4.5:196](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L196) Android 16: the workout chip by the clock has its own text, the sets done of all or the paused rest's time, so it shows up where a bare timer did not (#874, thanks @radu781 for chasing the Samsung chip).
- [ ] [1.4.5:197](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L197) Fixed: on Android a rest could chime twice, once from the alarm and once more when the app thawed and caught up. Each end rings once now (#1007, thanks @sgoendoer).
- [ ] [1.4.5:198](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L198) Fixed: the star was missing in the sheet an exercise opens in when you add it mid-workout, so you could not favourite it there (#1006, thanks @xwr3).
- [ ] [1.4.5:199](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L199) Fixed: a workout with a long break in the middle (25 minutes on a bike you didn't log, a queue for the rack) was saved as only the part before the break, so 107 minutes became 7. Everything you did after a break counts now; only a burst of sets ticked seconds apart after the fact, or a set ticked hours later, still leaves the clock alone. A pause no longer counts as a break either (#1021, thanks @bondeabhijeet).
- [ ] [1.4.5:200](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L200) Next exercise when the rest ends: Settings → Workout. Once the rest after an exercise's last set runs out, Cards and Focus bring up the next one by themselves, the way a timed hold already did. Off by default, and a superset still waits for its whole round (idea by @Creatgame, #1017).
- [ ] [1.4.5:201](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L201) Bengali: everyday Bangla that addresses you as আপনি, app terms the way people actually say them (#1023, thanks @mrjohndoel).
- [ ] [1.4.5:202](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L202) Self-hosting: `COACH_EFFORT` (low to max) sets how hard the Claude provider's model thinks on Coach jobs; unset changes nothing (#1018, #1019, thanks @Brandon168).

#### Voice for the spoken cues

- [ ] [1.4.5:205](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L205) Pick the voice that says your cues: Settings → Timer alerts → Voice. Every voice your phone or browser has for the app's language, with a preview, plus speed and pitch sliders.
- [ ] [1.4.5:206](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L206) Styles: Just the facts (as before), Calm coach, Drill sergeant, Hype man (LET'S GO! ONE MORE, CHAMP!) and Deadpan, in every language, with new lines as a rest starts, at 10 seconds, when it ends, before your last set and on a new record.
- [ ] [1.4.5:207](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L207) Your own lines: edit any style's lines per moment, or write your own from scratch.
- [ ] [1.4.5:208](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L208) Your own clips: record a friend shouting "you can do it" (or pick a file), up to three per moment, played instead of the line. They sync to your own devices and are never shared to the community library.

#### Sister apps: openNutrition, runs and matches

- [ ] [1.4.5:211](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L211) Link openNutrition, read-only: Settings → Integrations → Sister apps → openNutrition, its address and the code it shows (or a token with summary access). openGym never changes anything there, and the link stays on this device.
- [ ] [1.4.5:212](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L212) With it linked: calories, protein and protein meals a day in the performance report (a Nutrition section) and a Fuel card in Your month, each with its own switch on the openNutrition sheet.
- [ ] [1.4.5:213](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L213) Your fasting window on Home, under today's session: "Fasting until 12:00" or "Eating window open until 20:00", when openNutrition sends it.
- [ ] [1.4.5:214](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L214) Runs, rides and matches from other apps: Strava, your watch, Runna and friends save them to Apple Health or Health Connect, and openGym now reads them as activities (Settings → Integrations → Apple Health / Health Connect → Runs, rides and matches from other apps). No sets, no volume, no records.
- [ ] [1.4.5:215](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L215) Activities show in History, as a blue dot in the calendar and on a day's sheet, where you can also log one by hand (a padel match, a climbing night).
- [ ] [1.4.5:216](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L216) They tire the muscles they used: 90 minutes of football leaves your legs recovering in the muscle map and the Home hint, a yoga class barely registers.
- [ ] [1.4.5:217](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L217) Sport counts for the streak, if you want it to: Settings → Look & Home → Sport counts for the streak. Off by default, like recovery.
- [ ] [1.4.5:218](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L218) Imports keep your sport: the workouts in an Apple Health export (runs, tennis, swims) come in as activities instead of being dropped, and a Hevy or Strong session that was only sport (Padel, Football, minutes and nothing else) becomes an activity instead of an empty workout.
- [ ] [1.4.5:219](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L219) Fixed: the trainer's nutrition card read openNutrition's days as all empty (it looked for kcal and carbs where openNutrition says energy and carbohydrate), and an unlogged macro read as zero.
- [ ] [1.4.5:220](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L220) Fixed: the Apple Health / Health Connect card said Off while only body composition or vitals were being read, and Disconnect on it left those two reads running.

#### openGym Offline, network log, reminder sounds

- [ ] [1.4.5:223](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L223) openGym Offline: a second Android app without the internet permission, so Android itself makes sure it never talks to anyone. Everything that works on the phone alone, 180 px animations, no sync, Coach, YouTube, update check, webhooks, Strava, WebDAV, calendar feed, API tokens, community library or gym search. Its own name and package, so it sits next to the normal app.
- [ ] [1.4.5:224](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L224) Network log in the phone app (Settings → About & updates → Network log): every request this session, by host, with the time. A phone on its own shows 0.
- [ ] [1.4.5:225](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L225) A sound for each reminder (Android, Settings → Reminders → Sounds): workout days and the nudge, the check-in and the gym reminder can each ring with the phone's default, any phone sound, one of openGym's tones, your own sound or nothing.
- [ ] [1.4.5:226](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L226) Less motion (Settings → Look & Home) turns every slide, bounce and snowflake off on this device.
- [ ] [1.4.5:227](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L227) Themed app icon on Android 13 and up (#311), and the widget picker shows a preview with numbers instead of the app icon.

#### Daily form, vitals and your month as a story

- [x] [1.4.5:230](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L230) Daily check-in before a workout: sleep, energy, soreness and stress, 1 to 5, four taps, every one optional. Off until you switch it on (Settings → Workout → Before and during → Daily check-in, or the Daily form card in Stats asks once).
- [ ] [1.4.5:231](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L231) A run of rough check-ins now counts towards the automatic deload-week suggestion, together with lifts that stopped climbing.
- [x] [1.4.5:232](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L232) On a rough day the check-in offers to go lighter: 10% off the open sets (rounded to your plates) or one set fewer per exercise. Today only, never picked for you, and the session sits out of progression so your next targets stay put.
- [ ] [1.4.5:233](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L233) Stats → Overview → Daily form: what your check-ins and your sleep say about how the workouts went (estimated strength, volume, reps in reserve), only once there is enough to compare, with the number of workouts on each side and a plain word on how sure it is.
- [ ] [1.4.5:234](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L234) Vitals from Health Connect and Apple Health: last night's sleep, resting heart rate, HRV and steps next to your usual, on the Daily form card. Settings → Integrations → Health Connect (or Apple Health) → Sleep, resting heart rate, HRV and steps. Read on the phone only, never synced. The check-in fills its sleep from it.
- [ ] [1.4.5:235](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L235) Your month in openGym: the year's stories for one month (workouts, hours, volume, weeks with a workout, records, exercise of the month on the muscle map, what was new, one line to go out on), every card shareable. Stats → More → Your month, or Play your month on the recap card on the 1st.

#### Build a session, skill ladders, deload weeks and streak levels

- [ ] [1.4.5:238](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L238) Build a session from the muscle map: tap muscles or groups, pick 20, 40 or 60 minutes, and get a session that fits the active gym (bench, dumbbells, machines, your own kit), leaves out muscles still recovering and puts what you already do and your favourites first, each with a line on why. Swap one, shuffle, start it or save it as a routine (Exercises → By muscle → Build a session).
- [ ] [1.4.5:239](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L239) Skill ladders: push-up, pull-up, dip, single-leg squat, hinge, core and handstand chains from easy to hard, with the rungs you reached. Train it puts the next rung in a routine on the new Skill ladder rule: a rep more each clean session, and at the top of the range in every set the workout offers the next rung with Swap in routine. Make your own ladders too (Exercises → Ladders; #223, idea by @yavuzselim313, sketch by @pascalplr).
- [ ] [1.4.5:240](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L240) Starter plans for away from the gym: no equipment, dumbbells only, resistance bands and a hotel room (Plan → Load starter plan → Away from the gym).
- [ ] [1.4.5:241](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L241) Your own kit: name equipment the list has no word for (a sandbag, rings) on a gym's profile, tag your own exercises with it, and they show only at gyms that have it (Settings → Equipment → a profile → Your own kit; #323).
- [ ] [1.4.5:242](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L242) Deload weeks without a programme: every 4, 5, 6 or 8 weeks, or suggested when your numbers dip two weeks running (and your check-ins say tired, once you log them). A deload week trains 40% fewer sets at the same weights and stays out of progression. Home shows it coming with Push it back a week and Skip this one (Settings → Advanced → Deload weeks).
- [ ] [1.4.5:243](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L243) Cluster as a set type: every set cut into mini-sets at the same weight with a short rest between them, like 3+3+3 with 20 s (exercise settings → Set type → Cluster).
- [ ] [1.4.5:244](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L244) Favourite routines: a star in the routine editor, and the starred ones lead Plan and the Start sheet (#327).
- [ ] [1.4.5:245](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L245) Sick and travel weeks keep the streak: a day note saying sick, travelling or injured on any day of a missed week excuses it, no freeze spent, up to 4 weeks a year by default. The calendar marks the week and says why, and a trainer sees the same number (Settings → Look & Home → Sick and travel weeks).
- [ ] [1.4.5:246](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L246) Levels: points from the weeks you trained, streak badges and finished challenges, with the bar to the next level on Stats → Week streak and in the widgets. Pin up to three badges next to your profile picture (tap the level, or Settings → Account → Badges on your profile).

#### Journal, check-in reminders, blood pressure and recovery

- [ ] [1.4.5:249](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L249) Journal: every note in one feed (workout, exercise and set notes, the always-on ones, routine tips, check-in notes, day notes, sauna notes), filtered by kind, exercise, dates, words or "with photos". Save a filter as a folder, open a note whole, jump to its workout, or pin it at a gym (Stats → More → Journal).
- [ ] [1.4.5:250](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L250) Notes per gym: "seat 4, pad 2" pinned at one gym shows on that exercise only while that gym is active, and a pin without an exercise sits at the top of every workout there. Pin from the journal or write it in the exercise's note (⋯ → Add note → Only at …).
- [ ] [1.4.5:251](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L251) Check-in reminders: how often for each measurement, the weigh-in, blood pressure and progress photos, at one morning time, bundled into one notification on the day anything is due. On the phone as a local notification, in the browser as a web push (Body measurements → Check-in reminders, also in Progress photos and Settings → Notifications).
- [ ] [1.4.5:252](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L252) Blood pressure and pulse (#313): systolic over diastolic in one field, charted as two lines, in the CSV export and back in on import (Body measurements → Fields → Blood pressure and pulse). A check-in can carry a note too.
- [ ] [1.4.5:253](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L253) Recovery sessions: sauna, ice bath, massage, mobility or an easy walk with how long it took, in History and the calendar. Not a workout, so the streak leaves it alone unless you say so (Settings → Look & Home → Recovery counts for the streak; #313).
- [ ] [1.4.5:254](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L254) Delete workouts only: clears the training log, or only what came before a date, and keeps routines, settings, gyms and body data. Offers a backup first and an Undo after (Settings → Data & backup).

#### Tempo, rest sounds, backups, calendar and Strava

- [ ] [1.4.5:257](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L257) Tempo per exercise or per set, like 3-1-1-0: set it in the exercise's settings or for one set from its menu. The workout shows it on the exercise, and a tap starts a guide that counts every rep through lower, pause, lift and squeeze, with a tone and a buzz per phase you can hear from the floor. It goes along in the CSV export and import, shared plans and the sync (#572, idea by @WENeko).
- [ ] [1.4.5:258](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L258) A sound for each kind of rest: after a warm-up, between working sets, between superset rounds and before the next exercise can each end with their own sound, built-in or one of yours, on the phone's lock-screen alarm too (Settings → Timer alerts → Sound; #165, idea by @kurktchiev).
- [ ] [1.4.5:259](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L259) Backup to WebDAV: a copy of everything once a day in your own Nextcloud, NAS or any WebDAV folder, Back up now, and Restore on a new phone with the same replace-or-merge question as a backup file. The password stays in the phone's secure storage. Works without a server; in a browser your WebDAV server has to allow it (docs/WEBDAV_BACKUP.md; #582, idea by @Mahaveer1013).
- [ ] [1.4.5:260](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L260) Calendar feed: your planned sessions, and finished workouts if you like, in Apple, Google or Outlook calendar through a private link. Make a new link or turn it off any time (Settings → Integrations → Calendar feed, docs/CALENDAR.md).
- [ ] [1.4.5:261](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L261) Strava: finished runs, rides and rows go up to Strava as what they were, strength sessions as Weight Training if you switch it on. For servers that register their own Strava app (`INTEGRATIONS=strava`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`; docs/INTEGRATIONS.md; #478, idea by @workhardbekind).
- [ ] [1.4.5:262](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L262) Webhooks: a cardio set logged by distance now carries `distanceKm`.

#### Records on the set, and a Tools page

- [ ] [1.4.5:265](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L265) A trophy on the set the moment you tick it, with a buzz and two happy notes: heaviest yet, most reps at this weight, best e1RM or biggest set, each said apart. History and the day's workout show the same trophy. Settings → Workout → Record trophies.
- [ ] [1.4.5:266](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L266) Before a set, a quiet line says how close it is: "97% of your best e1RM · 2 more reps for a record at this weight". Settings → Workout → How close to a record.
- [ ] [1.4.5:267](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L267) Rep records in an exercise's history (also from the workout's ⋯ → History): the heaviest you did for 1 to 12 reps with the date, and greyed what your best e1RM says is possible.
- [ ] [1.4.5:268](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L268) Recovery in hours: Stats → Muscles → Fatigue lists every tired muscle and when it is ready again, like "Chest ~18h, Thu 7:00", with the split shoulder and the lats.
- [ ] [1.4.5:269](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L269) Stats → More → Tools: % of 1RM rounded to your plates, load for reps at an RPE, DOTS, Wilks and IPF GL, BMI, FFMI, Navy body fat and a pace calculator, filled in from your log.

#### Things we promised and finally built

- [ ] [1.4.5:272](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L272) Three new progression rules (exercise settings → Progression → Rule): Steady double progression (one rep at a time, every set has to hit it first), Undulating days (medium, heavy and light days in turn, weights from your estimated max) and Shorter rests (same weight, less rest each clean session, then more weight). Idea and first version by @giulioleuci (#823, #824, #825).
- [ ] [1.4.5:273](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L273) The shoulder is three muscles now: front, side and rear delts, and the lats are their own muscle apart from the upper back, in every muscle map, the balance, Weekly sets per muscle, recovery and the muscle filter (#638). Your custom exercises tagged "Shoulders" still count, for all three heads.
- [ ] [1.4.5:274](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L274) Bench: flat or adjustable (Settings → Equipment → Bench, or the gym's equipment profile). A flat bench keeps incline and decline work out of the library, the picker and the Coach's picks; no bench keeps bench work out.
- [ ] [1.4.5:275](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L275) Your own photo or video on any built-in exercise (exercise page → Your photo or video): it shows instead of the animation, with a switch on the picture to flip back. Private, synced with your account, never shared (#259, #534).
- [ ] [1.4.5:276](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L276) Fixed: incline push-ups, wall push-ups and cable pushdowns no longer need a bench to show up.
- [ ] [1.4.5:277](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L277) Fixed: the Coach did not see a routine's triple progression rule.

#### API tokens and MCP over HTTPS

- [ ] [1.4.5:280](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L280) API tokens: in Settings → Integrations, make a key for one program (an AI assistant, a planner, a script). Pick per category what it may see and what it may change, and when it ends. It never gets more than you have, only your own profile, it is shown once and stored only as a hash, and revoking it stops it on the next request. Every look and change shows in your sharing log (#480, idea by @rkj; #566, idea by @kurktchiev).
- [ ] [1.4.5:281](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L281) MCP over HTTPS: an optional container serves openGym's MCP tools at https://your-server/mcp, so assistants on the web, a phone or another machine can use them with a token. Turn it on with `COMPOSE_PROFILES=mcp` and `MCP=on` (docs/MCP_REMOTE.md; #781, idea by @czepter; #314, idea by @mzspicoli).
- [ ] [1.4.5:282](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L282) The MCP server can read through your server instead of the data folder, so it runs anywhere and never sees other profiles (#880, idea by @krapnixvitu).
- [ ] [1.4.5:283](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L283) New MCP tools: create_routine, update_routine and delete_routine. Edits keep every setting you did not mention, and a confirmed change or a delete lands on exactly the version you saw or not at all (#960, idea by @sajlx; #310, idea by @ameer-khan-ashraf).
- [ ] [1.4.5:284](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L284) log_workout logs cardio: minutes, speed or distance, incline, in mph or km/h (#942, idea by @matthewjablack).
- [ ] [1.4.5:285](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L285) Fixed: log_workout's dry run said no PRs even when the save then gave PR badges (#942).
- [ ] [1.4.5:286](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L286) Fixed: the MCP's workout labels showed cardio in km/h on a profile that uses mph.

#### Progress photos, grown up

- [ ] [1.4.5:289](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L289) Every photo you add at once gets its own day: one at a time, with a preview and "2 of 5". The day comes from the photo's own date (JPEG, PNG, WebP and HEIC now), else the file name, else the file date, and the sheet says which, so a guess is easy to spot (#940, idea by @Borgna02).
- [ ] [1.4.5:290](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L290) Wrong day? Tap the date in the full-size view and pick the right one. The photo moves there, onto that day's workout if it has one (#940, idea by @Borgna02).
- [ ] [1.4.5:291](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L291) The gallery is one grid cut into months with the date on every photo, a line on top that says how long since the last one, and a chart of your photo days. Tap a day to jump to it (#949, idea by @Borgna02).
- [ ] [1.4.5:292](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L292) Take photo: an in-app camera with your previous photo laid faintly over the live view, so you stand in the same spot every time. Pick another photo for the overlay or switch it off, set how strong it is, flip between front and rear. Where the live camera is not allowed, the phone's camera app takes over (#951, idea by @Borgna02).
- [ ] [1.4.5:293](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L293) Compare two to nine photos: side by side in tidy rows, every photo the same height (drag one to choose what shows), or the before/after slider for two. Share sends exactly what is on the screen as one picture, made on your phone (#950, idea by @Borgna02).
- [ ] [1.4.5:294](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L294) Progress photos stay yours: none of this shares them anywhere. Trainers still need your photos permission, and the community library still only shows a photo you share yourself.
- [ ] [1.4.5:295](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L295) Fixed: Progress photos could not be opened before your first workout, so there was no way to add the very first one.
- [ ] [1.4.5:296](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L296) Fixed: the before/after slider had lost its round grip, leaving only a thin line to aim for.

#### Importing, with a say in it

- [ ] [1.4.5:299](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L299) Check and choose: the import summary lists every exercise in the file and what it becomes. Tap one to pick the right library exercise or keep it as your own, and the pick is remembered for the next import (#931, idea by @lodepav).
- [ ] [1.4.5:300](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L300) Untick exercises you don't want, narrow the dates, or leave the notes and RPE/RIR behind; the counts follow before anything is written (#849, idea by @Suslicke).
- [ ] [1.4.5:301](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L301) Hevy API import keeps workout and exercise notes, routine rest timers and rep ranges, which become double progression (#815, idea by @lodepav).
- [ ] [1.4.5:302](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L302) Fixed: Strong's "Lat Pulldown (Cable)" and "Lat Pulldown (Machine)" arrived as new exercises of your own instead of the lat pulldown.

#### Backups, coach tips, gyms and planned sessions

- [ ] [1.4.5:305](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L305) Fixed: the iPhone UI test looked for "Next set" in the rest-over notification, which now names the set waiting ("Rest’s over: Barbell Full Squat, 8 reps"). The notification was arriving all along; the test now reads its title, and a retry picks up the workout the first try left running.
- [ ] [1.4.5:306](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L306) Coach plans keep their tips and backups: a cue per exercise ("Brace before each rep") lands in the routine and shows under the exercise in every workout, and up to three backups per exercise come along for when the machine is taken. Reviews and revisions see the notes and backups you already have and keep them (#1003, idea by @SANCLA).
- [ ] [1.4.5:307](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L307) The swap picker in a workout has "Ask the Coach for a swap" at the top when the Coach is set up, opening straight on "Machine’s taken" (#1003).
- [ ] [1.4.5:308](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L308) No Coach? The Backups sheet suggests a few in one tap: the same movement or muscle, on other kit your gym has (#1003).
- [ ] [1.4.5:309](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L309) Numbers per gym: an exercise can keep separate numbers for each gym (exercise settings → Per gym), so last time, the rows a session opens with and the next weight come from the gym you are at. Add the machine's brand and the same brand at another gym shares the numbers. The exercise history gets an All gyms chooser (#988, idea by @RobinRHL, brand-as-label design from @lodepav, idea also by @xXSharpyXx in #946).
- [ ] [1.4.5:310](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L310) Session targets: a coach or planner can set the exact rows for one routine on one day (warm-ups, load, reps and rest per row) through the synced profile. The workout opens at them, your routine and its progression stay untouched, and a target that does not fit is refused with a reason instead of half applied. Format in docs/dev/SESSION_TARGETS.md (#972, idea by @soshiforehead-spec).

#### New

- [ ] [1.4.5:313](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L313) Android: Settings → Workout → Screen orientation keeps openGym upright (or sideways) while the rest of your phone rotates as it likes (#821, thanks @snike79 for the idea).
- [ ] [1.4.5:314](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L314) A machine's weight stack and your dumbbells take a whole list at once: type one per line or paste "5, 11.3, 18.1". The quick fill stays around after the first block, so a stack with a finer run on top is two fills (#926, thanks @johannes1984 for the idea).
- [ ] [1.4.5:315](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L315) Plates: add the sizes your gym really has (3 and 4 kg, 0.25 kg micro plates, anything on a quarter step) and take them out again, per gym. Plate loading and the "X kg short" hint only reach for what is on your list (#886, thanks @rt-oliveira for the idea, idea and first version also by @temperatio in #542).
- [ ] [1.4.5:316](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L316) An exercise can go by one of its other names everywhere: give it "Pec deck" under Other names, pick it under Shown as, and the workout, routines, history and stats say Pec deck. Exports and the API keep the catalogue title (#903, thanks @lodepav for the idea).
- [ ] [1.4.5:317](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L317) Start picks: hold the Start button (or set Settings → Workout → Start button to "Let me pick") for today's plan on top and every other routine below it, unscheduled ones too, plus freestyle. No more calendar detour (#930, thanks @Nour-hash for the idea). Home's "Choose a different workout" opens the same picker.
- [ ] [1.4.5:318](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L318) Preview before starting: switch it on in Settings → Workout and a routine opens on its exercises, sets and weights first, with Start at the bottom (#976, thanks @b225ccc for the idea, idea also by @bedirhanKC in #569).
- [ ] [1.4.5:319](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L319) Two routines on one weekday can stay apart: in Plan, tap the day and pick Separately, and Home shows each with its own Start and its own Done, a run in the morning and ankle work at night (#908, thanks @wintersrd for the idea).
- [ ] [1.4.5:320](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L320) Pause a workout: ⋯ → Pause workout stops the clock, the rest and a hold, with their alerts, until you tap Resume (or log a set). The pause stays through a reload, the Apple Watch clock stands still with it, and the time paused is not counted in the workout's length (#976, thanks @b225ccc for the idea).
- [ ] [1.4.5:321](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L321) Muscles (Exercises → Muscles, and By muscle when adding one): pick several muscles and see what trains all of them, or any of them, and pick a whole group (Chest, Back, Shoulders, Arms, Core, Legs) that opens into its muscles (#885, thanks @rt-oliveira, and #900, thanks @lodepav, for the ideas).
- [ ] [1.4.5:322](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L322) Cardio by distance: tap the Speed heading on a cardio exercise to log the distance instead (km, or miles with mph). The speed and the pace are worked out from the distance and the time, and the history, the CSV and FIT exports and the Health Connect notes carry the distance you typed (#887, thanks @rt-oliveira for the idea).
- [ ] [1.4.5:323](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L323) Machines per gym: tell a profile which machines your gym really has (leg press yes, leg extension no) in Settings → Equipment → the profile → Machines, or just tap "Not at my gym" on a machine exercise in the picker, a swap, the Library or a Coach suggestion and it is gone, with Undo. The library, swaps, routine flags, starter plans and the Coach all stick to it; a profile you never touch keeps working exactly as before (#923, thanks @hamidrezahanafi for the idea and the research).
- [ ] [1.4.5:324](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L324) Selected text and the typing cursor wear your accent colour now, also the little selection handles on Android (#980).
- [ ] [1.4.5:325](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L325) One weight step for everything: Settings → Units → Weight step sets it for every exercise at once (0.1 up to 5 kg or 10 lb), and Apply to all exercises tells you how many own steps it replaces before it does. Any exercise can still have its own, now down to 0.1, and fine steps stay clean numbers (52.3, never 52.300000001).
- [ ] [1.4.5:326](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L326) Log a set from the Home Screen widget, on Android and iPhone: during a workout it shows the set you're on with − and + for the weight and reps (or seconds), stepping the way that exercise does (its own step, your dumbbells, twos per side), and a Log set button. The app picks the set up the next time it runs, or right away when it's open, never twice, and the Lock Screen's Live Activity moves on with it (idea also by @parthpatyl in #299).
- [ ] [1.4.5:327](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L327) Our own icons instead of the phone's emoji, wherever the app still had some: the warm-up flame in Focus view, the trophy on share cards and in Wrapped, the advent calendar's doors and medals, the heart rate. They take your accent and look the same on every phone. Prefer the emoji? Settings → Look & Home → Icons → Emoji brings them back, also for the streak flame, the freezes and the medals.
- [ ] [1.4.5:328](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L328) Form and exercise videos can be bigger: a clip over 12 MB is shrunk on your phone first (to 1280 px, the button counts up while it works), and the server takes up to 100 MB instead of 40. Self-hosting? MEDIA_VIDEO_MAX_MB and MEDIA_UPLOAD_MAX (now 112m) set it, see docs/SELF_HOSTING.md.
- [ ] [1.4.5:329](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L329) Your own sounds: Settings → Sound → Add a sound takes an MP3, M4A, WAV or OGG, trims the silence, keeps up to 30 seconds and plays it at the end of a rest, or of a hold (each can have its own). It rings in the app, on the locked phone and in the iPhone notification, and comes along to your other devices.
- [ ] [1.4.5:330](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L330) A profile picture: Settings → Account → Profile picture takes a photo from the camera or your library (drag and zoom to frame it) or one of a dozen icons. It is shrunk to a small square on your phone with the location and camera details stripped, follows your account to your other devices, and nobody else sees it, admins included. No picture, no problem: your initial stays (thanks dreeper999 for the idea).
- [ ] [1.4.5:331](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L331) Finished early? The next Start asks once whether to begin with the exercises you didn't get to, then today's plan as usual. The start picker offers it on top too, and "Just today's plan" lets them go for good (#985, thanks @xwr3 for the idea).
- [ ] [1.4.5:332](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L332) New exercises start with your numbers: Settings → Workout → New exercises start with sets the sets, reps and hold seconds an exercise gets when you add it (2 × 8 if that is your thing, instead of 3 × 10). Thanks thedyude for asking.
- [ ] [1.4.5:333](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L333) The "rest's over" notification names the set waiting: "Rest's over: Bench press, 80 kg × 8" (or "Plank, 45 s", "Treadmill, 20 min"), on Android, iPhone and in the browser's push, so you can load the bar before you even look (thanks ayeeebroham and mattiaoinzz for the idea).
- [ ] [1.4.5:334](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L334) Check-in: when a scan or a photo can't read your gym card, you can now type the number instead. EAN and UPC numbers have to pass their check digit, the others you type twice, and the code is drawn big so you can hold it next to the card. A typed card reminds you once to give it a test run at the turnstile (#550).
- [ ] [1.4.5:335](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L335) Cardio: how hard it felt is now a little chip right under the row (and on the Focus card): "Rate it", then "RPE 7" in its effort colour. It used to hide in the set menu where nobody found it (thanks thehypetrainhobo for saying so). Switch Effort off in Modules and the chip goes too.

#### One green, the real logo, routine links

- [ ] [1.4.5:338](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L338) New installs start in openGym green, the same green as the logo, and "openGym green" leads the colour picker. Already picked a colour, or kept the old default? Nothing changes for you, on the watches, widgets and the Live Activity either. The old one is still there as Classic green.
- [ ] [1.4.5:339](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L339) The openGym logo is the real one everywhere: the web app, iPhone, Apple Watch, Android, Wear OS, Garmin, Zepp and the share cards.
- [ ] [1.4.5:340](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L340) Routine links like on Spotify: a routine page from opengym.ch/routines (tapped, or its QR scanned with the camera) opens openGym, ready to import with the author's name on it. Plan → Scan a QR code reads routine and sticker codes right in the app.

#### Share your workout, your way

- [ ] [1.4.5:343](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L343) The share card is new: Classic now fills the whole picture instead of sitting in a rounded box on black, Photo puts the numbers on a photo of yours, Lifts lists your best set of each exercise, and Sticker is a see-through PNG to lay over a picture you already have in Instagram (thanks Sharan for the idea, and w3ndo, ayeeebroham and seals187 for asking).
- [ ] [1.4.5:344](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L344) Your photo: pick one from the workout, the gallery or the camera, drag and pinch it into place. It stays on your device, and the picture that leaves carries no location or camera data.
- [ ] [1.4.5:345](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L345) Switch each part on or off: title, date, duration, volume, sets, PRs, exercises, muscle map, streak, heart rate and the logo. Stories keep clear of Instagram's own buttons, and there is a 4:5 size for the feed next to the 9:16 story and the square.

#### Small things you asked for

- [x] [1.4.5:348](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L348) Bikes, rowers, cross trainers and steppers get a resistance level (1 to 30) where a treadmill has its incline: in the set row, the focus view, the routine as a starting point, and in the history as "Level 8" (thanks mimesis_98178 and shadowzgz on Discord).
- [x] [1.4.5:349](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L349) The resistance level travels in the CSV export too (a resistance_level column), and the import reads it back, from our file or any other that has a "Resistance level" column.
- [ ] [1.4.5:350](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L350) The compact workout layout shows a small still of each exercise beside its name, so you can tell the machines apart at a glance; a tap opens How to do it (thanks imacrackers on Discord).
- [ ] [1.4.5:351](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L351) Rest before the next exercise: give the walk to the next machine its own break, for every exercise in Settings → Workout → Rest, or per exercise in its settings. Untouched, it rests like the work sets, as before (D#487, thanks @YannLoreth).
- [ ] [1.4.5:352](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L352) Folders for routines: give a routine a folder in its settings (a block, a goal, or Archive) and Plan lists it under a header that folds away. Archive starts folded, and each folder stays open or shut the way you left it (thanks adam934912, zkssyth, krakenkitty88 and @spantelis03).
- [ ] [1.4.5:353](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L353) Google Play: the app offers the sharper exercise animations once, at the first start on Wi-Fi with room to spare, in the quality that fits your screen and with its size. Later means later, nothing downloads unasked, and Settings has it any time.
- [ ] [1.4.5:354](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L354) Stats: under Lifted in total you now get your all-time workouts, sets and hours, plus a sense of scale ("About 8× a blue whale", thanks seconds21ive on Discord).
- [ ] [1.4.5:355](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L355) Stats: Cardio this week adds up your cardio, with the seven weeks before it. Sport you log or bring in from Apple Health, Health Connect or an import counts too. Set your own weekly goals, as many as you like: any cardio or one activity (running, cycling, swimming, walking, the rower, the stairs and more), in minutes, distance or sessions. 150 minutes is still the suggestion, and a goal you already set stays (D#84, thanks @turdutra).
- [ ] [1.4.5:356](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L356) Searching "plank" opens on the front plank instead of jack plank and five cousins, and "crunch" and "row" open on the everyday one too (thanks ad08008 on Discord).
- [ ] [1.4.5:357](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L357) Notes come over whole when you import from Hevy, Strong, FitNotes and friends: no more cut at 280 characters, and any note in the app can now run to 2,000 (D#876, thanks @MiquelAlvarez).

#### Advent calendar, reworked

- [ ] [1.4.5:360](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L360) The advent calendar is now a gym thing: every door is something to do (or a number from your own year), each open door hangs a bauble on a little tree, and training that day lights it up. Swipe the doors open. What is behind them stays a surprise until 1 December.
- [ ] [1.4.5:361](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L361) Christmas shows up only in December now, every year, and it brought friends: a lot more to spot around the app, and someone with a shiny nose who likes hide and seek.

#### The streak, explained (and yours to style)

- [ ] [1.4.5:364](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L364) The calendar now shows how your streak counted, week by week: a flame for a week that counts, a freeze for a missed week a freeze covered (that week gets a frosty wash too), a ring for a missed one and a dashed ring for this week, still open. Tap a mark and it tells you why.
- [ ] [1.4.5:365](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L365) A planned day that went by without a workout gets a hollow dot (Missed plan) instead of looking like a day still to come. Tap it and it says what that meant for the week, which still counts if you trained another day. A trained day that was moved keeps a little orange ring.
- [ ] [1.4.5:366](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L366) Pick how forgiving your streak is: No freezes (miss a week, start over), Gentle (one freeze, so two missed weeks in a row end it) or Generous (up to two, the rule so far). New profiles choose on Home, with Gentle ready; everyone else keeps Generous until they change it in Settings → Look & Home → Streak freezes. A new rule counts from the week you save it, the weeks already counted stay as they were, and the calendar says from when. The watches, widgets and recaps show the same number.
- [ ] [1.4.5:367](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L367) On top of the calendar: what the number counts (weeks in a row with at least one workout), your freezes and how the next one is earned, and the first time, four short lines on how it all works. Stats → Week streak says it too, with How streaks work one tap away.
- [ ] [1.4.5:368](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L368) Settings → Look & Home → Icons: pick your own streak flame and freeze, from openGym's icons or any emoji. The colors around it (the flame's glow and bar, the frozen week, the freeze chips) follow its color in light and dark mode, and Reset to default is right there. Syncs like the rest of your settings; the watches and widgets keep their own flame.

#### Android and Health

- [ ] [1.4.5:371](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L371) Android: the workout you are doing lives in one notification now. It shows the exercise, the set and its target, the time since you started and how far along you are, with Log set and Next exercise right there. Log set works with the app closed and starts the rest, the rest counts down in that same notification with the next set on top, and finishing or discarding the workout takes it away. On Android 16 it is a Live Update, the little chip by the clock (#760, idea and first version by @Andrew-A-A (#874)).
- [ ] [1.4.5:372](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L372) Health Connect gets your sets, not just the session: each set is its own segment with the move (bench press, squat, lat pulldown and a few dozen more, the rest as weightlifting) and its reps, so other apps can show what you actually did. Workouts already written are rewritten once with them (#654, idea and first version by @finngrr in #816).
- [ ] [1.4.5:373](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L373) Body composition from your scale: switch on Settings → Health → "Body composition from your scale" and Body measurements shows the latest body fat, lean mass, bone mass and BMR your scale saved to Health Connect, with the change over the last month. On the iPhone it reads body fat and lean mass from Apple Health. Read-only and on this phone only, so it never fights with what you log yourself (idea by @baron-de-ropp (#197) and @TheBlackSide243 (#589)).

#### The last round of polish

- [ ] [1.4.5:376](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L376) Settings opens on headed groups (Training, Set once, Connections, then data and About), the watches share one Watches row, the Apple Health links land where the switches are, and search finds every row, the WebDAV backup and six more included (#1109, #1120, #1122, thanks @cubetes).
- [ ] [1.4.5:377](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L377) Your own exercise names show exactly as you typed them, in every language and on a friend's routine link ("am Turm" stays "am Turm"), and Home shows today's routine name as typed too.
- [ ] [1.4.5:378](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L378) Number fields use your language's decimal separator, comma or point, like the text next to them.
- [ ] [1.4.5:379](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L379) New cardio starts at a pace that fits: a walk at 5 km/h (3 mph), a bike at 20. Running stays at 8.
- [ ] [1.4.5:380](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L380) The finish summary lists timed holds under "Last time and next time" ("0:45, 0:45, 0:45"), and names band colours ("12 × Red") the way History does. A carry's plan line shows its own distance instead of 20 m.
- [ ] [1.4.5:381](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L381) The workout's chips fill as you tick sets, with room under the chip row, and the steppers, ticks, Finish and Add set got 44 px tap targets (thanks @cubetes in #1075).
- [ ] [1.4.5:382](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L382) A paused workout lets the screen sleep.
- [ ] [1.4.5:383](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L383) Exercise settings stop Sets at 50 and Reps at 1000, so a typo can no longer build a 999-row workout.
- [ ] [1.4.5:384](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L384) Plan with no routines offers New routine next to the starter plan, and Explore muscles opens without a freeze.
- [ ] [1.4.5:385](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L385) "How much app do you want?" waits until you are not in the middle of something, so it never lands on top of a sheet you just opened.
- [ ] [1.4.5:386](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L386) Screen readers: sheets are real dialogs (named, focus inside, back where you were after), set fields, settings switches and the rest's 15 s buttons say what they are, buttons that repeat down a list say what they act on, and the body map has one button per muscle.
- [ ] [1.4.5:387](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L387) Light theme: the heatmap's months, the done green and the orange status words are readable.
- [ ] [1.4.5:388](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L388) Arabic and Persian: sets, weights and volumes keep their order ("25 kg × 10"), and line charts keep their labels beside the plot.
- [ ] [1.4.5:389](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L389) Run/walk moves up a level when the workout is saved, so a run you discard no longer counts, and the tempo guide counts one side's reps on a per-side set.
- [ ] [1.4.5:390](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L390) Fixed: routines asked for in the Coach chat wiped the weekly schedule.
- [ ] [1.4.5:391](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L391) Fixed: a backup file with a broken row imported fine and then took Home, History and Stats down.
- [ ] [1.4.5:392](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L392) Fixed: on Android, starting a workout or ticking a set could throw you into "Alarms & reminders", Scan a QR code did nothing without Google's scanner module, and Log set from the notification on a per-side exercise left the other side open. Danish says "Forrige" for Prev.
- [ ] [1.4.5:393](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L393) Fixed at the largest text size: a per-side weight clipped on narrow phones, the cardio speed did not fit at 360 px, and the Tools steppers lost their numbers.
- [ ] [1.4.5:394](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L394) iPhone: Animation quality names the iOS switch that pauses every animated image (Auto-Play Animated Images).
- [ ] [1.4.5:395](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L395) Exercise history counts Best and PR the right way round on assisted machines, and self-hosters get a Coach that survives a failed disk write and an MCP server that answers a too-big request properly (thanks @cubetes in #1073).
- [ ] [1.4.5:396](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L396) Catalogue: the leg press and hack squat no longer count the calves (#1034, thanks @cubetes in #1063), and the ab tuck's steps describe the captain's chair its picture shows (#958, thanks @cubetes in #1064).
- [ ] [1.4.5:397](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L397) Brazilian Portuguese reads Brazilian now: no more Portugal's words and forms, and real Brazilian gym words (thanks @lukol01 in #1067).
- [ ] [1.4.5:398](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L398) The APK's updater falls back to GitHub's API link when the download link on github.com fails, so an update no longer gets stuck there (thanks @lodepav in #1084).
- [ ] [1.4.5:399](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L399) The week and month recap picture keeps a long volume inside its tile (#1195), Your year pauses its glow while the Share sheet is open, so the phone has less to draw while it makes the picture (#1196, for #1103), and the tests pass in any timezone and in any order (#1197). Thanks @cubetes.
- [ ] [1.4.5:400](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L400) Rather not run a server? ElfHosted sponsors openGym and runs it for you, built from our tagged releases with no changes and a 7-day trial (README and docs/SELF_HOSTING.md). Your own server stays the first-class way.
- [ ] [1.4.5:401](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L401) opengym.ch/brand has the brand kit: the logo, icons, colours, banners and the brand guide to download.

#### Fixes from your reports

- [ ] [1.4.5:404](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L404) Cardio on a 320 px phone: a row with the incline pushed its tick off the card. Below 360 px the incline now takes a typed number without the − and +, and the tick is back.
- [ ] [1.4.5:405](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L405) Your own sounds come back from a backup with photos and videos too. They went into the zip, but the import left them out.
- [ ] [1.4.5:406](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L406) A routine's backup exercise gets its own plan: tap it under Backups to set its sets, reps, weight, rest and progression, and a swap mid-workout opens it at that plan (#978).
- [ ] [1.4.5:407](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L407) Android widget: it loads at every size again instead of "Unable to load widget" when stretched, and its "What to show" screen is wide enough to read (#981).
- [ ] [1.4.5:408](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L408) Body measurements: lengths in cm or inches whatever your weight unit (#932), and a custom measurement can be deleted.
- [ ] [1.4.5:409](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L409) iPhone: no more surprise "Undo" alert after carrying the phone around (shake to undo is off, #921).
- [ ] [1.4.5:410](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L410) Workout: Set current keeps the List view you picked instead of flipping back to Cards (#641).
- [ ] [1.4.5:411](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L411) Sheets close on a real pull down from the very top, not while you scroll a how-to back up (#897, thanks @ilirhushi in #1002).
- [ ] [1.4.5:412](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L412) Starter plans can have timed exercises: `[id, sets, seconds, 'time']` (#964, thanks @navid24601 and @mvanhorn in #996).
- [ ] [1.4.5:413](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L413) iPhone release: the build check now counts the animations themselves, so an App Store build can no longer ship with stills only (#962).
- [ ] [1.4.5:414](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L414) iPhone and Android release: the build now checks every animation and picture by name against what the app will ask for, both figures, right size, so a package missing even one refuses to be built instead of reaching your phone frozen (#962).
- [ ] [1.4.5:415](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L415) Android: a self-hosted server the app's web view cannot reach (home network, private certificate) is paired and synced through the app's own connection (#870).
- [ ] [1.4.5:416](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L416) The APK's Animation quality says sharper animations come through the stores, instead of "not on this device yet" (#863, thanks @TheBlackSide243 in #878).
- [ ] [1.4.5:417](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L417) Apple Health and Health Connect: workouts imported from Hevy, Strong and friends are no longer written a second time, and the copies written before are taken out (#881).
- [ ] [1.4.5:418](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L418) Sync: saving a workout without changing anything no longer brings back one deleted on another device (thanks @cubetes in #925).
- [ ] [1.4.5:419](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L419) Admin: the back arrow steps back the way you came instead of looping (thanks @cubetes in #924).
- [ ] [1.4.5:420](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L420) Italian: Pause fits next to Skip again (thanks @DomHeadroom in #969).
- [ ] [1.4.5:421](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L421) Warm-ups on an assistance machine explain themselves the right way round (thanks @radu781 in #864).
- [ ] [1.4.5:422](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L422) Workout: swapping an exercise while you rest keeps the countdown and its Skip on screen, instead of making them vanish until the next set.
- [ ] [1.4.5:423](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L423) Workout: a drop set ticked done greys out its drops (and a rest-pause set its bursts) along with it.
- [ ] [1.4.5:424](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L424) Week streak: when a freeze covers a missed week, the streak card on Stats now says which week it was, so a streak running across a gap you can see no longer looks like a counting error.
- [ ] [1.4.5:425](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L425) Zepp OS watch: the page is there on a phone without a server too, says why the watch needs one and connects you, the pairing code and the server address each get a copy button, and the page says plainly that openGym is not in the Zepp App Store yet, with the install guide.
- [ ] [1.4.5:426](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L426) AI Coach: a question in the chat sees your weigh-ins of the last four weeks, the ones from Apple Health or Health Connect included, instead of answering that it does not know your weight.
- [ ] [1.4.5:427](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L427) Apple Health and Health Connect: workouts logged on the phone now come with their active calories, an estimate from what you did, how long and your body weight (a sane 75 kg until you weigh in). If a watch measured the workout on the iPhone (any watch that saves to Apple Health), its calories go on instead. If you turned Health on before, openGym asks once for the calories permission (#724, D#917, thanks @justteshi and @mips6904; measured energy idea and first version by @davoloko in #434).
- [ ] [1.4.5:428](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L428) "Your last session" keeps the warm-ups you marked, also with progression off (#993, #1001, thanks @ilirhushi).
- [ ] [1.4.5:429](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L429) Windows: the bundle size script and the coach tests find their files again (#999, #998, #1000, thanks @lintuo and @fromcodetogold).
- [ ] [1.4.5:430](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L430) Android: the tab bar no longer slides under the navigation bar after a page load (#997, thanks @FrancescoDeSimone).
- [ ] [1.4.5:431](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L431) Android: "Rest's over" no longer rings a minute early with the phone locked, and the countdown card stays until the real end. Some phones hand the alarm over early; openGym now books it again for the right time (#995, thanks @ukizet).
- [ ] [1.4.5:432](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L432) Android: Create PDF no longer closes the app on phones without a print service. It says what is missing instead (#991, thanks @dagov42 for tracking it down).
- [ ] [1.4.5:433](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L433) Plates: the first plate line of a lift names the bar it counts with ("5 per side on a 20 kg bar"), and a weight under the bar says so instead of "Bar only". Logging without the bar? Set your bar under Equipment (thanks vitoralves9629 on Discord).
- [ ] [1.4.5:434](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L434) Home: the recovery card put away with its × comes back when you switch Recovery tips on again, and the × now says it is only for today, with Undo (thanks dnys8445 on Discord).
- [ ] [1.4.5:435](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L435) AI Coach: a self-hosted endpoint without /v1 that is briefly busy is tried again instead of failing as "not found" (#520, thanks @Bortlesboat).
- [ ] [1.4.5:436](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L436) AI Coach: a slow reasoning model behind a CDN (DeepSeek and friends) no longer fails at the 60 second mark. When an answer is cut off mid-wait, openGym asks again as a stream and keeps doing so for that endpoint (#546, idea and first version by @jijichen).
- [ ] [1.4.5:437](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L437) AI Coach: the time of a chat message follows the app's language, not the browser's (#515, thanks @casungo).
- [ ] [1.4.5:438](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L438) Stats: an exercise kept out of progression is kept out of the statistics too, while a deload's workouts still count (#813, thanks @lodepav).
- [ ] [1.4.5:439](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L439) iPhone and Android: the tab bar names are 11 px, the smallest size Apple's guidelines allow (#710, thanks @olestrr).
- [ ] [1.4.5:440](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L440) Rotation and day reminders: a routine named "Push + Pull" counts as done by its whole name, a workout dated in the future has not happened yet, a week without a date is not read as finished, and an old state file with an empty workout no longer stops the day reminder (#567, thanks @kurktchiev).
- [ ] [1.4.5:441](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L441) Import from Hevy: 429 of Hevy's templates now land on the exercise their own artwork shows, up from 297, so far fewer come in as custom exercises (#807, thanks @lodepav).
- [ ] [1.4.5:442](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L442) AI Coach: a scheduled review that fails for a reason trying again will not fix (a refused key, a missing runtime) no longer gets queued every minute until the day's limit is gone. A passing hiccup waits a quarter of an hour, so the real slot still finds room (thanks adam934912 on Discord, idea and first version by @radu781 in #983).
- [ ] [1.4.5:443](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L443) Calendar: on the 1st of a month west of UTC it opens on that month, not the one before (thanks @TheViniAlmeida in #497).
- [ ] [1.4.5:444](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L444) AI Coach: a running programme's week follows the job's clock, not the machine's (thanks @TheBlackSide243 and @kurktchiev in #975).

#### Shared devices and small fixes

- [ ] [1.4.5:447](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L447) WebDAV backup belongs to the account that set it up: when someone else signs in on the same phone or browser (or uses it as a guest), nothing goes to the first person's folder and nothing of theirs can be restored. The sheet says "This backup belongs to another account" and offers Disconnect.
- [ ] [1.4.5:448](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L448) Signing out on a phone drops the Coach's waiting proposal, a plan made from the signed-out account's log. The Coach's setup and key stay.
- [ ] [1.4.5:449](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L449) Delete workouts only says that activities (runs, rides, matches) stay, like recovery sessions. They always did.
- [ ] [1.4.5:450](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L450) Indonesian and Vietnamese: equipment, badges, "Per gym", Mini-set, Pace and friends are translated instead of left in English.
- [ ] [1.4.5:451](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L451) Home no longer says "All done this week" while today's planned routine is still waiting, even when extra workouts earlier in the week reached the count.
- [ ] [1.4.5:452](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L452) Settings: a worded value next to a long title and subtitle ("Wie die Arbeitssätze") sits under the text on a phone, instead of squeezing the title into a narrow column.

#### Thanks we owed

- [ ] [1.4.5:455](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L455) Timed holds that run themselves (1.4.4): idea and first version by @kurktchiev (#490).
- [ ] [1.4.5:456](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L456) Ask the Coach mid-workout (1.4.4): idea and first version by @bbolinger (#852).

#### Community: share with your server, if you like (self-hosted, `LIBRARY=on`, off by default)

- [ ] [1.4.5:459](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L459) Exercises, plans and routines, sounds, gym equipment profiles, tips, looks and measurement fields you made can be shared with everyone on your server. Nothing is shared unless you pick it and say yes, one item at a time, after a short consent: it is public to everyone on this server, and it is yours to share.
- [ ] [1.4.5:460](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L460) Exercises → Community (or Settings → Account → Community): a tab per kind, search, New and Popular, a preview (play a sound, see the picture, the routines of a plan) and Get, which copies it into your profile. Every card says who shared it and when, always. Your copy is yours: it stays when the original stops being shared, and a new version shows up next to it instead of over it.
- [ ] [1.4.5:461](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L461) Tips from your gym: the exercise sheet shows what others on your server wrote about it, one tap from your own note. Your profile picture can sit next to your name on what you share, if you switch it on.
- [ ] [1.4.5:462](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L462) Report anything that does not belong there. Three reports, or one about licensed material, take it out of sight until an admin looks. Admins get a Community card to approve, hide, restore or remove (which takes the copies' files too) and to pause sharing for a person, every step with a reason in the activity log. `SHARE_REVIEW=on` makes every new item wait for an admin first.
- [ ] [1.4.5:463](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L463) The exercise pictures and animations of the built-in library are licensed and can never be shared: the server knows every one of them by its checksum. Shared photos lose their location and camera details, videos go up to 25 MB, sounds up to 30 seconds. Workout and progress photos have a switch of their own (`SHARE_PERSONAL_MEDIA=on`, off by default) and always wait for an admin.
- [ ] [1.4.5:464](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L464) Idea and first version by @davoloko (#441, sharing custom exercises with everyone on a server), rebuilt here into the wider library.

#### Admins see counts, not your training

- [ ] [1.4.5:467](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L467) Behaviour change: the admin dashboard no longer opens anyone's workouts and weigh-ins. A person's detail shows counts, storage and last sync, and the list no longer says when someone last trained or what they are training right now. The data is still readable on disk by whoever runs the server, just not in the app.
- [ ] [1.4.5:468](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L468) `ADMIN_DATA_VIEW=on` brings the old view back for small instances that want it, and then every look is written to the activity log and to that person's own sharing log.

#### Security

- [ ] [1.4.5:471](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L471) Sync: an answer from the server for the account you just left (another sign-in, a sign-out, a new server) can no longer land in the account you switched to, or be sent on in its name (GHSA-656w-p99j-x8hf, thanks Tiestow for the report).
- [ ] [1.4.5:472](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L472) Media sync: a photo or video still uploading from the account you just left can no longer land in the one you switched to (GHSA-699c-6p5r-q574, thanks @natgreenwood for the report).
- [ ] [1.4.5:473](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L473) Deleting your account takes everything with it now: the Coach's own notes on you (plans waiting for a yes, its history) stayed on the server before, and what you shared with the community library lingered for two weeks. Copies other people took stay theirs.
- [ ] [1.4.5:474](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L474) The connector sign-in for Claude and ChatGPT counts how often one address registers or starts a sign-in, so nobody can flood the server with them.

#### Community: new languages, a sharper catalogue and a calmer Coach

- [ ] [1.4.5:477](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L477) Four new languages: Bahasa Indonesia (thanks @m-ridha in #965), Vietnamese (thanks @langpn in #606), Czech with exercise names and steps (thanks @LiberaFatum in #576) and Persian, right to left, with exercise names and steps (thanks @SeyedHashtag in #856, and @iarash84 for the first Persian draft in #399). What the app learnt since they were written is translated too.
- [ ] [1.4.5:478](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L478) Lithuanian: the whole app speaks Lietuvių now (thanks @evaldass in #535). Everything added since it was written is translated too.
- [ ] [1.4.5:479](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L479) Chinese: every exercise has its Chinese name, description and steps now (thanks @nine-orders in #959), and no two exercises share a name any more (thanks @daoshi818-crypto in #629).
- [ ] [1.4.5:480](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L480) French: descriptions and steps for 40 everyday gym exercises (thanks @Neoko-First in #935).
- [ ] [1.4.5:481](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L481) Exercise details show each muscle's share in percent, the rest folded into a tappable Other (thanks @sg41 in #954).
- [ ] [1.4.5:482](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L482) An exercise you pick starts the way you logged it last time: as a timed hold, per side, or both (thanks @lodepav in #902).
- [ ] [1.4.5:483](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L483) A search filtered by your gym says how many matches it hid, with one tap to show all equipment (thanks @lodepav in #905).
- [ ] [1.4.5:484](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L484) Catalogue: the dumbbell neutral grip bench press is the triceps press its drawing shows (#918), and half knee bends are the cardio knee lift their drawing shows, not a squat (#559).
- [ ] [1.4.5:485](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L485) Coach: MiniMax is one of the providers you can pick (thanks @octo-patch in #912).
- [ ] [1.4.5:486](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L486) Coach: a failed job says what actually failed: the key, the quota, the request format, an outage or the network, each with its own line (thanks @omeliorator in #971).
- [ ] [1.4.5:487](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L487) Coach: OpenRouter with Claude works again instead of "the answer had no choices": an error that arrives inside a 200 answer now gets the same fallbacks as any other (#973).
- [ ] [1.4.5:488](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L488) Coach: a plan's week is spelled out day by day, so strict JSON Schema endpoints (Codex OAuth gateways, #828) no longer hand back an empty week, and Gemini gets a schema it can read (thanks @omeliorator in #970, and @TheViniAlmeida, who had the idea first in #537).
- [ ] [1.4.5:489](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L489) Coach: an endpoint with a key is never pinged to keep warm, since that costs money and warms nothing (thanks @omeliorator in #968).
- [ ] [1.4.5:490](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L490) Coach: exercise ids sent as 24 or "24" are read as "0024" (thanks @dagov42 in #963), reasoning models' <think> blocks are skipped (thanks @polidisio in #929), and MiniMax's schema complaint falls back to plain JSON (thanks @polidisio in #928).
- [ ] [1.4.5:491](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L491) Coach: longer answers before a cut, and a cut lands on a sentence or a word (thanks @maliv2 in #937).
- [ ] [1.4.5:492](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L492) Coach: "swap it for what you suggested" finds what was suggested, and a clear request is acted on even without a stall (thanks @joshiparth1000 in #819).
- [ ] [1.4.5:493](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L493) Italian: every exercise has its steps in Italian now, a few app texts read more naturally, and the Android rest channels and the iPhone's camera and microphone prompts speak Italian too (#513, #517, thanks @casungo).

### v1.4.4


#### Modules: as much app as you want.


#### Integrations, all in one place.


#### Webhooks


#### On its way to F-Droid.


#### openGym on Amazfit watches


#### A fresh coat of paint.


#### openGym on Garmin, almost.


#### Every set against last time


#### Workouts left this week


#### Spoken cues.


#### Merge two exercises into one


#### A note on any set.


#### Weekly sets per muscle, against a target range.


#### Strength level per lift.


#### Your week, your month.


#### openGym on your Wear OS watch, as a beta


#### Warm-ups that build themselves


#### Your own warm-ups, kept


#### Ask the Coach mid-workout.


#### The Coach does more.


#### Film a set and check your form.


#### Each gym keeps its own equipment


#### Christmas, with an advent calendar.


#### Weigh in as often as you like, with the time


#### Monthly challenges.


#### A kind word about recovery on Home.


#### Your year in openGym.


#### Share a workout as a picture, right after it.


#### Widgets you set up yourself, and a streak with backup.


#### Share a routine with a friend.


#### Watch on YouTube, for every exercise.


#### Tidier menus


#### Timed holds that run themselves.


#### A 1-minute tour, and four tutorials.


#### Pictures on the printed plan


#### Programmes


#### kg and lb in the same gym


#### Your own app icon on Android too.


#### Back to the top, fast.


#### Adding your gym works like a maps app now


#### AI Coach works with picky OpenAI-compatible gateways


#### "Is that right?" before a likely typo


#### Dates pick like the rest of openGym


#### The installed iPhone web app fills the screen


#### Tap the picture in a past workout for the how-to


#### Discarded means discarded, also in Apple Health


#### Server dependencies patched


#### How long each exercise takes


#### Pull-ups count your body weight, if you want


#### Every exercise under the muscle it's known for


#### your recovery, fatigue and muscle balance numbers will shift


#### "Your last session" brings your warm-ups too


#### YouTube demos play right in the app


#### Swap suggestions


#### AirPods Pro 3 count your heart rate, no Apple Watch needed

- [ ] [1.4.4:930](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L930) **Self-hosting: containers report healthy in half a minute**, not after five. TrueNAS and friends

#### Tap your phone on a sticker


#### Hey Siri, log my weight.


#### Exercise names in European Portuguese and Swedish.


#### Safer servers.


#### Fixes

- [ ] [1.4.4:960](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L960) The rest timer starts after the last set of an exercise again, also when the next exercise opens with warm-ups (#853).
- [ ] [1.4.4:961](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L961) A per-side set with its own "Rest after this set" now takes that break between its sides too (#853).
- [ ] [1.4.4:962](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L962) Ask the Coach for more core (or arms, legs, glutes...) and its review gets a real choice of those exercises, not the same four, plus room for new ones beside your plan (#829).
- [ ] [1.4.4:963](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L963) iPhone app: the rest sound no longer pauses your music. It turns it down for a moment and lets it play on, also with Play even on silent.
- [ ] [1.4.4:964](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L964) **Searching a muscle shows the lifts people do**: "chest" opens on the bench press, flyes and dips, "back" on rows and pulldowns. Stretches only lead when you search for a stretch.
- [ ] [1.4.4:965](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L965) Apple Watch: the forgotten-workout check no longer ends a workout you are logging on the iPhone (#904, thanks @gkitayama). Ticks, edits and opening the app on the phone count as the workout going on, the watch asks the phone before it ends anything (and only asks "All done?" when it can't reach it), and the phone keeps a workout running when the watch's finish is older than its own sets.
- [ ] [1.4.4:966](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L966) Freestyle tells the truth about progression (#910, thanks @soldsawn): adding an exercise says it repeats what you did last time instead of offering "Follow the routine (Linear progression)", and a freestyle exercise's settings mid-workout say No rule and keep your numbers instead of quietly adding a linear step. Pick a rule there and it applies to that workout.
- [ ] [1.4.4:967](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L967) AI Coach with newer OpenAI models and Azure OpenAI: no more "400 Unsupported parameter: 'max_tokens'" (#869, thanks @tapanmeena). The OpenAI-compatible endpoint sends max_completion_tokens to OpenAI's reasoning models and Azure, switches field once if an endpoint says otherwise and remembers it, and an Azure Responses URL gets told the base URL that works.
- [ ] [1.4.4:968](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L968) The phone's own Coach can talk plain http:// to a model on your home network (#913, thanks @pgavrilov): 192.168.x.x, 10.x, 172.16 to 31.x, Tailscale's 100.x, .local names, localhost and private IPv6. Anything on the internet still needs https://.
- [ ] [1.4.4:969](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L969) Cards and rows with a button of their own (the × on Your week, Add to my plan in the exercise list, the picker's quick add) stop fighting it: a tap on or near the × only puts the card away, the rest of the card opens it, the card no longer squishes when you press the ×, and screen readers hear two clear buttons instead of one tucked inside the other.

#### Bring your history from more apps

- [ ] [1.4.4:978](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L978) **Done is right under the numbers** when a workout ends, no scrolling past the body map and the photo corner to leave.

### v1.4.3


#### openGym starts again on iOS 15.5 to 16.3


#### Gym reminder


#### See what a session hits before you start it.


#### Export as a spreadsheet


#### Keep what you added


#### Halloween.


#### Pick your own app icon


#### In the workout

- [ ] [1.4.3:1043](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1043) **Machine taken? One tap to your backup** (#649). A routine exercise with planned backups lists
- [ ] [1.4.3:1047](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1047) **Machines with odd weight steps** (#688). A machine or cable exercise has a Weight stack under
- [ ] [1.4.3:1051](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1051) **Volume while you lift.** The progress bar at the top of a workout ends in the session's volume,
- [ ] [1.4.3:1054](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1054) **"No timer" for a single exercise.** Rest for this exercise has the same three choices as the
- [ ] [1.4.3:1057](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1057) **Rest after this set**: tap a set's number and give just that set its own rest for today, a
- [ ] [1.4.3:1059](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1059) **The rest wheel starts where your rest is.** Pick a time opens on the rest that applies right
- [ ] [1.4.3:1062](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1062) A timed per-side hold can drop its 10 second switch-sides pause without losing the set's rest
- [ ] [1.4.3:1065](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1065) **Rate your cardio** (Discord). A cardio set's menu (tap the set number) has How hard it felt,
- [ ] [1.4.3:1068](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1068) **Exercises start the way you do them.** A plank, a wall sit or a dead hang starts as a timed
- [ ] [1.4.3:1074](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1074) **"No automatic progression" remembers what you did** (#217, thanks @iggaM23). With Settings →
- [ ] [1.4.3:1079](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1079) **"Last time" can mean any workout** (#770). Bench on Monday and Thursday? Settings → Workout →
- [ ] [1.4.3:1083](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1083) **Count warm-ups in volume**, if you like (#719). A switch in Settings → Units & language adds
- [ ] [1.4.3:1086](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1086) **Discard workout is harder to hit by accident.** It lived at the bottom of the workout's ⋯ menu
- [ ] [1.4.3:1089](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1089) **Rest days in the rotation**, and the same routine more than once (A → B → C → B → D): Add
- [ ] [1.4.3:1091](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1091) A treadmill's incline can be set in the routine, not only mid-workout. The session opens at it
- [ ] [1.4.3:1093](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1093) Focus mode: the exercise's ⋯ menu has Add set and Add warm-up set, and Focus stays on the screen
- [ ] [1.4.3:1095](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1095) In the Compact and List layouts the exercise chips at the top follow along: the one you tap lights
- [ ] [1.4.3:1097](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1097) Collapse completed exercises: a finished exercise folds up and the ones after it move up with it,
- [ ] [1.4.3:1099](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1099) Add exercise → By muscle has the Favourites chip too, for the muscle you picked (#669).

#### Apple Watch and the Lock Screen

- [ ] [1.4.3:1102](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1102) **Next exercise and Skip rest on the Lock Screen** (iPhone, Discord). The Live Activity and the
- [ ] [1.4.3:1107](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1107) **RPE and RIR on the watch.** If you rate your sets, the set page has a little effort disc next
- [ ] [1.4.3:1110](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1110) **A 3-2-1 before a watch workout** (#789, thanks @cubetes) while the heart-rate sensor warms up,
- [ ] [1.4.3:1112](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1112) **Forgot to hit Finish?** (#790, thanks @cubetes). After 20 minutes without a set the watch taps
- [ ] [1.4.3:1115](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1115) **Discard, properly** (#776, #783, thanks @cubetes). Finish workout? on the wrist offers Discard
- [ ] [1.4.3:1118](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1118) **No more ghost sets in supersets** (#791, thanks @cubetes). When the watch flips to the partner
- [ ] [1.4.3:1121](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1121) **Lock the watch mid-workout** (Water Lock, like Apple's Workout), so a sleeve or a bent wrist
- [ ] [1.4.3:1123](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1123) **Bigger numbers and a calmer crown.** Weight and reps are larger, Done is easier to spot, the
- [ ] [1.4.3:1126](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1126) **The watch keeps up.** It could miss the phone right after launch, a fresh install could wait
- [ ] [1.4.3:1130](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1130) A set ticked on the phone while the watch runs the session gets its heart rate from the watch too.
- [ ] [1.4.3:1131](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1131) Exercise names on the Lock Screen, in the Dynamic Island, on the watch and in the widgets are
- [ ] [1.4.3:1133](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1133) After a long run of Lock Screen taps with the app asleep, the Live Activity said "All sets done"
- [ ] [1.4.3:1135](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1135) One "Rest's over" on iOS: the end of a rest could leave two identical banners stacked (#728,

#### Apple Health and Health Connect

- [ ] [1.4.3:1139](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1139) **Your watch's heart rate and other apps' weigh-ins come in** (#544, #127). Two new switches next
- [ ] [1.4.3:1145](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1145) **A year of weigh-ins from Health Connect** (Android, idea from #801, thanks @antoni-heredia).
- [ ] [1.4.3:1148](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1148) **A run is a run** (#799, thanks @svillar). A workout that was only running used to land as
- [ ] [1.4.3:1152](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1152) **Imported weigh-ins stay put.** Weigh-ins you import (an Apple Health export, a Google Health or

#### Your body and your stats

- [ ] [1.4.3:1157](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1157) **Lifts against your body weight** (#729, thanks @radu781). Exercise progress in Stats and an
- [ ] [1.4.3:1161](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1161) **Your weekly rate, with a corridor** (#759). Under the body-weight chart on Home and in Stats:
- [ ] [1.4.3:1165](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1165) **Fatigue, in numbers.** Tap a muscle on Stats → Fatigue for its fatigue in percent on a little
- [ ] [1.4.3:1168](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1168) **Custom measurements get their own unit** (#699, #718, thanks @zykll18): %, kg or lb, cm or in,
- [ ] [1.4.3:1171](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1171) **Lifted in total.** A new Stats tile with everything you've ever lifted, imports included.
- [ ] [1.4.3:1173](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1173) **Deleted a weigh-in by mistake? Undo**, on the log sheet and in All weigh-ins (#756).
- [ ] [1.4.3:1174](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1174) **Muscle balance**: tap a muscle you haven't trained right on the map and its row offers the
- [ ] [1.4.3:1176](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1176) Chart dates say each day once over a short span, and months get their year once a chart covers

#### The Coach

- [ ] [1.4.3:1180](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1180) **It answers questions.** "How many sets of dips is that?" in the chat gets an answer in words
- [ ] [1.4.3:1182](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1182) **It remembers both devices** (#779, thanks @Klein225). With the Coach open on two devices the
- [ ] [1.4.3:1185](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1185) **A Coach plan goes into your rotation** (#778, thanks @Klein225) instead of the weekly schedule
- [ ] [1.4.3:1187](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1187) **Automatic reviews on a phone with its own key finally happen**, while the app is open: right
- [ ] [1.4.3:1190](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1190) **One tap away for admins** (#683, thanks TheBlackSide243): an AI Coach row in Settings opens
- [ ] [1.4.3:1192](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1192) Gemini works with a fresh AI Studio key again: the default is Gemini 3.8 Flash, and a model your
- [ ] [1.4.3:1195](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1195) OpenRouter and other hosts that insist on strict JSON schemas stop failing with
- [ ] [1.4.3:1198](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1198) A phone with your own key gets Advanced: the daily runs (0 for no limit, handy with a model on
- [ ] [1.4.3:1201](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1201) Cardio the Coach prescribes on a non-cardio exercise (kettlebell swings for 15 minutes) stays 15
- [ ] [1.4.3:1204](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1204) The questionnaire's weekdays follow the number of training days, and days you picked yourself

#### Exercises and equipment

- [ ] [1.4.3:1208](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1208) **Call an exercise what you call it** (#624, thanks Space-Hermes). "Add another name" gives it
- [ ] [1.4.3:1211](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1211) **"I own no dumbbells"** (Discord). Settings → Equipment → Dumbbells has a switch for it, since
- [ ] [1.4.3:1215](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1215) Equipment profiles know more: an inverted row needs a bar (unless it's the under-the-table kind),
- [ ] [1.4.3:1218](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1218) Your lats show up as "Lats & upper back" in Stats, on the body map and in the muscle picker (#607,
- [ ] [1.4.3:1222](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1222) German step-by-step instructions for 1,213 more exercises, so everything from before v1.4 explains

#### Getting around

- [ ] [1.4.3:1227](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1227) **Back means back.** A page's own back button returns you where you were scrolled, like the edge
- [ ] [1.4.3:1230](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1230) **Android back stops touring your tabs.** On a tab, Back goes straight to "press again to exit"
- [ ] [1.4.3:1232](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1232) **Settings slides like Settings**: in from the right, back from the left. The tabs keep their fade.
- [ ] [1.4.3:1233](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1233) **iPhone first start**: the permission screens have one Continue that leads straight to the
- [ ] [1.4.3:1235](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1235) **Faster on long histories.** Home and Stats do far less work per open (Stats about a third less
- [ ] [1.4.3:1238](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1238) **Increase Contrast and Reduce Transparency are honoured** (#707, #708, thanks @olestrr): firmer
- [ ] [1.4.3:1240](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1240) **"Where's my code?"** (#551, thanks @Maximrabd). Signing a computer in with a code from your
- [ ] [1.4.3:1243](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1243) **Support openGym.** Settings → About & updates has the coffee jar: Buy Me a Coffee, Ko-fi and
- [ ] [1.4.3:1246](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1246) The install tip in About on a Windows or Linux browser points at Chrome's install icon, not at an

#### Languages

- [ ] [1.4.3:1251](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1251) **Hej, Sverige!** openGym speaks Swedish, from Settings → Units & language or straight from a
- [ ] [1.4.3:1253](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1253) **Spanish that sounds like Spain** (#786, thanks @cubetes): over 60 strings reworded, Objetivo
- [ ] [1.4.3:1255](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1255) Arabic exercise names keep their English brackets the right way round when they wrap (#780,
- [ ] [1.4.3:1257](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1257) The plate hint says plates, not reps, in Chinese and Korean (#689, #698, thanks @xueyang-dev),

#### Import and the MCP server

- [ ] [1.4.3:1261](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1261) **Log a workout by telling your AI about it** (#739, thanks @matthewjablack). The MCP server gets
- [ ] [1.4.3:1265](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1265) MCP: `sets_planned` counts per-side sets like `sets_done` (102/102, not 102/54; #691, thanks
- [ ] [1.4.3:1268](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1268) Hevy import: 55 built-in exercises (Seated Leg Curl, Plank, Air Bike, Triceps Dip and friends)
- [ ] [1.4.3:1273](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1273) Imports keep converted weights to the hundredth (45 lb comes in as 20.41 kg and reads back as 45),

#### Android

- [ ] [1.4.3:1278](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1278) **The update actually installs.** Switch apps while the new APK comes down and Android quietly
- [ ] [1.4.3:1283](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1283) **Which APK is this?** Settings → About tells you whether you have Standard (180 px), Plus (240

#### From the community

- [ ] [1.4.3:1287](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1287) A superset in List and Compact scrolls to its next member, one-sided exercises included (#574,
- [ ] [1.4.3:1289](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1289) The workout summary uses the width of the phone and has a close button at the top (#597,
- [ ] [1.4.3:1291](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1291) Pairing the app with a server under a sub-path such as `/gym` keeps the sub-path (#601,
- [ ] [1.4.3:1293](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1293) One builder for an exercise added to or swapped into a running session (#608, @bbolinger).
- [ ] [1.4.3:1294](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1294) Tailscale Serve as an HTTPS option in the self-hosting docs (#615, @tanishvbuk).
- [ ] [1.4.3:1295](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1295) German exercise names and steps (#619, #623, @junkerderprovinz).
- [ ] [1.4.3:1296](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1296) Tests that pass east of UTC+6 (#732, @NaufalDzz).

#### Self-hosting

- [ ] [1.4.3:1299](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1299) **Wrong address, clear answer.** When your api service's ORIGIN isn't the address in your browser,
- [ ] [1.4.3:1303](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1303) **Set your own `CONTENT_SECURITY_POLICY`?** The inline start script changed (it now shows an error
- [ ] [1.4.3:1307](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1307) New docs for what Discord asked: from zero to a working AI Coach (it starts with making yourself

#### Security.

- [ ] [1.4.3:1316](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1316) **Pairing the phone app asks you to confirm it's you** (passkey, or your password where that
- [ ] [1.4.3:1319](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1319) On iPhone the paired server's sign-in is no longer part of iCloud or computer backups. A restored
- [ ] [1.4.3:1321](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1321) The Android updater (direct APK only) installs nothing without its checksum and only its own
- [ ] [1.4.3:1323](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/CHANGELOG.md#L1323) Self-hosted images run on this month's patched Node (22.23.4) and nginx (1.30.6), and the server
