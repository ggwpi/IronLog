# Complete JSON snapshot preservation gate — 2026-11-19

**Draft / incomplete / no merge or production release.**

Baseline: `f93c57c9c522fac15bcbdbe4b07bacd4aafe740e`. The upstream pin is unchanged.

## Gap and change

The earlier read-only `auditUserDataPreservation` checks a named list of training fields and
preferences. It also supports tests of intentional UI changes outside that list. It is not
sufficient to certify that every unknown/custom field of a complete profile survived an upgrade.
For example, a lost `lang`, reminder, custom future setting or new cardio-goal list could escape
the old selected-field check.

`auditCompleteProfilePreservation(before, after)` adds a separate strict gate for **complete JSON
snapshots**, retaining the old helper's behavior for existing compatibility tests:

- Every own root field present before must remain, including settings and fields unknown to this
  client; every nested original value/record/media reference remains. New fields and appended
  records are allowed; existing arrays cannot silently shrink or reorder.
- Only root `_ts` and `_rev` numbers may advance. They cannot disappear, change type or regress.
  Malformed legacy non-numeric clock values must remain exact; the audit does not sanitize them.
- Invalid/non-JSON profile shapes fail. Cycles, sparse/decorated arrays, non-finite numbers,
  `undefined`, functions, Date/Map instances, symbols and hidden/accessor properties are rejected.
  The validator does not execute a getter.
- Findings contain paths and issue descriptions, never leaf values, and are bounded to 100.
  No snapshots, identifiers, dates, numbers, notes, media or settings are rewritten.

The separate local-file CLI reads two JSON snapshots and reports the result:

```sh
node scripts/check-ironlog-profile-preservation.mjs BEFORE.json AFTER.json
```

Exit 0: preserved; 1: invalid shapes or preservation mismatch; 2: bad arguments, unreadable/invalid
JSON or inability to complete the audit. JSON parse exceptions are deliberately not printed,
because they can contain private source text. The command performs no account/API/database calls
or writes. Do not point it at live accounts; use independent local/sanitized snapshots within the
authorized workflow. It is not mounted in application startup or sync and does not intercept
intentional edits.

## Evidence

Focused original/strict/CLI tests: **39 passed** in three files. Coverage includes unknown fields,
custom settings, new goal/activity/band state, nested changes, long Hebrew notes and media,
malformed JSON data, clock regression, special JSON keys and shared references, bounded output,
no getter execution, invalid/unavailable files and missing arguments. CLI tests use unique temporary
synthetic files, check both input byte strings after execution and remove only those fixture files.

Full local frontend: **6,136 passed / 6 unchanged Windows path failures**, **6,142 tests / 518 files**,
no skips. API: **689 passed / 24 existing Windows failures / 46 skipped**, 759 total. MCP:
**96 passed / 1 unchanged permission fixture failure**, 97 total, plus two Windows `fs.watch`
EPERM fixture errors, not suppressed. Plain-Node MCP graph, production Vite build, media staging
(6,554 stills + 6,554 animations), 19 locales / 2,550 keys and fatigue probes (108,000 + 1,800)
pass. Source-string audit retains the existing report-only 52-key backlog. Latest-head Linux
CI is recorded in PR #69. This slice changes verification tooling only; the existing UI,
runtime storage/auth/sync, API/MCP and
all upstream algorithms are untouched. Previous cardio/tempo light/dark/RTL browser evidence remains
applicable to their unchanged product code; no new visual or native certification is claimed.

## Limits

This is structural preservation for the supplied complete JSON snapshots. It cannot prove that a
snapshot includes every user's original data, that referenced media bytes exist, that a database
backup restores, that a native build works, or that all upstream features are integrated. It does
not replace independent backups, sanitized restore/rollback drills, the remaining conflict/import/
guest/storage-failure matrix or the release ledger. No live user data was read or written.
