# Design

## Context

See proposal.md for motivation. Current state: `Item` has no vector column (the pgvector extension is already enabled and the DB image is `pgvector/pgvector:pg17`); `GatewayService.generate(userId, {serviceId, prompt})` already enforces service on/off and quota and records usage; `ModelProvider` is an abstract DI token implemented by `BedrockModelProvider` (Converse API). The catalog is small (about 25 seeded items plus admin-created ones). Tests use Vitest with an in-memory `FakePrisma` under `apps/api/test/`.

## Goals / Non-Goals

**Goals:**
- Retrieve catalog items by semantic similarity and answer only from them.
- Reuse the gateway for generation so quota and usage recording are not duplicated.
- Persist history in a shape that change 8 (history and reports) can reuse.

**Non-Goals:**
- Hybrid search, reranking, chunking (one embedding per item is enough for a short synopsis).
- Streaming responses.
- ANN index (HNSW/IVFFlat): exact scan is fast for hundreds of rows and avoids Prisma drift on an index it cannot model.
- Agents and admin usage reports.

## Decisions

**1. Vector column through `Unsupported("vector(1024)")` and raw SQL.** Prisma cannot read or write vector types. The column is optional in the schema, written with `$executeRaw` (`UPDATE "Item" SET embedding = $1::vector`) and searched with `$queryRaw` using `1 - (embedding <=> $1::vector)` as cosine similarity. Alternative: a separate `ItemEmbedding` table with a raw column anyway (no gain) or a dedicated vector store (extra service to operate, rejected for time). Prisma excludes `Unsupported` fields from the generated model, so `ItemResponse` cannot leak the vector.

**2. Titan Text Embeddings v2 through `InvokeModel`.** Body `{inputText, dimensions: 1024, normalize: true}`; the response gives `embedding` and `inputTextTokenCount`. A new abstract `EmbeddingProvider` (same DI-token pattern as `ModelProvider`) is implemented by `BedrockEmbeddingProvider`, reusing the lazily built client approach and credentials of the existing provider. The model id comes from optional `BEDROCK_EMBEDDING_MODEL_ID`, default `amazon.titan-embed-text-v2:0`. Failures log only the error name and raise the same generic 503 as generation.

**3. Embedding service and search live in `src/ai/embeddings/`; the chat lives in `src/chat/`.** `EmbeddingsService` offers `embedItem`, `embedQuery`, `reindex` and `search`. `AiModule` exports it; `ItemsModule` imports `AiModule` to refresh embeddings on write (no circular import because `AiModule` does not import `ItemsModule`). `ChatModule` imports `AiModule`.

**4. Refresh on write is best effort.** `ItemsService.create/update` call `embedItem` after saving and swallow provider errors (logged by name), leaving the embedding NULL. On update, the embedding is regenerated only when one of the embedded fields changed; if regeneration fails the old vector is set to NULL so it is never stale. Alternative: fail the write when embedding fails — rejected because catalog admin must not depend on Bedrock availability.

**5. Embedding usage is recorded without a service row.** `UsageEvent.serviceId` is nullable, so embeddings are stored with `serviceId = null` and `serviceName = "Titan Embeddings"`. A seeded `AiService` row was rejected: it would appear in `GET /ai-services` and users could send it to `/ai/generate`, which would call an embedding model through Converse. `TokenQuotaService.record` is reused with a `{id: null, name}` shape (its parameter type is widened to allow a null id). The quota sum already includes these events, but only the gateway call performs `assertWithinQuota`. The chat additionally calls `assertWithinQuota` before embedding the question so a user over the limit spends nothing.

**6. Retrieval parameters.** Top K = 5; minimum similarity is a constant in `src/chat/rag.constants.ts` (0.18, measured with Spanish questions: off-topic questions score at most 0.13 and on-topic ones at least 0.21; it is a single constant so it stays easy to change). Below the minimum for the best hit, the chat answers with a fixed Spanish "no tengo información suficiente en el catálogo" without calling generation. Alternative: always call the model and trust the prompt to refuse — rejected because it costs tokens and cannot be tested deterministically. Items under the minimum are dropped even when others pass.

