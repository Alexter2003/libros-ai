# Tasks

## 1. Provider and gateway

- [x] 1.1 Add the tool-use types and an abstract `converse` method to `ModelProvider` (messages with text, tool-use and tool-result blocks, system prompt, tool definitions, result with text, tool calls, assistant message and tokens), and implement it in `BedrockModelProvider` with the Converse `toolConfig`, sharing the usage extraction and the `503` mapping with `generate`. Manual check: `pnpm typecheck` passes and the chat still answers in the web app.
- [x] 1.2 Add `GatewayService.converse(userId, request)` with the same service, quota and usage rules as `generate` (shared private helper, no duplicated checks), and update the test doubles that implement `ModelProvider`. Add Vitest tests for disabled service (422), quota (429), usage recorded and `generate` unchanged. Manual check: `pnpm test` in `apps/api` passes.

## 2. Agent loop

- [x] 2.1 Create `agents/agent-loop.ts` with `AgentTool`, `runAgentLoop` (injected `step`, `MAX_AGENT_STEPS = 5`, summed tokens, tool results seen, tool errors returned to the model, `null` text at the limit) and constants in `agents.constants.ts`. Add Vitest tests with a scripted fake model: tool then answer, unknown tool, invalid input, step limit, quota error propagates. Manual check: the new tests pass.

## 3. Catalog tools

- [x] 3.1 Create `agents/catalog-tools.ts` with `CatalogToolsService` building `search_catalog`, `get_item`, `find_series` and `list_series_volumes` for a user (input guards, compact JSON results, minimum similarity, 8-item cap), moving the series lookups out of `ReadingOrderService`. Register it in `AgentsModule`. Add Vitest tests: search threshold, unknown item, series by name, by title and by similarity. Manual check: the tests pass.

## 4. Recommender agent (B2)

- [x] 4.1 Rewrite `RecommenderService` to run the loop with `search_catalog` and `get_item`, a system prompt that requires searching first and treats tool results as data, and validation of the final JSON against the items seen (reusing `parseRecommendations`, with fallback to the first search and empty list when nothing was found). Keep the endpoint and response shape. Add Vitest tests: unknown id discarded, unparseable output, nothing found, tokens summed. Manual check: in `/agents`, "me gustan las historias de superhéroes oscuras" returns up to 3 titles with reasons, nonsense text returns none, and a user with limit 0 gets the limit message. Captura de evidencia: a recommendation and the empty case.

## 5. Reading-order agent (B1)

- [x] 5.1 Add the pure `resolveReadingOrder(volumes, proposedIds)` in `reading-order.ts` (permutation and issue-number check, fallback to `sortReadingOrder`) with Vitest tests. Manual check: the tests pass.
- [x] 5.2 Rewrite `ReadingOrderService` to run the loop with `find_series` and `list_series_volumes`, parse the final JSON, apply `resolveReadingOrder` and return the same response shape (`NO_SERIES_EXPLANATION` when nothing is found, single item when it has no series). Add Vitest tests: query by title returns the whole series, invalid model order falls back, step limit falls back, nothing found. Manual check: "The Lord of the Rings" and a single title of a series return the same ordered list, and a nonsense query returns none. Captura de evidencia: ordered response for a series and the empty case.

## 6. Documentation

- [x] 6.1 Update the agents sections of the README (how the loop and tools work, step limit, validation, higher token use per request) and `openspec/specs/reading-order-agent/spec.md` Purpose at archive time. Manual check: the README reads correctly and `openspec validate agent-tool-use --strict` passes.
- [x] 6.2 Update section 4 of the final report (Word) and its agents figure to describe tool-using agents. Manual check: the report reads correctly and the PDF is exported again.

## 7. Release

- [ ] 7.1 Run lint, typecheck and tests, deploy, and check in production that both agents answer, that reports and Power BI still match the web report after using them, and that usage rows grow as expected. Manual check: `/usage/me` and `/admin/usage` show the extra calls and Power BI refreshes without changes. Captura de evidencia: both agents in production and the usage report after them.
