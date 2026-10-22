# Hebrew and right-to-left support

IronLog starts in Hebrew (`he`, `he-IL`) with `dir="rtl"`, including the first HTML paint and the sign-in screen. The Hebrew UI dictionary is bundled with the shell; exercise names, instructions and descriptions are loaded in separate catalogue chunks.

Existing installations receive a one-time `ironlogHebrewVersion` preference update. It selects Hebrew, disables English-only names and English parenthetical names, and preserves workouts, set values, exercise identifiers and user-written content. Previously added IronLog programme titles are localized only when its preset metadata and original title still match. A later language choice in Settings is respected. New, empty profiles start their week on Sunday; an existing training schedule is preserved.

## Direction and input

- Reading order, navigation chevrons, calendars, sliders and switches follow RTL.
- Weight inputs, decimals, signed numbers, timer clocks, duration wheels, URLs and email/password fields keep LTR direction.
- Substituted numeric ranges and Latin names are isolated with Unicode bidi controls, preventing signs or range endpoints from changing order in Hebrew sentences.
- Charts retain chronological LTR order; Hebrew tooltips and labels retain their reading direction.
- Text and search fields use automatic direction for user-entered text.

## Translation sources

- `frontend/src/locales/he.js`: interface strings, including accessibility labels, dialogs, operator screens and fork-specific copy. It is a superset of upstream locale keys.
- `catalogue/i18n/he.json`: all 5,632 exercise names, descriptions and instruction arrays. Generated app packs are produced by `node scripts/catalogue/build.mjs`.
- `frontend/src/ironlog/exercise-names-he.js`: names for the 38 original IronLog exercise IDs, retained for existing profiles. A user-renamed exercise retains its name.

The catalogue's English text was machine translated, with terminology normalization and manual corrections to common exercise names and untranslated terms. The entire catalogue has not received a human biomechanics review. The primary UI and workout flows have been reviewed in Hebrew. No translation service is called by the running application.

## Validation

```sh
node frontend/scripts/check-locales.mjs
node frontend/scripts/check-source-strings.mjs --strict
node scripts/catalogue/build.mjs --check
npm test --prefix frontend -- src/ironlog/hebrew.test.js
npm run build
```

Coverage checks verify translated keys and interpolation arguments, every catalogue exercise and instruction, Hebrew dates and plurals, number isolation, preservation of user-created names, and the preference upgrade. Browser checks cover first paint with an English browser locale, mobile/desktop widths, all primary routes, Hebrew search, numeric set entry and persistence after reload.
