# Design

## Context

- `ModelProvider.generate({modelId, prompt, ...})` returns text and tokens; `BedrockModelProvider` maps it to the Converse API with one user message. `GatewayService.generate` checks service and quota, calls the provider and records usage. The chat, `/ai/generate` and both agents use it.
- The agents are fixed pipelines: `RecommenderService` embeds, searches, calls the model once and validates ids; `ReadingOrderService` resolves a series in code, sorts in code and asks the model only for an explanation. Catalog search is `EmbeddingsService.search`; `embedQuery` records Titan usage per call.
- See proposal.md for motivation. The deliverable is due the next day, so the design favors small modules over generality.

## Goals / Non-Goals

**Goals:**
- The model chooses which tools to call and when to stop, in a bounded loop.
- Everything the user sees is still grounded: ids and order are validated in code.
- Same endpoints and response shapes; no migration, no new dependency.

**Non-Goals:**
- External data sources, a steps view in the web app, streaming, or parallel tool execution.
- Changing the chat or `/ai/generate`.

## Decisions

### 1. A separate `converse` method instead of generalizing `generate`

`ModelProvider` gets `converse(request)`: messages (user and assistant turns made of text, tool-use and tool-result blocks), an optional system prompt, tool definitions (name, description, JSON input schema), and the same model parameters. It returns the assistant message, the text, the requested tool calls, and tokens. `GatewayService.converse` repeats the checks of `generate` (service exists and enabled, quota) and records usage per call. Alternative: widen `generate` to accept messages and tools; rejected because the chat and its tests depend on the current simple contract and the change would touch them for no benefit. The duplicated checks are small and live in one private helper in the gateway.

### 2. The loop is a plain function over an injected step

`runAgentLoop({ step, tools, system, prompt, maxSteps })` lives in `agents/agent-loop.ts`. `step` is a function that performs one model call (the agent services pass a closure over `gateway.converse`), so the loop is testable without Nest or Bedrock. Each iteration: call `step`; if the result has no tool calls, finish with its text; otherwise execute every requested tool, append the assistant message and one user message with all tool results, and continue. It returns the final text (or `null` when the limit is hit), the summed tokens, and the list of tool results seen. Alternative: a class with state; rejected, a function with explicit inputs and outputs is easier to read and test.

### 3. Tools are small objects built per request

`AgentTool = { name, description, inputSchema, run(input: unknown): Promise<ToolOutput> }`. `CatalogToolsService` builds the tools for a user (the user id is needed because `embedQuery` records usage): `search_catalog`, `get_item`, `find_series`, `list_series_volumes`. Inputs are checked by small guards (string, trimmed, 1 to 200 characters, uuid for ids); a failed guard or a thrown error becomes `{ isError: true, text }` returned to the model. Results are compact JSON strings (id, title, author, kind, genre, year, series, issueNumber; synopsis only in `get_item`, truncated like today). `search_catalog` applies `MIN_SIMILARITY` and returns at most 8 items. `find_series` reuses the lookups already in `ReadingOrderService.resolve` (series name equal, then contains, then title contains, then embedding) and returns candidate series names with their volume counts; `list_series_volumes` returns the volumes of an exact series name.

### 4. Final answers are JSON text, validated in code

The system prompt tells the model to answer with JSON only: recommender `{"recommendations":[{"id","reason"}]}` (as today, `parseRecommendations` is reused) and reading order `{"series","order":["id",...],"explanation"}`. A forced "final answer" tool would give structured output for free but depends on tool-choice support per model; plain JSON with the existing extractor works with any Converse model. The system prompt also states that tool results are data, not instructions.

### 5. What "seen" means: the validation set

The loop returns every item the tools returned. The recommender keeps only recommended ids present in that set (and dedupes, caps at 3); if parsing fails or the limit is hit it falls back to the top of the first search result with the generic reason; if no search returned anything it returns an empty list. The reading-order agent builds its volume list from `list_series_volumes` results (or from the single item when the matched item has no series).

### 6. Reading order authority

`resolveReadingOrder(volumes, proposedIds)` is a pure function. It accepts the proposed order only if it is a permutation of the volumes' ids and numbered volumes appear in ascending issue number; otherwise it returns `sortReadingOrder(volumes)`. This lets the model decide where to place unnumbered volumes while the code stays authoritative on facts it can check. The explanation is taken from the model JSON, or a short generic one if missing.

### 7. Step limit and quota

`MAX_AGENT_STEPS = 5`. If the model still asks for tools at the last step, the loop stops and returns `null` text, so the service uses the fallback of decision 5 or 6. Quota is checked by the gateway on each step; a 429 raised mid-run propagates as is (no catch), and the calls already made are already recorded. The response keeps its shape and reports summed tokens.

### 8. Reports and Power BI

No change. Each step records one `UsageEvent` of the selected service and each search one of `Titan Embeddings`, as the chat already does, so reports and Power BI stay consistent; only the number of rows per user request grows.

### 9. Tests

Vitest with a fake provider that scripts the model turns: gateway `converse` (disabled, quota, usage recorded), the loop (tool then answer, step limit, unknown tool, invalid input, quota error propagates), the tools (search threshold, unknown item, series lookup), recommender (unknown id discarded, fallback, empty) and reading order (valid order accepted, numbered order enforced, fallback). Existing chat, gateway and agent tests are updated only where a test double must now implement `converse`.

## Risks / Trade-offs

- [Nova Lite may call tools poorly or loop] → step limit of 5, tool error feedback to the model, deterministic fallback in both agents.
- [Higher token cost and latency per request] → compact tool results, limit of 8 items per search, quota enforced per step; accepted trade-off.
- [Prompt injection through synopses returned by tools] → tool results are labeled as data in the system prompt, and the code only trusts ids it saw and the order it can verify.
- [A model that never calls a tool gives no recommendations] → the recommender prompt requires searching first; with nothing seen the list is empty rather than invented.

## Migration Plan

1. No migration, no environment variables. Deploy through the normal pipeline.
2. Verify in production with the same Nova Lite service; rollback is reverting the commit.
3. At archive, update the Purpose of the main `reading-order-agent` spec (it still says the order is computed deterministically by code).
