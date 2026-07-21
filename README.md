# aIVoiceAgent

aIVoiceAgent is a multi-tenant voice and media production application. Its governed media journey accepts integrity-declared direct uploads, validates storage probes, versions timelines, requires preview approval, validates captions, and submits export or transformation jobs to configured HTTPS providers. Durable database state records retries, cancellations, provider receipts, output provenance, and callback deduplication.

## Local verification

Use Node.js 20 and PostgreSQL 16. Copy `.env.example` to an untracked `.env`, replace every placeholder, and create the database outside the application. Then run:

```bash
npm ci
npm run db:validate
npm run db:generate
npm run db:deploy
npm test
npm run build
```

`npm test` runs without a database for the domain contract suite. When `DATABASE_URL` is present and migrations have been applied, it also runs the database workflow tests.

## Deployment and workers

`start.sh` only validates configuration and starts the already-installed application. It does not install dependencies, create or reset a database, deploy migrations, seed accounts, rewrite environment files, or terminate processes. Apply reviewed migrations separately with `npm run db:deploy`. Run the durable job worker as a separately supervised process with `npm run worker:media`.

The media object gateway and transformation providers are external production gates. Configure real HTTPS endpoints, secrets, callback signing keys, quotas, and the provider host allowlist before enabling them. The application does not claim that example endpoints or credentials are operational.

Required media configuration:

- `APP_PUBLIC_URL`: public HTTPS origin used for provider callbacks.
- `MEDIA_SECRET_KEY`: 32-byte key used to encrypt provider configuration.
- `MEDIA_OBJECT_GATEWAY_URL` and `MEDIA_OBJECT_GATEWAY_TOKEN`: gateway that creates signed direct uploads and caption objects.
- `MEDIA_GATEWAY_CALLBACK_SECRET` and `MEDIA_PROVIDER_CALLBACK_SECRET`: HMAC secrets for storage and provider callbacks.
- `MEDIA_PROVIDER_HOST_ALLOWLIST`: comma-separated hostnames permitted for provider requests.

Optional Stripe usage reporting uses Billing meter events. Configure `STRIPE_CUSTOMER_MAP` as a business-to-customer JSON map and set the relevant `STRIPE_CALL_MINUTES_EVENT_NAME`, `STRIPE_SMS_EVENT_NAME`, and `STRIPE_AI_TOKENS_EVENT_NAME` values.

## Media workflow

1. A tenant declares filename, MIME type, byte size, and SHA-256 checksum. The API returns a short-lived gateway upload URL.
2. A signed gateway callback must confirm the checksum, byte count, codec, duration, and bounded probe metadata before the asset becomes ready.
3. Users create immutable timeline versions from ready tenant assets and request a preview job.
4. A manager or administrator records an immutable preview decision. Accessible exports require validated captions.
5. The worker selects an eligible configured provider by capability, input size, priority, daily quota, and prior attempts. It persists provider receipts and retries or fails over without inventing success.
6. Signed provider callbacks are deduplicated and must include verifiable output metadata before a provenance-bearing output asset is created.

Generated `/api/gap-*`, `/api/voicestudio/*`, and `/api/ai/*` prototype paths are retired with HTTP 410 responses. They are not production media operations.
