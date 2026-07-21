# Completeness Review: aIVoiceAgent

**Review date:** 2026-07-20

## Assessment basis

Static inspection plus isolated PostgreSQL startup, login, session/API acceptance, maintained tests, and a production build. External media/provider calls were not exercised because production credentials remain deployment gates.

## Classification

**Functional but incomplete**

This is a substantive but unfinished voice/media production application, not just an empty scaffold. Inspection found 204 source files across `src/`, `prisma/` using Next.js, React, Express, Prisma; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Add durable upload, transcoding/rendering, object storage, job status, retry, and cancellation workflows.
2. Integrate production speech/media providers with quotas, format validation, provenance, and provider failover.
3. Implement timeline/version management, preview approval, export presets, captions, and accessible playback.
4. Add fixture-based media pipeline tests plus load limits for large, malformed, and adversarial files.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.
- Regression risk is high because no recognizable project-owned automated tests cover the main path.

## Evidence inspected

- `src/app/gap-no-conversation-transcript-full-text-search/page.tsx:16`
- `src/components/agents/knowledge-panel.tsx:92`
- `src/app/error.tsx`
- `src/app/layout.tsx`
- `package.json`
- `start.sh`

## Recommended next action

Choose one real voice/media production journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-18)

The reviewed voice/media journey is implemented and locally verified. Production object-storage and media-provider credentials remain explicit deployment gates; no example endpoint, credential, provider capacity, or external certification is claimed as operational.

1. **Durable media workflow:** Added tenant-scoped direct-upload sessions, checksum and probe quarantine, object receipts, durable PostgreSQL jobs, atomic claims, expired-lease recovery, bounded retries, dead-letter state, cancellation confirmation, output integrity checks, and status/attempt APIs. Upload and job idempotency keys now reject payload reuse.
2. **Production provider contracts:** Added AES-256-GCM encrypted provider configurations, real HTTPS health verification and job submission, explicit provider/object host allowlists, atomic daily quota reservation, capability/size selection, provider receipts, signed and deduplicated callbacks, provenance-bearing output assets, and failover without fabricated success.
3. **Complete production controls:** Added immutable timeline versions with optimistic concurrency, real preview jobs, immutable manager/admin approval decisions, validated WebVTT captions, configurable export presets, approval-gated accessible exports, playback manifests with caption tracks and provenance, and an operational dashboard for the full journey.
4. **Media and load validation:** Added checked-in audio/video/adversarial fixtures plus limits for MIME/codec, file bytes, duration, sample rate, channels, 8K dimensions, frame rate, 64 tracks, 10,000 clips per track, 20,000 caption cues, callback bytes, and malformed UTF-8. Signed callbacks cannot bypass stream body limits.
5. **Risk-based verification and CI:** Added domain, fixture, security, queue, database-integration, migration-replay, provider-failure, and lease-recovery tests; a PostgreSQL 16 CI workflow deploys the migration twice, runs the tests and production build, and rejects destructive startup behavior. Generated gap, Voice Studio, and ungrounded AI prototype paths are retired with HTTP 410 responses.

Startup no longer installs dependencies, creates/resets/mutates a database, seeds accounts, rewrites secrets, or terminates other processes. Migrations and the media worker are separate reviewed operations. The former Twilio recording type mismatch and obsolete Stripe usage-record integration were also repaired; Stripe reporting now uses Billing meter events. Dependencies were updated to remove the audit findings present during implementation.

Local verification on 2026-07-19: Prisma schema validation and client generation passed; the initial PostgreSQL migration applied successfully and a second deploy reported no pending migrations; all 52 tests passed against an isolated PostgreSQL 16 instance; the Next.js 15 production build passed; `npm audit --audit-level=low` reported zero vulnerabilities; and shell syntax, executable mode, safe-start scanning, and `git diff --check` passed.

## Runtime acceptance (2026-07-20)

- The launcher now requires the explicit `BACKEND_PORT`, refuses an occupied port, and binds Next.js only to the assigned loopback address/port. Test runtime configuration uses `RUNTIME_PROJECT_SOURCE`; startup does not migrate or seed.
- Disposable bootstrap requires `ALLOW_DEMO_SEED=true` and an injected password. Initial administrator creation is a separate acknowledgement-gated command that refuses to overwrite an existing account and hashes the password with bcrypt cost 12.
- Attempt history is preserved in `_runtime_non_suite_repair_shard2k.tsv`: two launcher-validation failures were recorded (`no_owned_listener`) before the portable secret check was corrected; the final attempt is `API_VERIFIED / startup_login_session_api`.
- Final acceptance used PostgreSQL `127.0.0.1:55615` and the single Next.js API/UI listener `127.0.0.1:6044`; reserved UI port `6045` was not used. Credentials were verified against the Prisma `User` table and NextAuth's authenticated session API returned the persisted account.
- Maintained verification passed: 52 tests executed (47 passed and 5 database-dependent cases skipped in the non-integration invocation), and the Next.js 15 production build completed successfully. Shell syntax and assigned-listener release checks passed.
