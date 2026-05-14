# Audit Recommendations & Status — aIVoiceAgent

Source: /Users/erolakarsu/projects/_AUDIT/reports/batch_08.md (section 34)

Verdict per audit: substantive (Next.js full-stack, 23 pages, ~63 AI endpoints — TSV under-reported).

## Original audit recommendations

Missing AI counterparts: comprehensive coverage already present.

Missing non-AI:
- Telephony integrations (Twilio, Vonage)
- CRM integration
- Transcript management/search
- Billing / metering

Custom feature ideas:
- Contextual conversation memory
- Agent performance scoring
- Multi-language code-switching
- Real-time sentiment intervention
- Custom voice cloning

## Implemented in this pass

None. Project is a Next.js TS app with Prisma schema and ~63 existing AI endpoints. Adding endpoints requires a TS/build toolchain not exercised here, and remaining items are NEEDS-CREDS (Twilio/Vonage), NEEDS-PRODUCT-DECISION (voice cloning vendor), or substantive new features (memory store, billing pipeline).

## Backlog (priority order)

1. Telephony integration — Twilio/Vonage credentials decision.
2. CRM integration — Salesforce/HubSpot credentials decision.
3. Transcript search — needs vector store / search infra decision.
4. Billing / metering — substantial product feature.
5. Voice cloning — vendor decision (ElevenLabs/Resemble).
6. Memory / personalization layer — substantial; could start with simple Postgres-backed conversation summary.

## Apply pass 3 (frontend)

FE already wired. Next.js App Router with 7 dedicated AI feature
pages under `src/app/(dashboard)/ai/`: `accent-adapter`,
`emotion-detector`, `hearing-test`, `intent-classifier`,
`multi-language`, `speech-enhancer`, `translator`. Each page
implements list/create/detail/process flows that call its matching
`/api/ai/<feature>` route handler under `src/app/api/ai/`. Auth is
session-cookie based via Next-Auth (not `localStorage` token).
No FE work performed.

## Apply pass 4 (mechanical backlog)

SKIPPED. No MECHANICAL items in backlog: telephony/CRM/voice cloning
are NEEDS-CREDS, transcript search is NEEDS-PRODUCT-DECISION
(vector store choice), billing/memory layer are substantive features.
Adding endpoints would also require Next.js TS build wiring not
exercised in this pass.

## Apply pass 5 (all backlog)

Re-evaluated: agent-performance scoring is straightforward MECHANICAL
work given the existing `Call` Prisma model already captures
`outcome`, `wasTransferred`, `sentiment`, `sentimentScore`, and
`duration`. Conversation-memory was re-categorised as TOO-RISKY-stub
(in-memory fold per call rather than a new Prisma model + embeddings
infra).

Implemented two new Next.js App Router routes plus one dashboard page;
all gate on `OPENROUTER_API_KEY` with HTTP 503 + `missing:
OPENROUTER_API_KEY` when unset:

- `POST /api/ai/agent-performance` MECHANICAL — reads recent `Call`
  records (filterable by `agentId` + `since`, capped 1-100 calls), then
  asks the LLM for a scored breakdown
  (`overall_score`, `strengths`, `weaknesses`, `coaching_priorities`,
  `kpi_breakdown {resolution_rate_pct, transfer_rate_pct,
  avg_sentiment_score, duration_efficiency}`). No new Prisma model.
- `POST /api/ai/conversation-memory` TOO-RISKY-stub — folds past `Call`
  + `CallMessage` records (filterable by `from`, `agentId`,
  `lookback_days`) into a per-caller compact memory. **PRODUCT-DECISION
  + TOO-RISKY:** full vector-store memory persistence is TOO-RISKY (new
  Prisma model + embeddings infra); this endpoint instead returns an
  in-memory folded summary on each call.

FE: new `src/app/(dashboard)/ai/backlog/page.tsx` exercises both
endpoints with inline 503-handling.

Files touched (all new):
- `src/app/api/ai/agent-performance/route.ts`
- `src/app/api/ai/conversation-memory/route.ts`
- `src/app/(dashboard)/ai/backlog/page.tsx`

Smoke: `tsc -p . --noEmit` passes for all three new files (pre-existing
`voice/recording/route.ts` errors unchanged). Live HTTP smoke skipped:
`start.sh` requires Next.js dev with `prisma db push` + seed; not
exercised in this pass per the apply-pass fallback rule. 503 guard
verified by code path inspection.

Backlog still deferred: telephony (Twilio/Vonage), CRM
(Salesforce/HubSpot), voice cloning (NEEDS-CREDS), billing/metering
(substantive feature).
