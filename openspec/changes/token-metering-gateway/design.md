# Design

## Context

The API is a NestJS + Prisma monorepo app with JWT auth, global `AuthGuard` and `RolesGuard`, and a catalog module already merged. There is no AI code yet. The gateway is the single entry point for every model call, so the quota check and usage recording are centralised there and not repeated in each feature.

## Goals / Non-Goals

**Goals**
- One gateway path for model calls: service check, quota check, invocation, usage recording.
- A real Bedrock call with Amazon Nova Lite, so usage numbers come from the model.
- Admin CRUD for services and token limits, with on/off control.

**Non-Goals**
- Chat history, conversations, or usage reports (`history-and-usage-reports`).
- Embeddings, pgvector, or RAG (`rag-chatbot`).
- Web screens for these features beyond what is already planned.

## Decisions

### D1. Quota is computed from usage events, not from a counter on User
The check sums `UsageEvent.inputTokens + outputTokens` for the user before each call.
- Pros: a single source of truth, no drift if a call fails midway, and the same table later feeds the usage reports.
- Cons: a `SUM` on every call. With one user per class and a few thousand rows at most, the cost is negligible.
- Alternative: a `tokensUsed` counter on User updated in a transaction. Faster reads, but two sources of truth and extra care for concurrent calls.

Trade-off accepted: concurrent calls can overshoot the limit by one call's worth of tokens, because the check runs before the model call and the usage is known only after it. This is documented, not hidden.

### D2. Usage is recorded only after a successful response
If the model fails before returning usage, nothing is stored. This matches the spec.

### D3. Model calls go through the Bedrock Converse API
Converse gives the same request shape for Nova models and returns `usage.inputTokens` and `usage.outputTokens`. Using InvokeModel would require per-model payload formats.

### D4. Credentials come from environment variables
Lightsail does not give instance roles for Bedrock, so the API reads `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `BEDROCK_MODEL_ID` from `.env`, the same pattern as the other secrets. The keys are scoped to `bedrock:InvokeModel` on the chosen model only.
- Alternative: an IAM role on a managed compute service. Better security, but a larger infrastructure change that does not fit the remaining time.

### D5. Tests mock the Bedrock client
Automated tests cover the three areas the brief requires: AI services, usage recording, and the token calculation. The Bedrock client is replaced by a fake that returns fixed usage numbers. The runner is Vitest, because Nest 12 is ESM-only and Jest cannot load it here; the tests build the services by hand over an in-memory Prisma fake. Manual checks use the real model.

### D6. Model default and region
Assumed: `us-east-2` (Ohio, the same region as the Lightsail instance) and Nova Lite as the default model. Both are configuration values, so they change without code changes. Model access must be enabled in the Bedrock console before the manual check.

## Risks / Trade-offs

- Bedrock model access is not enabled in the account, or the region does not offer Nova Lite -> the manual check in task group 1 detects it before any feature depends on it.
- Long-lived AWS keys stored in `.env` -> limited to one model, rotated after the course, and never printed in responses or logs.
- The quota can be exceeded by one call under concurrency -> accepted and documented (D1).

## Migration Plan

1. Apply the Prisma migration that adds `AiService`, `UsageEvent` and `User.tokenLimit`. The migration is additive; existing users get `tokenLimit = null`, meaning unlimited.
2. Add the AWS variables to `.env` on the server with the same ownership and mode rules as the other secrets (`deploy:deploy`, mode 600).
3. Deploy. Rollback is the previous image; the additive migration can stay in place.

## Open Questions

- None blocking. Credential rotation schedule is left to the user.
