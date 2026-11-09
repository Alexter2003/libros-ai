# Libros — books and comics app with AI services

pnpm monorepo: `apps/api` (NestJS + Prisma + PostgreSQL/pgvector) and `apps/web` (Vite + React).

## Local development

```bash
cp .env.example .env        # fill in values
pnpm install
pnpm dev                    # starts Postgres (Docker), the API (:3000) and the web app (:5173)
pnpm --filter api prisma:migrate   # first run: applies migrations (enables pgvector)
```

- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/health

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Postgres + API + web together |
| `pnpm build` | builds both apps |
| `pnpm typecheck` | TypeScript strict checks |
| `pnpm lint` | ESLint (explicit `any` is an error) |
| `pnpm test` | runs tests of every app that defines them (Vitest, Bedrock mocked) |
| `pnpm --filter api db:seed` | loads the demo catalog (idempotent) |
| `pnpm covers:fetch` | downloads missing demo covers (add `--force` to redo all) |

## Production

`deploy/docker-compose.yml` runs Postgres (pgvector), the API and a Caddy image that serves the web build and proxies the API. The GitHub Actions workflow (`.github/workflows/ci.yml`) checks both apps and deploys to Lightsail over SSH only when checks pass. Server setup: `/opt/libros` with `docker-compose.yml` and a `.env` containing `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` `WEB_ORIGIN=https://libros.alexvyumes-dev.com`, `JWT_SECRET` (32+ chars, `openssl rand -hex 32`), `JWT_EXPIRES_IN` (e.g. `8h`), `ADMIN_EMAIL` and `ADMIN_PASSWORD`, plus the AI variables described in the AI gateway section.

## Authentication

Users log in with email and password and receive a JWT access token (`Authorization: Bearer`). Roles are `ADMIN` and `USER`; only administrators create, edit and delete accounts (`/users`). On startup, if no administrator exists, one is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; afterwards those variables are not used again, so change the password from the users screen. Use a strong `ADMIN_PASSWORD` in production.

## Catalog

`Item` is a book or a comic (`kind`: `BOOK` or `COMIC`). Any authenticated user can read it; only administrators write it.

| Endpoint | Access | Notes |
|---|---|---|
| `GET /items` | any user | `page`, `pageSize` (max 50), `kind`, `q` (title, author or series) |
| `GET /items/:id` | any user | |
| `POST /items`, `PATCH /items/:id`, `DELETE /items/:id` | admin | `series` and `issueNumber` only for comics; `409` on duplicate ISBN or duplicate title, author and kind |

### Demo data

`pnpm --filter api db:seed` loads about 55 titles (eight of them series with three numbered volumes) from `apps/api/prisma/seed-data.ts`. It upserts by title, author and kind: new titles are created, existing ones are refreshed to the demo values (so manual edits to a demo row are overwritten), and items created through the app are never touched. Run it as many times as needed. On the server, from `/opt/libros`: `docker compose exec api pnpm db:seed`.

### Covers

Demo covers are WebP files in `apps/web/public/covers/`, listed in `apps/api/prisma/covers.json`, so the app never depends on a third-party host. Items without a cover, or whose image fails to load, show a generated placeholder. To refresh them, run `pnpm covers:fetch` (Open Library first, Google Books as fallback) and review the images.

> **Copyright notice:** the cover images are copyrighted by their respective publishers and are included for academic purposes only (university course project). They are not licensed for any commercial use.

## AI gateway

Every model call goes through one gateway that checks the service, checks the user's token quota, calls Amazon Bedrock (Converse API) and stores the tokens reported by the model.

| Endpoint | Access | Notes |
|---|---|---|
| `GET /ai-services`, `GET /ai-services/:id` | any user | users see enabled services only; admins see all |
| `POST /ai-services`, `PATCH /ai-services/:id`, `DELETE /ai-services/:id` | admin | `enabled` turns a service on or off; `409` on duplicate name; usage history survives deletion |
| `PATCH /users/:id/token-limit` | admin | `{ "tokenLimit": 5000 }` or `null` for unlimited; total of input plus output tokens |
| `POST /ai/generate` | any user | `{ serviceId, prompt }`; `422` disabled service, `429` limit reached, `503` provider error |
| `GET /ai/quota` | any user | own limit, tokens used and tokens remaining |

The check runs before the call and usage is stored after it, so a user can exceed the limit by at most one call. `pnpm --filter api db:seed` also creates the default `Nova Lite` service (existing services are never overwritten).

### AWS configuration

Set these in `.env` (and in `/opt/libros/.env` on the server, owner `deploy`, mode 600): `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `BEDROCK_MODEL_ID` (model id for the seeded service). Use an IAM user, never root keys, with only this permission on the model you use (replace `ACCOUNT_ID`, the model id and the inference profile id with yours):

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

The model must also be available to the account in the Bedrock console. The Titan Text Embeddings v2 line in the policy is needed by the catalog chatbot.

## Catalog chatbot (RAG)

The chatbot answers only from catalog items. Each item has a 1024-dimension Titan Text Embeddings v2 vector (pgvector column `Item.embedding`). A question is embedded, the 5 closest items by cosine similarity are retrieved, and the answer is generated through the AI gateway, so the on/off switch and the token limit apply. If no item reaches the minimum similarity (`MIN_SIMILARITY` in `apps/api/src/chat/rag.constants.ts`, currently 0.18) the answer is "not enough information" and the model is not called.

| Endpoint | Access | Notes |
|---|---|---|
| `POST /chat/messages` | any user | `{ message, serviceId, sessionId? }`; returns `answer`, `grounded`, `sources`, `sessionId` and tokens; `404` unknown or foreign session, `422` disabled service, `429` limit reached, `503` provider error |
| `GET /chat/sessions`, `GET /chat/sessions/:id` | any user | own sessions and messages only; foreign sessions return `404` |
| `POST /ai/reindex` | admin | generates the missing embeddings; `?all=true` regenerates every item; returns `{ indexed, failed, total }` |

Embeddings refresh automatically when an item is created or its title, author, kind, genre, year, series or synopsis change; if Bedrock fails the item is still saved and the embedding stays empty until the next reindex. Embedding calls are stored as usage of the service `Titan Embeddings` and count in the consumption total. The seed does not call Bedrock: after seeding a new environment, log in as admin and run `POST /ai/reindex` once.

Design reference: `DESIGN.md`.

## AI agents

Two task-focused agents run on top of the catalog and go through the same gateway as the chat, so service on/off, token limits and usage recording apply. Both are authenticated and take an enabled `serviceId`; the web screen is `/agents`.

| Endpoint | What it does |
|---|---|
| `POST /agents/recommend` `{description, serviceId}` | Retrieves the 8 most similar items (same embeddings and minimum similarity as the chat), asks the model to pick up to 3 and write a short Spanish reason for each. Ids the model returns that were not candidates are discarded, and unparseable output falls back to the top candidates. Nothing relevant means an empty list and no generation tokens. |
| `POST /agents/reading-order` `{query, serviceId}` | Resolves the series by name, then by title, then by embedding similarity. The order is computed in code (issue number, then year, then title); the model only writes a short explanation of the already sorted list. |

