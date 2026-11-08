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
| `pnpm test` | runs tests of every app that defines them |

## Production

`deploy/docker-compose.yml` runs Postgres (pgvector), the API and a Caddy image that serves the web build and proxies the API. The GitHub Actions workflow (`.github/workflows/ci.yml`) checks both apps and deploys to Lightsail over SSH only when checks pass. Server setup: `/opt/libros` with `docker-compose.yml` and a `.env` containing `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `WEB_ORIGIN=https://libros.alexvyumes-dev.com`.

Design reference: `DESIGN.md`.