**7. Prompt building is a pure function.** `buildRagPrompt({history, items, question})` returns one string: instructions (answer in Spanish, use only the listed items, say you lack information otherwise), the items (title, author, kind, genre, year, series, synopsis), the last 6 messages, then the question. The current Converse call sends a single user message, so history is embedded as text. The prompt may exceed the 4000 characters of `GenerateDto`; that limit only guards the HTTP body of `/ai/generate`, and the chat calls `GatewayService.generate` with a plain `{serviceId, prompt}` object. Question limit is 1000 characters; retrieved synopses are trimmed to keep the prompt bounded.

**8. Persistence.** New models: `ChatSession {id, userId→User cascade, title, createdAt, updatedAt}` and `ChatMessage {id, sessionId→ChatSession cascade, role (USER|ASSISTANT), content, sources Json?, inputTokens?, outputTokens?, createdAt}` with index on `(sessionId, createdAt)`. Ownership is enforced in queries (`where: {id, userId}`); other users' sessions return 404, not 403, to avoid revealing existence. A turn is written only after generation succeeds (both messages in one transaction), so a 503 leaves no orphan user message. Alternative: client-sent history — rejected because the brief requires registering and querying conversation history.

**9. Endpoints.** `POST /chat/messages`, `GET /chat/sessions`, `GET /chat/sessions/:id`, admin `POST /ai/reindex?all=true|false`. Reindex runs sequentially (about 25 items, a few seconds) and records usage to the admin who triggered it.

**10. Web.** New `ChatPage` at `/chat` following the existing design system: left list of sessions, thread, input, service selector (enabled services from `GET /ai-services`), remaining tokens from `GET /ai/quota`, source chips linking to `/catalog?q=<title>`. `CatalogPage` does not read the URL today, so it gets a small change to initialize its search box from the `q` query parameter; the existing search then shows the item.

**11. Tests.** Only what the brief requires: chat history register/query (session creation, ownership, ordering, 404 on foreign session) and the not-enough-information path, with `FakePrisma` extended for chat tables and fake embedding and model providers. Pure functions (`buildRagPrompt`, relevance filtering) get small unit tests. No vector SQL is tested automatically; similarity search is covered by the manual check against the real database.

## Risks / Trade-offs

- [Minimum similarity badly tuned: off-topic questions answered, or on-topic refused] → constant isolated in one file, tuned in the manual check with real scores shown in the sources.
- [Stale or missing embeddings after Bedrock outages] → failed writes leave NULL and the admin reindex repairs them; the manual check covers it.
- [Prompt injection through item synopses or the question] → instructions state that items are data; the answer path has no tools and no side effects, so impact is limited to the text of one answer.
- [Sequential reindex timing out on a large catalog] → acceptable for the current size; noted as the first thing to change if the catalog grows.
- [Quota race of one call] → same known limitation as the gateway.
- [Raw SQL bypasses Prisma types] → isolated in `EmbeddingsService`, parameterized (never string-concatenated), and the vector literal is built from numbers only.
- [IAM policy lacks the Titan model] → embedding returns 503; the task list includes updating the policy before the manual check.

## Migration Plan

1. Additive migration: `ALTER TABLE "Item" ADD COLUMN "embedding" vector(1024)`, plus `ChatSession` and `ChatMessage`. Existing rows keep a NULL embedding; nothing is dropped.
2. Update the IAM policy to allow `bedrock:InvokeModel` on `amazon.titan-embed-text-v2:0` in `us-east-2`.
3. Deploy (CI runs `prisma migrate deploy` on start as for previous changes), then log in as admin and call `POST /ai/reindex`.
4. Rollback: revert the commit; the new column and tables are unused by older code and can stay.
