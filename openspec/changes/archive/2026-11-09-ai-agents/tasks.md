# Tasks

## 1. Shared agent plumbing

- [x] 1.1 Create `src/agents/` with `AgentsModule` (imports `AiModule`, registered in `AppModule`) and `AgentsController` skeleton with Swagger tags. Manual check: the API boots and `/docs` shows the `agents` tag.

## 2. Catalog expansion

- [x] 2.1 Add about 30 entries to `apps/api/prisma/seed-data.ts` (volumes 2 and 3 of Saga, The Sandman, Y: The Last Man and Bone; the Mistborn, Dune, Foundation and Lord of the Rings sequels; plus single titles in new genres), set `series` and `issueNumber` on existing entries that belong to a series, and keep every synopsis at two or more sentences. Manual check: `pnpm --filter api db:seed` reports the new count and is idempotent on a second run, and at least five series have three or more numbered entries.
- [x] 2.2 Run `pnpm covers:fetch`, review the downloaded covers and fix wrong or missing ones (override ids or leave without cover). Manual check: the catalog shows the new covers and no item shows a wrong one. Captura de evidencia: catalog grid with new covers.
- [x] 2.3 Seed and reindex: run the seed and `POST /ai/reindex` locally, then in production after deploy. Manual check: the catalog count matches the seed and the chat finds a new title. Captura de evidencia: reindex response with the new total.

## 3. Agent 1: recommender

- [x] 3.1 Add pure helpers in `agent-prompts.ts`: `buildRecommendPrompt(candidates, description)` and `parseRecommendations(text, candidates)` (first JSON object, discard unknown ids, cap 3, fallback to top candidates with a generic reason). Manual check: unit tests for valid JSON, unknown id, prose around JSON and invalid output pass.
- [x] 3.2 Implement `RecommenderService` and `POST /agents/recommend` (DTO: `description` max 1000, `serviceId` UUID): embed, search top 8, filter by `MIN_SIMILARITY`, empty result without generation, otherwise generate through `GatewayService` and parse. Manual check: a taste description returns up to 3 recommendations with reasons, an unrelated text returns an empty list with zero tokens, a user with limit 0 gets 429. Captura de evidencia: recommendation response, empty case, and the 429.

## 4. Agent 2: reading order (cuttable group)

- [x] 4.1 Add pure `sortReadingOrder(items)` (issueNumber asc nulls last, then year, then title) in `reading-order.ts` and the explanation prompt builder. Manual check: unit test with issues 3, 1, 2 and an unnumbered item passes.
- [x] 4.2 Implement `ReadingOrderService` and `POST /agents/reading-order` (DTO: `query` max 200, `serviceId` UUID): resolve series by series name, then title, then embedding fallback; sort in code; generate the explanation through `GatewayService`; no match returns empty items without generation. Manual check: querying a series name and one of its titles returns the same ordered list; a nonsense query returns empty. Captura de evidencia: ordered response for a series and the empty case.

## 5. Automated tests

- [x] 5.1 Vitest tests in `test/agents/` with fake embedding and model providers: recommender discards unknown ids, falls back on invalid output, skips generation below the threshold; reading order sorts correctly and records usage via the gateway. Manual check: `pnpm test` in `apps/api` passes.

## 6. Web

- [x] 6.1 Add API client functions and types for both agents in `apps/web/src/lib/api.ts`. Manual check: the web builds without type errors.
- [x] 6.2 Build `AgentsPage` at `/agents` (tabs, service selector, quota text, result cards with catalog links, friendly 422/429/503 messages), route and menu card. For the reading-order tab, include it only if group 4 is delivered. Manual check: run each agent, open a result in the catalog, see the 429 message with a limit-0 user. Captura de evidencia: each tab with results and the limit message.

## 7. Docs and release

- [x] 7.1 Document both agents (what they do, endpoints, why ids and ordering are validated in code) in the README and run `openspec validate ai-agents --strict`. Manual check: validation passes and the README section reads correctly.
