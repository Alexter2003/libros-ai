# Design

## Context

See proposal.md. The RAG chat already provides `EmbeddingsService.embedQuery/search` and `GatewayService.generate(userId, {serviceId, prompt})`, which enforces service state and quota and records usage. Items have `series` and `issueNumber` columns (nullable). The web app has `ChatPage` as a pattern for service selector, quota text and error mapping.

## Goals / Non-Goals

**Goals:**
- Two task-shaped agents with structured output, reusing retrieval and the gateway.
- The model never decides facts that code can decide (ordering, validity of ids).

**Non-Goals:**
- Tool-calling loops or multi-step autonomous planning (single retrieve-then-generate step per agent).
- External sources (web search, news).
- Persisting agent runs: usage is already recorded as `UsageEvent` by the gateway.

## Decisions

**1. Agents are "retrieve, then constrained generate".** Each agent calls the catalog as its tool (embedding search or SQL), builds a prompt from the retrieved data and calls the gateway. Alternative: Bedrock Converse tool use with a loop (more agentic, more tokens, harder to bound in one day). Rejected for time; the pipeline is easy to defend and cheap.

**2. Recommender asks for JSON and validates it.** Prompt lists up to 8 candidates with ids and asks for `{"recommendations":[{"id","reason"}]}` (max 3). A pure `parseRecommendations(text, candidates)` extracts the first JSON object, discards ids not in candidates and caps at 3; on failure it falls back to the top 3 candidates with a generic reason. This is the anti-hallucination guarantee. Minimum similarity reuses `MIN_SIMILARITY` (0.18); below it the agent returns empty without generation.

**3. Reading order is computed in code.** Series resolution: case-insensitive `contains` on `series`, then on `title`; otherwise embed the query and take the top item above `MIN_SIMILARITY`. Items are sorted by `issueNumber` (nulls last), `year`, `title` by a pure function. The model only writes a 2-3 sentence Spanish explanation of the order given the already-sorted list. Alternative: let the model order (can reorder or invent); rejected.

**4. Module layout.** `src/agents/` with `agents.module.ts` (imports `AiModule`), `agents.controller.ts` (`POST /agents/recommend`, `POST /agents/reading-order`, HTTP only), `recommender.service.ts`, `reading-order.service.ts`, `agent-prompts.ts` and `reading-order.ts` (pure helpers). Agent 2 files are independent of agent 1 so they can be cut.

**5. Web.** `AgentsPage` at `/agents` with two tabs, reusing the service selector, quota text and error mapping approach of `ChatPage`.

**6. Catalog expansion stays a hand-written seed.** About 30 new entries are added to `seed-data.ts` (no external dataset: synopses stay controlled and the seed stays idempotent). Series are chosen for the reading-order agent (volumes 2 and 3 of series already present, plus novel trilogies) and the rest add genre variety. Covers use the existing `pnpm covers:fetch` pipeline and are reviewed by eye. Existing entries that belong to a series get `series` and `issueNumber`.

## Risks / Trade-offs

- Cover lookup can pick a wrong edition or fail for volume titles. Mitigation: review images and use cover id overrides or leave an item without cover (the seed supports it).
- Quota is checked by the gateway only when generating; embedding the query before still costs a few tokens. Same trade-off as the chat.
- Model may wrap JSON in prose: the parser extracts the first `{...}` block and falls back safely.
