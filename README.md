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
| `pnpm --filter api db:seed` | loads the demo catalog (idempotent) |
| `pnpm covers:fetch` | downloads missing demo covers (add `--force` to redo all) |

## Production

`deploy/docker-compose.yml` runs Postgres (pgvector), the API and a Caddy image that serves the web build and proxies the API. The GitHub Actions workflow (`.github/workflows/ci.yml`) checks both apps and deploys to Lightsail over SSH only when checks pass. Server setup: `/opt/libros` with `docker-compose.yml` and a `.env` containing `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` `WEB_ORIGIN=https://libros.alexvyumes-dev.com`, `JWT_SECRET` (32+ chars, `openssl rand -hex 32`), `JWT_EXPIRES_IN` (e.g. `8h`), `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

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

`pnpm --filter api db:seed` loads about two dozen titles from `apps/api/prisma/seed-data.ts`. It upserts by title, author and kind: new titles are created, existing ones are refreshed to the demo values (so manual edits to a demo row are overwritten), and items created through the app are never touched. Run it as many times as needed. On the server, from `/opt/libros`: `docker compose exec api pnpm db:seed`.

### Covers

Demo covers are WebP files in `apps/web/public/covers/`, listed in `apps/api/prisma/covers.json`, so the app never depends on a third-party host. Items without a cover, or whose image fails to load, show a generated placeholder. To refresh them, run `pnpm covers:fetch` (Open Library first, Google Books as fallback) and review the images.

> **Copyright notice:** the cover images are copyrighted by their respective publishers and are included for academic purposes only (university course project). They are not licensed for any commercial use.

Design reference: `DESIGN.md`.
