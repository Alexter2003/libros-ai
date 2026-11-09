# Proposal

## Why

The AI gateway can already call Nova Lite with quota control, but it knows nothing about the catalog: it answers from the model's general knowledge. The course brief requires a RAG chatbot that answers from the books and comics loaded in the application, with conversation history. This change connects the catalog to the gateway so answers are grounded in real items and cite their sources.

## What Changes

- Each catalog item gets a 1024-dimension embedding (Amazon Titan Text Embeddings v2) stored in a pgvector column of the `Item` table.
- Embeddings are refreshed automatically when an item is created or updated, and an admin-only reindex endpoint generates the missing ones (needed after the production seed).
- New chat endpoint: the question is embedded, the closest items are retrieved by cosine similarity, and the answer is generated through the existing gateway (so quota, on/off switch and `UsageEvent` recording keep applying).
- When no retrieved item is similar enough, the chatbot answers "not enough information" without calling the generation model, and returns no sources.
- Every answer returns its sources (the catalog items used).
- Conversation memory: chat sessions and messages are persisted per user; the last turns are sent to the model as context. Users can list and read their own sessions.
- Embedding calls are recorded as usage events of a "Titan Embeddings" service; they count in the consumption total but only the generation step enforces the limit.
- Web: administrators can view and edit each user's token limit from the users screen, with a "Sin límite" checkbox that stores `null`.
- Web: a chat screen with session list, message thread, source links to the catalog and remaining tokens.

## Capabilities

### New Capabilities

- `item-embeddings`: vector representation of catalog items, automatic refresh on write, admin reindex, similarity search.
- `rag-chat`: grounded question answering over the catalog with sources, a "not enough information" answer and short-term session memory.
- `chat-history`: persistence and per-user consultation of chat sessions and messages.
- `web-chat-ui`: chat screen in the web app.

### Modified Capabilities

- `user-management`: the administration screen shows and edits the token limit.
- `item-catalog`: creating or updating an item refreshes its embedding without making the write fail when the embedding provider is unavailable.

## Impact

- API: new `src/chat/` module and `src/ai/embeddings/` folder; `ItemsService` calls the embedding refresh; `AiModule` exports the embedding service. New endpoints `POST /chat/messages`, `GET /chat/sessions`, `GET /chat/sessions/:id`, `POST /ai/reindex`.
- Database: additive migration (`Item.embedding vector(1024)`, `ChatSession`, `ChatMessage`); the pgvector extension is already enabled.
- Infra: the IAM policy must also allow `bedrock:InvokeModel` on the Titan Text Embeddings v2 model; after deploy the admin runs the reindex once.
- Web: new `/chat` route and menu entry.
- Tests: chat history register/query (required by the brief) with Bedrock and the vector search mocked.
- Not included: agents (changes 6 and 7), admin usage reports (change 8).
