# Proposal

## Why

The course brief asks for two AI agents on top of the catalog. The RAG chatbot answers free questions; agents are task-focused: each takes a small input, uses the catalog as its tool and returns a structured result. They must reuse the existing gateway so service on/off, token limits and usage recording keep applying.

## What Changes

- **Agent 1, recommender**: from a free-text description of what the user likes, retrieves candidate items by semantic similarity and returns up to 3 recommendations, each with a short reason in Spanish. Recommended ids are validated against the retrieved candidates so the model cannot invent titles.
- **Agent 2, reading order**: given a series or title, returns the items of that series in reading order (ordered by issue number, then year, deterministically in code) plus a short Spanish explanation written by the model.
- Both agents are authenticated endpoints that take an enabled `serviceId`, run through `GatewayService` and report tokens used.
- New web screen `/agents` with one tab per agent, showing results with links to the catalog and the remaining tokens.
- Expand the demo catalog by about 30 titles, all with local covers, including several series with consecutive numbered entries so the reading-order agent has real data.
- Agent 2 is delivered as a separate task group so it can be cut without touching agent 1.

## Capabilities

### New Capabilities
- `recommender-agent`: recommendations grounded in retrieved catalog items, with validated ids and reasons.
- `reading-order-agent`: deterministic reading order of a series with a model-written explanation.
- `web-agents-ui`: `/agents` screen to run both agents.

### Modified Capabilities
- `catalog-demo-seed`: the demo catalog grows from 20-30 to 20-60 titles and must include series with three or more numbered entries.

## Impact

- API: new `src/agents/` module (controller, services, pure prompt/parse helpers), imports `AiModule`; `AppModule` registers it. No schema or migration changes.
- Seed: new entries in `apps/api/prisma/seed-data.ts`, new cover files in `apps/web/public/covers/` and `covers.json`; production needs the seed and `POST /ai/reindex` after deploy.
- Web: `AgentsPage`, route, menu card, API client functions.
- Reuses `EmbeddingsService`, `GatewayService`, `TokenQuotaService`; no new dependencies and no new AWS permissions.
