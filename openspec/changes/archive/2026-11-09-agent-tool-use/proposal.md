# Proposal

## Why

The course brief asks for AI services that "determine what information they need, select the queries or functions to call and use their results to continue until the answer is built". Today both agents run a fixed pipeline written in code (retrieve, one model call, validate), so the model never decides which function to call. This change turns them into real tool-using agents without giving up the code-side validation that keeps answers grounded in the catalog.

## What Changes

- Add a tool-use conversation to the model provider and to the AI gateway, so a model can request functions and receive their results (the existing text generation used by the chat and `/ai/generate` is untouched).
- Add a bounded agent loop: the model may call catalog tools several times and then writes its answer; each model call goes through the gateway, so service switch, token limit and usage recording apply per step.
- Add catalog tools the model can call: search the catalog by meaning, read one item, find a series by name and list the volumes of a series.
- Rework the recommender agent so the model searches, inspects candidates and compares them before recommending; ids it returns are still validated against the items the tools actually returned.
- Rework the reading-order agent so the model finds the series, lists its volumes and proposes the order; the code accepts the order only if it is a valid permutation that respects issue numbers, and otherwise uses the deterministic sort.
- Keep the endpoints, request and response shapes, the `/agents` screen, reports and Power BI unchanged. A request now makes several model calls, so its token cost and latency grow and the usage reports count one request per model call.
- Update the README and the final report to describe the agents as tool-using agents.
- **BREAKING**: none for API clients. Internal: `ModelProvider` gains a method that test doubles must implement.

## Capabilities

### New Capabilities
- `agent-tool-loop`: the bounded loop in which a model calls catalog tools through the gateway, with step limit, tool error isolation and per-step quota.

### Modified Capabilities
- `bedrock-generation`: the gateway also offers tool-use conversations with the same service, quota and usage rules as text generation.
- `recommender-agent`: candidates come from tools chosen by the model; validation is against the items returned by the tools.
- `reading-order-agent`: the model resolves the series and proposes the order through tools; the code validates it and keeps the deterministic order as fallback.

## Impact

- API: `apps/api/src/ai/providers` and `apps/api/src/ai/gateway` (new method), `apps/api/src/agents` (loop, tools, both services and prompts rewritten). No schema or migration changes; no new environment variables or dependencies.
- Web, reports, Power BI, API keys: no changes.
- Tests: new tests for the gateway method, the loop, the tools and both agents, with the model provider mocked; chat and gateway tests must stay green.
- Docs: README agents section and report section 4; main spec Purpose of `reading-order-agent` updated at archive.
- Cost: each agent request makes between 2 and 5 model calls instead of one.
