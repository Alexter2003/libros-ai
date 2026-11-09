# Tasks

## 1. Data model and configuration

- [x] 1.1 Add `Item.embedding Unsupported("vector(1024)")?`, `ChatSession`, `ChatMessage` (role enum USER|ASSISTANT, `sources Json?`, tokens, index on `(sessionId, createdAt)`) to `schema.prisma` and create the additive migration. Manual check: `pnpm prisma:migrate` applies cleanly on the local DB, `\d "Item"` in psql shows the `vector(1024)` column and existing rows remain. Captura de evidencia: psql output of the new column and tables.
- [x] 1.2 Add optional `BEDROCK_EMBEDDING_MODEL_ID` (default `amazon.titan-embed-text-v2:0`) to `env.validation.ts`, `deploy/docker-compose.yml` and `.env.example`. Manual check: the API boots without the variable and the compose file still renders (`docker compose config`).
- [x] 1.3 Update the IAM policy in the AWS console to allow `bedrock:InvokeModel` on the Titan Text Embeddings v2 ARN in `us-east-2`, and document it in the README policy template. Manual check: the policy JSON shows both Nova and Titan resources. Captura de evidencia: IAM policy page.

## 2. Embeddings

- [x] 2.1 Create `src/ai/embeddings/` with abstract `EmbeddingProvider` and `BedrockEmbeddingProvider` (InvokeModel, `dimensions: 1024`, `normalize: true`, returns vector and input tokens, generic 503 on failure logging only the error name); register it in `AiModule`. Manual check: a local call returns 1024 numbers and a token count.
- [x] 2.2 Implement `EmbeddingsService`: build item text (pure function), `embedItem` (raw parameterized UPDATE), `embedQuery`, `search` (cosine similarity, top K, items without embedding excluded) and usage recording as "Titan Embeddings" with null `serviceId` (widen `TokenQuotaService.record` accordingly). Manual check: after reindex, a SQL query shows non-null embeddings and `UsageEvent` rows named "Titan Embeddings".
- [x] 2.3 Add admin-only `POST /ai/reindex` (`?all=true` regenerates everything; continues after a failed item; returns `{indexed, failed, total}`) with Swagger docs. Manual check: as admin it indexes the missing items, as USER it returns 403. Captura de evidencia: reindex response and the 403.
- [x] 2.4 Refresh embeddings from `ItemsService.create/update` (only when embedded fields change; swallow provider errors; set the vector to NULL when regeneration fails) and import `AiModule` in `ItemsModule`. Manual check: creating an item and editing its synopsis updates its embedding; with invalid AWS keys the write still succeeds and the embedding is NULL.

## 3. Chat backend

- [x] 3.1 Create `src/chat/` with `rag.constants.ts` (top K 5, minimum similarity, history window 6, not-enough-information text) and the pure `buildRagPrompt` function, plus `ChatModule` imported in `AppModule`. Manual check: unit tests for prompt content and relevance filtering pass.
- [x] 3.2 Implement `ChatService` and `POST /chat/messages` (DTO: `message` max 1000, `serviceId` UUID, optional `sessionId` UUID): quota pre-check, session ownership, embed question, search, filter by minimum similarity, not-enough-information shortcut without generation, otherwise generate through `GatewayService`, then store both messages in one transaction with sources and tokens. Manual check: an on-topic question returns a Spanish answer with sources, an off-topic question returns the fixed answer with empty sources and consumes no generation tokens, tuning the minimum similarity if needed. Captura de evidencia: grounded answer with sources, off-topic answer, and `GET /ai/quota` before and after.
- [x] 3.3 Implement `GET /chat/sessions` and `GET /chat/sessions/:id` with ownership checks (404 for foreign or unknown sessions) and Swagger docs. Manual check: user A cannot read user B's session (404) and lists are most recent first. Captura de evidencia: sessions list and a 404 for a foreign session.
- [x] 3.4 Automated tests (Vitest, in `test/chat/`): extend `FakePrisma` with chat tables and use fake embedding, search and model providers to cover history register and query, title truncation, ownership 404, not-enough-information path and no stored user message on provider failure. Manual check: `pnpm test` in `apps/api` passes.

## 4. Web chat

- [x] 4.1 Add API client functions and types for chat, sessions and quota in `apps/web/src/lib/api.ts`, and make `CatalogPage` initialize its search from the `q` query parameter. Manual check: opening `/catalog?q=<title>` shows that item.
- [x] 4.2 Build `ChatPage` at `/chat` (session list, thread, input, enabled-service selector, remaining tokens, source chips linking to the catalog, loading state and friendly messages for 422, 429 and 503), add the route and a menu card in `MenuPage`. Manual check: ask, follow up, reopen an old session, start a new one, and see the 429 message with a user whose limit is 0. Captura de evidencia: chat with sources, the not-enough-information answer, the session list and the limit-reached message.
- [x] 4.3 Add the token limit to the users administration screen: a "Límite de tokens" column and, when editing, a "Sin límite" checkbox (checked sends `null`) plus a numeric field, saved through `PATCH /users/:id/token-limit`. Manual check: set 500, see it in the table, check "Sin límite" and see "Sin límite" again; a user with limit 0 gets the 429 message in the chat. Captura de evidencia: edit form with the checkbox and the table column.

## 5. Docs and release

- [x] 5.1 Document the chat, reindex flow and Titan IAM permission in `README.md` (endpoint table, retrieval parameters, post-deploy reindex step). Manual check: the README steps match the endpoints in Swagger.
- [ ] 5.2 Production check after deploy: log in as admin, run `POST /ai/reindex`, ask an on-topic and an off-topic question from the web, confirm history persists after reload. Captura de evidencia: production chat screen and reindex response.

## Workflow follow-up

- Report the manual checks to the user, fix reported problems, then commit, push and archive only after the user approves.
