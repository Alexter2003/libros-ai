# Design

## Context

- The API (NestJS 12, Prisma 6) has `User` and `Role` only. The global `AuthGuard` and `RolesGuard` protect every route by default; `@Roles(Role.ADMIN)` restricts a controller or method. `ValidationPipe` (whitelist, transform) is global. Swagger already declares Bearer.
- The production container runs `prisma migrate deploy` and then the API. The image installs all workspace dependencies (dev included) and copies the whole `apps/api` folder, so `prisma/` and any dev tool are available inside the container.
- Local development uses `deploy/docker-compose.dev.yml` (pgvector/pgvector:pg17, port 5432 bound to `127.0.0.1`).
- The web has `react-router-dom`, `AuthProvider`, `RequireAuth`/`RequireRole`, an `AppShell`, a `request` wrapper that adds the token, and `Button`, `Card`, `Eyebrow`, `Input` primitives. `UsersPage` is the pattern for an admin CRUD screen.
- Tests are limited to course-required areas, so verification here is manual with evidence screenshots. See proposal.md for motivation and scope.

## Goals / Non-Goals

**Goals:**
- A catalog model that the later RAG and agents can read without reshaping it.
- A seed that is safe to run any number of times in any environment.
- Reuse the existing guard, DTO and screen patterns so the change stays small.

**Non-Goals:**
- Embeddings, the `vector` column or any AI call. The `rag-chatbot` change adds its own migration.
- Normalized authors or genres, cover upload from the app, bulk import, soft delete.
- Full-text search engines. Substring search is enough for tens of rows.

## Decisions

### One `Item` table with a `Kind` enum
`Item { id uuid, title, author, kind Kind, genre, year Int, synopsis Text, isbn? unique, coverUrl?, series?, issueNumber? Int, createdAt, updatedAt }` and `enum Kind { BOOK COMIC }`.
- Why: a single CRUD, a single screen and later a single embedding flow. Decided with the user in exploration.
- Alternatives: separate `Book` and `Comic` models (double CRUD and retrieval over two sources); normalized `Author` and `Genre` (more tables and screens, not required by the brief). Normalization can be introduced later by migrating the text columns.
- `series` and `issueNumber` are only valid for comics. The DTO enforces it (a conditional validation on `kind`), and the update path validates the merged result, not only the sent fields.

### Uniqueness: ISBN plus a composite natural key
`isbn` is unique when present (Postgres allows several nulls). A second unique constraint on `(title, author, kind)` acts as the natural key.
- Why: ISBN is optional (many comics lack one), so it cannot be the seed's upsert key by itself. The composite key gives the seed a deterministic `upsert` target and also stops an administrator creating the same title twice by accident.
- Alternatives: a stable `slug` or `externalId` column for demo rows (extra column only to serve the seed); matching by title only (breaks on legitimate repeats such as a book and its comic adaptation). Both rejected.
- Both violations map to a `409 Conflict` through the Prisma `P2002` code, as done for user emails.

### Endpoints
`GET /items?page&pageSize&kind&q`, `GET /items/:id` for any authenticated user; `POST /items`, `PATCH /items/:id`, `DELETE /items/:id` with `@Roles(Role.ADMIN)` on the method, since the controller itself is not admin-only.
- List response: `{ data, total, page, pageSize }`. `pageSize` defaults to 12 and is capped at 50. Order by `title`, then `id` for stable paging.
- Search `q` uses Prisma `contains` with `mode: 'insensitive'` over `title`, `author` and `series`, combined with the optional `kind` filter. No index is added: with tens of rows a sequential scan is faster than maintaining one.
- A new `ItemsModule` follows `UsersModule`: controller handles HTTP, service holds logic, a mapper shapes the response, DTOs use class-validator.

