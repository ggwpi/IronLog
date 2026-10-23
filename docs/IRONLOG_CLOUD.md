# IronLog cloud backend

Status: implemented on the `feat/supabase-backend` branch. Cloud project cleanup, provisioning,
preview verification and production activation must be completed after Supabase is reconnected.
Do not activate the reset or deploy this branch to production without those checks.

## Architecture

The browser still uses openGym's API and offline store. Vercel's Node handler executes the account,
profile, administration and notification rules. Supabase Postgres stores private account records,
credentials, identities, profile documents, invites, one-time challenges, rate limits, presence,
subscriptions, background jobs, resumable transfer reservations, media metadata and audit events.
Supabase Auth is **not** a second login system. Passkeys and scrypt passwords remain openGym's own.

All SQL uses a non-bypass `ironlog_backend` role inside a transaction. The private `ironlog` schema
has RLS and no public/browser grants. Production uses a restricted login role that can assume this
role, not the database owner's credentials. TLS hostname verification is required remotely.

Profiles keep the upstream JSON format. Revision/write-ID comparisons, upstream `stampPut`, reset
markers, deletion stamps and client `mergeStates` still protect concurrent edits. In-progress
workouts remain local. Account locks serialize one account's operations; uniqueness constraints
protect identity claims. Expected HTTP refusals commit security counters and spent challenges.
Unexpected database errors roll back the transaction.

User files live in a private Storage bucket. The backend issues scoped upload URLs for unique
staging paths, reserves quotas, validates bytes/hash/type/duration at completion and copies trusted
bytes to user/hash paths. Staging survives until its URL expires, preventing overwrite after
validation. Clients never send account cookies or bearer tokens to Storage. Backend-issued
60-second download URLs authorize private downloads. SHA/type checks and offline cache remain.

Supabase Cron checks every five seconds for due jobs and invokes an authenticated Vercel worker.
A transaction advisory lock permits one scanner across instances. Reminders follow upstream local
calendar/timezone rules. Timer records, cancellation and cleanup survive deploys. Failed jobs retry
with bounded backoff; monitor `ironlog.jobs.last_error` and `cron.job_run_details`. Web Push can be
replayed after an ambiguous network acknowledgement; notification tags replace duplicates. OS
notification delivery has no exact timing guarantee. No AI provider or Coach runtime is enabled.

## Clean the existing dedicated IronLog project first

The user explicitly requested removal of **all old IronLog data, including the saved workout plan**.
No automatic migration or recovery import is performed. Never run cleanup on a shared project.

1. Reconnect Supabase and verify the existing IronLog project's reference and ownership.
2. Inspect tables, schemas, Storage, Auth users, Edge Functions, triggers, policies, secrets,
   scheduled jobs, Data API configuration and Vercel environment variables. Resolve any non-IronLog
   objects before deleting anything. Disable old writers/functions and old scheduled jobs first.
3. Using the project's administrative database connection and Storage secret in a private shell,
   run `node api/scripts/cloud/inventory.mjs <private-inventory.json>`. Inspect the metadata file.
   It records no workout contents or authentication credentials.
4. Run `node api/scripts/cloud/cleanup.mjs <private-inventory.json>`. It verifies the exact project,
   manifest and legacy table inventory, removes inventoried application objects and old buckets,
   and deletes old Supabase Auth users. It preserves managed schemas and extension-owned objects.
   It refuses to run once the replacement account schema exists. Operations across SQL/Auth/Storage
   are not one distributed transaction; inspect failures and finish outstanding steps before proceeding.
5. Remove the legacy Edge Functions, unused secrets/integrations, and old environment references
   found in step 2 using the project management tools. Verify the old API routes can no longer write.
   Provider-retained backups, Git history and files users downloaded outside the app are not erased.

For scripts set `IRONLOG_EXPECTED_PROJECT_REF` and `SUPABASE_URL` to the verified dedicated project.
Use `SUPABASE_ADMIN_DATABASE_URL` only for setup; never expose it in the frontend or deploy it as
runtime credentials. Do not commit environment files, metadata manifests or generated invitations.

## Provision and connect

- Apply `supabase/migrations/20261023121250_ironlog_cloud_backend.sql` with the migration tooling.
  Do not expose the `ironlog` schema through the Data API. Inspect RLS/security advisors afterward.
- Run `api/scripts/cloud/runtime-role.mjs <private-runtime-url-file>` to create/rotate the restricted
  runtime login. The input administrative URL must use the actual Supabase pooler connection.
