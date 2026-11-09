# Proposal

## Why

The course brief requires per-user token limits, AI service configuration with on/off control, and blocking when a user reaches their limit. Every later AI feature (RAG chatbot, recommender, news agent) needs a single gateway that checks quota and records usage before and after each model call. Bedrock access is also the main technical risk of the project, so this change proves a real Bedrock call end to end now, instead of discovering access problems during the RAG change.

## What Changes

- Add an `AiService` configuration: name, model id, provider, enabled flag, default generation parameters. Administrators create, read, update, enable/disable and delete services.
- Add a per-user `tokenLimit` (integer, nullable meaning unlimited). Administrators set it.
- Add a `UsageEvent` record for each model call: user, service, input tokens, output tokens, timestamp.
- Add a gateway method that, for each AI call, verifies that the service is enabled, verifies that the user has not reached `tokenLimit`, invokes the model, and stores the usage reported by the model response.
- Add a Bedrock client that invokes Amazon Nova Lite through the Bedrock Converse API and returns the text plus the reported token usage.
- Add one authenticated endpoint that exposes the gateway for a plain text generation request, so the call can be exercised from the API and Swagger. It is not a chat feature.
- Users whose consumption reached the limit receive a rejection with a clear status and no model call is made.
- No pgvector and no embeddings in this change; those belong to `rag-chatbot`.

**BREAKING**: none.

## Capabilities

### New Capabilities

- `ai-service-config`: administrators manage the catalog of AI services (model, enable/disable) that the gateway can call.
- `token-quota`: per-user token limits, usage recording, and the quota check that blocks calls at the limit.
- `bedrock-generation`: the gateway invocation path to Amazon Bedrock and the usage reported by each call.

### Modified Capabilities

None. Admin management of user limits lives inside `token-quota` to avoid changing `user-management`.

## Impact

- Prisma: new models `AiService` and `UsageEvent`, and a nullable `tokenLimit` on `User`, with one migration.
- API: new module `ai` (services, quota, gateway, Bedrock client). Dependency `@aws-sdk/client-bedrock-runtime`. New environment variables `AWS_REGION`, `BEDROCK_MODEL_ID` and the AWS credentials, documented in `.env.example`.
- Infrastructure: the API container needs AWS credentials with `bedrock:InvokeModel` on the Nova Lite model. Model access must be enabled in the Bedrock console for the chosen region.
- Tests: automated tests only for the three areas required by the brief (AI services, usage history recording, token calculation), with Bedrock mocked.
- Web: no new screens in this change. The Swagger page documents the new endpoints.