### Seed lives in `prisma/seed.ts`, run with `tsx`
`prisma.seed` in `apps/api/package.json` points to `tsx prisma/seed.ts` and a `db:seed` script exposes it as `pnpm --filter api db:seed`. The titles live in a typed array beside it. For each entry it runs `upsert` on the `(title, author, kind)` key, updating the demo fields, and prints created and updated counts.
- Why: matches the user's request and the Prisma convention, and the production image already has the sources and dev dependencies, so the same command works in production with `docker compose exec api pnpm db:seed`. Upserts mean only new rows are inserted and edited ones refreshed, and nothing else in the table is touched.
- Alternatives: a SQL file with `INSERT ... ON CONFLICT` (also idempotent but harder to keep typed and to extend with the RAG data later); running the seed at API startup like the admin bootstrap (would silently overwrite administrator edits to demo rows on every deploy). The latter is the deciding reason to keep it a manual command.
- New dev dependency: `tsx`. It never runs in the production process, only when the command is invoked.
- The seed does not touch `User`; the first administrator still comes from the startup bootstrap.
- Row content: 20-30 real, well-known titles, about half books and half comics, each with a synopsis of at least two sentences written for retrieval (plot, themes, setting), since the chatbot will quote them. Each entry carries an optional ISBN and the slug of its local cover; the cover URL is stored as `/covers/<slug>.webp`, served by the web app.

### Covers: local WebP files with a generated placeholder
A one-off script `scripts/fetch-covers.ts` reads the seed list, fetches each cover (Open Library by ISBN, falling back to Google Books by title and author), resizes it to about 400 px wide and writes `apps/web/public/covers/<slug>.webp` with `sharp` (quality about 80, roughly 15-40 KB each). The files are committed, and the script also writes `apps/api/prisma/covers.json`, a manifest of the slugs that have a file; the seed reads it so it works inside the production image, which does not contain the web app's files. The script is run by hand, not in CI or production. Each result is checked visually and misses are replaced by hand or by a different edition, or left without a cover.
- Why: the demo must not depend on a third party being reachable, and WebP keeps 30 covers under 1 MB. The placeholder (a colored block with the title, chosen deterministically from it) guarantees no broken images for admin-created items or failed loads.
- Alternatives: hotlinking external URLs (fragile in a live demo, uneven coverage for comics); admin upload to S3 (a whole extra feature); placeholder only (works but is not a real cover). Rejected for reliability, scope and appearance respectively.
- `coverUrl` accepts an http(s) URL or a site-relative path, so administrators can still paste an external image. A relative path is only meaningful to the web app; external API consumers see the path as stored.
- New dev dependency: `sharp`, used by the script only.
- Legal: covers are copyrighted; they are used for academic purposes only, and the README and the PDF state it.

### Web
New routes `/catalog` (every authenticated user) and `/admin/items` (inside the existing `RequireRole role="ADMIN"` group). `CatalogPage`: search box with a short debounce, kind filter, paged cards and a detail view (modal or panel using existing primitives). `ItemsAdminPage`: table plus form, modeled on `UsersPage`, with a delete confirmation and API error display; series and issue number fields only render when the kind is comic. `MenuPage` gains a catalog card for everyone and a management card for administrators. Types and calls go in `lib/api.ts`.

## Risks / Trade-offs

- [Substring search is weak for typos and synonyms] → Acceptable for the catalog screen; semantic search is exactly what the RAG change adds.
- [Composite natural key rejects a legitimate second edition with identical title, author and kind] → Rare in a demo catalog; the administrator can disambiguate in the title. Revisit if it hurts.
- [Seed overwrites an administrator's edit to a demo row] → Documented in the README; only demo rows are affected and the command is manual.
- [Auto-matched covers can be the wrong edition or missing, mostly for comics without ISBN] → Visual check of every image, and ISBN-bearing editions preferred when choosing titles.
- [Copyrighted images in the repository] → Academic use only, stated in the README and the PDF.
- [Seed text quality drives chatbot quality later] → Spend the effort on synopses now; they can be extended by editing the array and re-running.
- [`tsx` in a production image] → It is only a dev dependency used on demand, and it adds no runtime path to the API.

## Migration Plan

1. Add the migration creating `Kind` and `Item` with both unique constraints; it runs through `prisma migrate deploy` on container start.
2. Push to `main`; the pipeline deploys the new image.
3. Run the seed once on the server: `docker compose exec api pnpm db:seed` from `/opt/libros`, then verify the catalog in the web app.
4. Rollback: redeploy the previous image tag. The extra table is unused by the old version, so no down migration is needed.
