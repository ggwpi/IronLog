# Coach upstream alignment

Source: [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym/tree/922b586a6ee89c2e166baef1ef3a50e062b77374), commit `922b586a6ee89c2e166baef1ef3a50e062b77374`.

The shared `api/coach/core` engine, adapters, prompts, schemas, parsers, validation, pending-answer handling and scheduling rule come from this revision. The self-hosted jobs/routes and phone runner use its `ask`, `review`, `debrief` and plan/refinement flows. Chat questions receive prose answers; review and debrief remain explicit actions. The upstream Gemini model preference, one replacement for a refused model, bounded transient retries and JSON validation/repair are included.

IronLog integration points:

- The exercise index is generated from the application's catalogue with `node scripts/build-coach-assets.mjs`; the same script generates the upstream prompt texts. `--check` verifies both artifacts.
- `core/categories.js` retains the shared consent-version export (2); `core/cadence.js` re-exports upstream `due.js` for older imports.
- Cloud requests retain account-bound encrypted connections, provider consent, conflict-aware profile sync and stale proposal IDs. Active workout context is allowlisted by the upstream payload builder before it is queued. Successfully substituted models are remembered without overwriting a concurrent user selection.
- A cloud answer temporarily holds the pending slot and restores the unexpired proposal it was asked beside when acknowledged, like upstream. A failed question preserves that proposal.
- Self-hosted/phone requests use upstream's five-minute provider timeout. Vercel is configured for a 300-second invocation, so the cloud worker reserves 20 seconds for database completion and limits its entire pipeline (including retries and repair) to 280 seconds. Its lease is 330 seconds. The old independent 90-second transport cutoff is removed. This hosting constraint is the timeout difference from upstream.
- Existing IronLog connection controls and training-plan application remain in place; unrelated upstream training features such as rotation changes are outside this AI-engine import.

Validation covers the upstream HTTP/model-fallback and question tests, phone context/scheduling, chat answer deduplication, and cloud tests against local PostgreSQL, including a real adapter/pipeline with simulated Gemini responses. No live provider credentials are used by tests.

Model fallback is an explicit per-connection preference (`allowModelFallback`), also available in the native phone setup. It defaults to enabled for compatibility. Disabling it bypasses both model discovery/replacement and any cached substitution, while retries against the selected model remain unchanged. An older client that omits this field preserves the connection's stored preference. Changing it cancels an in-flight run on that connection so a late replacement cannot override the new choice.

Short Gemini answers (`ask` and `debrief`) cap output at 4096 tokens (or the caller's lower cap). Gemini 3 Flash additionally receives `thinkingConfig.thinkingLevel: LOW`; plan creation, refinement and review retain their existing budget. The task travels through the shared pipeline so native and cloud calls agree. If a model is substituted, its request settings are rebuilt for the replacement model's capabilities. This is a latency mitigation, not a guarantee against provider overload.

Cloud runs record bounded per-request timings and HTTP status or transport outcome in `last.providerAttempts`, and emit start/end events tagged by random job ID, provider and task. These diagnostics exclude URLs, keys, prompts, response bodies and exception messages. They distinguish waiting for the initial provider response from retries and repair calls without collecting training content.

The cloud HTTPS transport separately bounds connection establishment (DNS/TCP/TLS) to 30 seconds. This timer stops once TLS is established; it does not truncate a legitimately slower model response. Bounded phase timings (socket, DNS, TCP, TLS, upload, response headers/body) distinguish a network connection stall from provider generation latency, without recording hosts, addresses, headers or content.
