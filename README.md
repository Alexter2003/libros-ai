# Libros & Cómics AI

A web application to browse, search and get recommendations about a catalog of books and comics, powered by generative AI on Amazon Bedrock: a RAG chatbot, two task-focused AI agents, per-user token quotas and usage reports that external tools such as Power BI can consume.

- **Live app:** https://libros.alexvyumes-dev.com
- **API documentation (Swagger):** https://apilibros.alexvyumes-dev.com/docs

## Features

- **Catalog** of books and comics with covers, series and issue numbers; full CRUD for administrators.
- **Catalog chatbot (RAG)** that answers only from the catalog, cites its sources and remembers the conversation.
- **Recommender agent**: describe what you like and get up to three titles with a reason for each.
- **Reading-order agent**: give a series or a title and get the order to read it, with an explanation.
- **Authentication and roles** (`ADMIN`, `USER`) with JWT.
- **Token control**: per-user limits, on/off switch per AI service, and a gateway that records every model call.
- **Usage reports**: personal consumption for users, full audit with filters for administrators, and read-only report endpoints for external tools using revocable API keys.
- **Documented API** with Swagger/OpenAPI, automated tests and a CI/CD pipeline that deploys only when checks pass.

## Tech stack

| Layer | Technology |
|---|---|
| Web | React 19, Vite, Tailwind CSS, React Router |
| API | NestJS, Prisma ORM, class-validator, Swagger |
| Database | PostgreSQL 17 with the `pgvector` extension |
| AI | Amazon Bedrock: Nova Lite (generation) and Titan Text Embeddings v2 (vectors) |
| Tooling | pnpm workspaces, TypeScript (strict), ESLint, Vitest |
| Infrastructure | Docker Compose, Caddy (TLS and reverse proxy), AWS Lightsail, GitHub Actions |

## Architecture

```
 Browser (React SPA) ──HTTPS──► Caddy ──┬─► static web build
 Power BI / curl ──X-API-Key───►        └─► NestJS API ──► PostgreSQL + pgvector
                                                │
                                                └──► Amazon Bedrock (Nova Lite, Titan Embeddings v2)
```

## Repository structure

```
apps/
  api/            NestJS API
    prisma/       schema, migrations, demo seed and cover manifest
    src/          auth, users, items, ai (gateway, quotas, embeddings), chat, agents, usage, api-keys
    test/         Vitest tests (Bedrock mocked)
  web/            Vite + React single-page app
    public/covers demo cover images (WebP)
deploy/           production Docker Compose, Caddyfile, web image, local dev database
scripts/          cover downloader
openspec/         specs and archived changes (spec-driven development)
DESIGN.md         visual design reference for the web app
```

## Getting started (local development)

### Prerequisites