- Configure the Vercel backend's encrypted secrets: `IRONLOG_DATABASE_URL` (restricted pooler URL,
  `sslmode=verify-full`), `SUPABASE_SECRET_KEY` (server-only Storage key),
  `IRONLOG_SESSION_SECRET` (stable random 32+ characters), `IRONLOG_WORKER_SECRET` (stable random
  32+ characters), `IRONLOG_VAPID_PUBLIC_KEY`, `IRONLOG_VAPID_PRIVATE_KEY`. Generate VAPID keys with
  `web-push`; never regenerate them on cold start. No secret may have a `VITE_` prefix.
- Set `SUPABASE_URL`, `ORIGIN=https://ironlog-v2-two.vercel.app`, `RP_ID=ironlog-v2-two.vercel.app`,
  `PASSWORD_LOGIN=1`, and `VAPID_SUBJECT` (instance origin or operator contact).
- Run `node api/scripts/cloud/provision.mjs` with administrative SQL credentials. This installs
  the private bucket (50 MiB object ceiling), recurring jobs, Vault-held worker credential and
  Cron. Check the project's Storage/extension capabilities and existing service limits; do not
  purchase services or change tiers automatically.
- Run `node api/scripts/cloud/bootstrap.mjs <private-owner-invite-file>`. Deliver this code only
  to the owner, who creates the first owner account through ordinary registration. Public signup
  never independently elects an administrator. Additional accounts require owner/admin invitations.
- Set `VITE_BACKEND_GENERATION=ironlog-cloud-1` **only for the configured preview first**. Use a
  separate isolated test database/bucket and matching preview ORIGIN/RP_ID for preview tests; do
  not test destructive flows against the production project's accounts or files.
- Validate the built preview and Vercel routing, then provision production and activate its build
  with the same generation. Never claim live migration succeeded from local tests alone.

The activation resets old local profile keys, stashes and private app media before importing the
store. New profile keys and native media/mirror paths are namespaced. Old tabs cannot feed legacy
state into the new namespace; the backend rejects old generations and old tokens. Reset failure
stops boot with a retry message instead of loading the old profile. Subsequent starts preserve new
cloud-era data. Branding, dock navigation and the confirmed modal/body portal fix are untouched.

## API compatibility

All 56 non-Coach routes in the upstream server are accounted for by an automated inventory test.
Existing settings, recovery, passkey, pairing, profile and administration response shapes remain.
The following explicit transport changes require the new client generation:

- Every normal cloud API request sends `X-IronLog-Generation: ironlog-cloud-1`. Health/config are
  public; internal worker uses its own server credential. Missing/old generations receive JSON
  `409 generation-mismatch`; unknown routes receive JSON 404, never the website HTML.
- Config advertises `media.transport=signed-v1` and `transport.snapshots=signed-v1`.
- Instead of large `PUT /api/media/{hash}` bodies: `POST /api/media/upload` with hash/mime/size,
  direct Storage PUT, then `POST /api/media/complete` with transfer ID. Missing/status/retry paths
  remain on the upstream media synchronizer. `GET /api/media/{hash}` returns a scoped URL descriptor.
- Large profile uploads use `POST /api/data/upload`, direct Storage PUT of the original JSON
  request envelope, then `POST /api/data/commit`. The same validation and revision checks apply.
- Large data/conflict responses carry `snapshot:{url,size}`. The API transport fetches this bounded
  JSON and restores the original response/error shape before the store sees it.
- Generation-aware beacons use authenticated fetch with `keepalive`, since sendBeacon cannot set
  the required header. Native requests still authenticate through pairing tokens.

## Verification

Local checks use a separate stock Postgres fixture and in-memory **test-only** object transport.
No production data, fake programme or sample workout is inserted by the application.

- `IRONLOG_TEST_DATABASE_URL=<local-test-url> node --test api/test/cloud-backend.test.js`
- `npm test --prefix api` (existing upstream suites; cloud DB tests skip without the explicit URL)
- Frontend cloud reset/transfer, API, media, account and sync suites.
- `VITE_BACKEND_GENERATION=ironlog-cloud-1 npm run build`
- Before release: real Supabase database query and RLS advisors; real Storage upload/download and
  failure paths; two real browser contexts; two devices; account recovery/revocation; Cron and Web
  Push after a cold start. Verify the iPhone installed-app dock and modal remain correct.

Observe JSON health/config, API error rates, job failures, Storage/database usage and Cron results.
A safe rollback retains the clean generation and cloud-era data. Do not restore the old backend,
legacy local keys or former personal data to fix a deployment problem.