- Node.js 22 or newer
- [pnpm](https://pnpm.io) 10 (`corepack enable` is enough)
- Docker (runs the local PostgreSQL with `pgvector`)
- Optional: an AWS account with Amazon Bedrock access, needed only for the AI features (see [AWS configuration](#aws-configuration))

### 1. Install and configure

```bash
git clone https://github.com/Alexter2003/libros-ai.git
cd libros-ai
pnpm install
cp .env.example .env
```

Edit `.env`. The defaults work for local development except `JWT_SECRET` (at least 32 characters; generate one with `openssl rand -hex 32`) and `ADMIN_PASSWORD`. See [Environment variables](#environment-variables).

### 2. Start the database

```bash
pnpm db:up
```

This starts PostgreSQL 17 with `pgvector` on `127.0.0.1:5432` using the credentials in `.env`.

### 3. Run the migrations

```bash
pnpm --filter api prisma:migrate
```

This applies every migration (the first one enables `pgvector`) and generates the Prisma client.

### 4. Load the demo data

```bash
pnpm --filter api db:seed
```

It loads the demo catalog (54 titles with covers) and creates the default `Nova Lite` AI service. The seed is idempotent: run it as many times as needed. It does not call Bedrock.

### 5. Start the app

```bash
pnpm dev
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Health check | http://localhost:3000/health |

On startup, if no administrator exists, the API creates one from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Log in at http://localhost:5173 with those credentials.

### 6. Index the catalog for the chatbot (requires AWS credentials)

The chatbot and the recommender search by meaning, so each catalog item needs an embedding. After configuring AWS, log in as administrator and call `POST /ai/reindex` once (from Swagger: Authorize with the token from `POST /auth/login`, then run `POST /ai/reindex`). New or edited items are indexed automatically afterwards.

## Environment variables

All variables live in a single `.env` at the repository root, used by the API and by Vite.

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | yes | Credentials of the local database container |
| `DATABASE_URL` | yes | Connection string used by the API and Prisma |
| `PORT` | no | API port (default `3000`) |
| `WEB_ORIGIN` | yes | Allowed browser origins, comma separated (`http://localhost:5173` locally) |
| `JWT_SECRET` | yes | Signing secret, at least 32 characters |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `8h`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | First administrator, created only when no administrator exists (password 8 to 72 characters) |
| `AWS_REGION` | no | Bedrock region (default `us-east-2`) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | for AI | IAM user credentials |
| `BEDROCK_MODEL_ID` | for AI | Model or inference profile used by the seeded `Nova Lite` service |
| `BEDROCK_EMBEDDING_MODEL_ID` | no | Embedding model (default `amazon.titan-embed-text-v2:0`) |
| `VITE_API_URL` | no | API URL used by the web app (default `http://localhost:3000`) |

Without AWS credentials the app still runs: catalog, users, reports and API keys work, and AI endpoints answer `503`.

### AWS configuration

Use a dedicated IAM user (never root keys) with only the permission to invoke the models you use, and make sure those models are enabled for the account in the Bedrock console. Replace the placeholders with your values:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["bedrock:InvokeModel"],
    "Resource": [
      "arn:aws:bedrock:*::foundation-model/MODEL_ID",
      "arn:aws:bedrock:REGION:ACCOUNT_ID:inference-profile/PROFILE_ID",
      "arn:aws:bedrock:REGION::foundation-model/amazon.titan-embed-text-v2:0"
    ]
  }]
}
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the database, the API and the web app together |
| `pnpm db:up` / `pnpm db:down` | Starts / stops the local database |
| `pnpm --filter api prisma:migrate` | Applies migrations in development (creates new ones when the schema changes) |
| `pnpm --filter api db:seed` | Loads the demo catalog and the default AI service (idempotent) |
| `pnpm build` | Builds both apps |
| `pnpm typecheck` | TypeScript strict checks |
| `pnpm lint` | ESLint (explicit `any` is an error) |
| `pnpm test` | Runs the Vitest suite (Bedrock is mocked, no AWS needed) |
| `pnpm covers:fetch` | Downloads missing demo covers (`--force` redoes all) |

## Using the app

| Role | What they can do |
|---|---|
| `USER` | Browse the catalog, chat, use both agents, see their own consumption and conversations (`/usage`) |
| `ADMIN` | Everything above, plus manage the catalog (`/admin/items`) and users with their token limits (`/admin/users`), audit usage and conversations (`/admin/usage`) and manage API keys (`/admin/api-keys`) |

Administrators create the other accounts from the users screen.

## API overview

Interactive documentation is served at `/docs`. Protected endpoints use `Authorization: Bearer <token>` (obtain it with `POST /auth/login`); report endpoints also accept `X-API-Key`.

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | public / authenticated |
| Users | `/users`, `PATCH /users/:id/token-limit` | admin |
| Catalog | `GET /items`, `GET /items/:id`; `POST`, `PATCH`, `DELETE /items` | any user / admin |
| AI services | `/ai-services`, `POST /ai/generate`, `GET /ai/quota`, `POST /ai/reindex` | any user; configuration and reindex are admin |
| Chat | `POST /chat/messages`, `GET /chat/sessions`, `GET /chat/sessions/:id` | any user, own data only |
| Agents | `POST /agents/recommend`, `POST /agents/reading-order` | any user |
| Usage | `GET /usage/me` | any user |
| Reports | `GET /reports/usage`, `GET /reports/chat-sessions` | admin or API key |
| Reports | `GET /reports/chat-sessions/:id` | admin only |
| API keys | `POST`, `GET /api-keys`, `DELETE /api-keys/:id` | admin |
| Health | `GET /health` | public |

Typical error codes: `401` not authenticated, `403` insufficient role, `404` not found or someone else's data, `422` AI service disabled, `429` token limit reached, `503` AI provider unavailable.

## How the AI features work

### AI gateway and quotas

Every model call goes through one gateway that checks the service is enabled, checks the user's token quota, calls Amazon Bedrock (Converse API) and stores the tokens the model reports. Limits count input plus output tokens; a `null` limit means unlimited. The quota is checked before the call and usage is stored after it, so a user can exceed the limit by at most one call. Embedding calls are stored as usage of the `Titan Embeddings` service.

### Catalog chatbot (RAG)

Each item has a 1024-dimension Titan Text Embeddings v2 vector (`Item.embedding`, `pgvector`). A question is embedded, the 5 closest items by cosine similarity are retrieved, and the answer is generated from them. If no item reaches the minimum similarity (`MIN_SIMILARITY`, currently `0.18`, in `apps/api/src/chat/rag.constants.ts`) the app answers that the catalog has no information and the model is not called. Conversations are stored per user and the last six messages are used as memory. Embeddings refresh automatically when an item is created or its content changes; if Bedrock fails, the item is still saved and `POST /ai/reindex` fills the gap.

### Agents

Both agents are tool-using agents. The model receives a small set of catalog tools and decides which to call, in which order and when to stop; every model call goes through the AI gateway, so the service switch, the token limit and the usage recording apply at each step. A request makes between 2 and 5 model calls (limit: 5), so it consumes more tokens than a chat question.

| Tool | What it does |
|---|---|
| `search_catalog` | Searches the catalog by meaning (minimum similarity applies); up to 8 items |
| `get_item` | Reads one item with its synopsis |
| `find_series` | Finds series by name, by a title inside them or by similarity |
| `list_series_volumes` | Lists the volumes of a series with their issue numbers |

- **Recommender** (`POST /agents/recommend`): uses `search_catalog` and `get_item` to look for candidates and compare them, then answers with up to 3 recommendations and a reason in Spanish.
- **Reading order** (`POST /agents/reading-order`): uses `find_series` and `list_series_volumes` to locate the series and its volumes, then proposes the order and explains it.

The model never has the last word on facts. The code discards any recommended id that no tool returned, accepts a proposed reading order only if it contains every volume once and keeps the issue numbers ascending (otherwise it sorts by issue number, year and title), and falls back to deterministic results when the output cannot be parsed or the step limit is reached. A `429` in the middle of a run ends the request; the calls already made stay recorded. Tool inputs and results are treated as untrusted data. The code lives in `apps/api/src/agents/` (`agent-loop.ts`, `catalog-tools.ts` and one service per agent).

### Usage reports and API keys

- `GET /usage/me?from&to`: totals, limit, remaining tokens, per service and per day.
- `GET /reports/usage?userId&serviceId&from&to` and `GET /reports/chat-sessions?userId&from&to`: flat rows for all users. Days are UTC and `from`/`to` are inclusive. Chat session rows contain metadata only, never message text.
- API keys (`lk_...`) are created by an administrator in `/admin/api-keys`. The full key is shown once; only its SHA-256 hash is stored. A key can be revoked at any time and works only on the two flat report endpoints.

```bash
curl -H "X-API-Key: $API_KEY" "https://apilibros.alexvyumes-dev.com/reports/usage?from=2026-11-01"
```

## Demo data and covers

`apps/api/prisma/seed-data.ts` defines the demo catalog (54 titles, eight series with three numbered volumes). The seed upserts by title, author and kind: demo rows are refreshed to their demo values and items created through the app are never touched.

Covers are WebP files in `apps/web/public/covers/`, listed in `apps/api/prisma/covers.json`, so the app does not depend on any third-party host. Items without a cover show a generated placeholder. `pnpm covers:fetch` refreshes them (Open Library first, Google Books as fallback).

> **Copyright notice:** the cover images belong to their respective publishers and are included for academic purposes only (university course project). They are not licensed for commercial use.

## Testing and quality

```bash
pnpm lint
pnpm typecheck
pnpm test
```

The API test suite (Vitest, 79 tests) covers token calculation and quotas, the AI gateway (text and tool-use), chat persistence and isolation between users, the agent loop, the catalog tools and both agents, usage aggregation and API key hashing. Bedrock is mocked, so the suite needs neither AWS nor a database.

## Deployment

Production runs on a single AWS Lightsail instance (Ubuntu) with Docker Compose (`deploy/docker-compose.yml`): PostgreSQL with `pgvector`, the API, and a Caddy image that serves the web build, proxies the API and obtains TLS certificates automatically.

### CI/CD

`.github/workflows/ci.yml` runs on every push and pull request: lint, typecheck, build and tests for both apps. Only pushes to `main` that pass these checks continue to the deploy job, which builds the images, publishes them to GitHub Container Registry tagged with the commit SHA, updates the server over SSH and waits for `GET /health` to answer. The API container applies pending migrations on start (`prisma migrate deploy`).

Required GitHub Actions secrets: `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_SSH_KEY`.

### Server setup (once)

1. Create the instance, attach a static IP, open ports 80, 443 and 22, and point the web and API domains to it. Edit the domains in `deploy/Caddyfile` and in the `env` block of the workflow.
2. Install Docker and create `/opt/libros` owned by the deploy user.
3. Create `/opt/libros/.env` (mode `600`) with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `WEB_ORIGIN` (the web URL), `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `BEDROCK_MODEL_ID` and optionally `BEDROCK_EMBEDDING_MODEL_ID`. Use strong values.
4. Push to `main`; the first deploy brings everything up.

### Seeding production

The seed runs inside the API container (the image already contains the seed script):

```bash
sudo docker ps --format '{{.Names}}'          # find the API container, e.g. libros-api-1
sudo docker exec <api-container> pnpm exec tsx prisma/seed.ts
```

Then log in as administrator and call `POST /ai/reindex` once. The seed is idempotent and can be repeated after catalog changes.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| API fails with `Invalid environment configuration` | A required variable in `.env` is missing or invalid (the message lists which) |
| `extension "vector" is not available` | The database is not the `pgvector` image; use `pnpm db:up` |
| AI endpoints answer `503` | AWS credentials or `BEDROCK_MODEL_ID` missing, or the model is not enabled for the account |
| Chatbot says it has no information | Items are not indexed yet: run `POST /ai/reindex` as administrator |
| Web app cannot reach the API | Check `VITE_API_URL` and that `WEB_ORIGIN` includes the web origin |

## Development workflow

Changes are specified before they are built using OpenSpec: `openspec/specs/` holds the current behavior of each capability and `openspec/changes/archive/` the proposal, design and tasks of every delivered change.
