## Why

The course brief requires a CRUD over the application's own entities, managed by the administrator, that feeds the AI services, plus a database script with demo data. The app is about books and comics, but the database only holds users. The later chatbot (RAG) and agents need real catalog rows to retrieve and compare, so the catalog must exist, be populated and be deployed first, independently of any AI work.

## What Changes

- Add an `Item` model (a book or a comic) with a `Kind` enum `BOOK | COMIC`, and a Prisma migration. Fields: title, author, genre and series as plain text, year, synopsis, and optional isbn, cover URL and issue number. No normalized author or genre tables.
- Add catalog endpoints: list with pagination, text search and filter by kind, and read by id for any authenticated user; create, update and delete for administrators only. Reuse the existing `Role` enum and roles guard, with no permissions table.
- Add an idempotent seed command that loads about 20-30 real titles (roughly half books, half comics) with meaningful synopses. Re-running it inserts new titles, updates existing ones and never duplicates. It doubles as the course's "database script with demo data".
- Add real cover images for the demo titles: a one-off script downloads them, converts them to WebP and stores them in the web app's public folder, and the seed references them. Items without a cover, or whose image fails to load, show a generated placeholder cover.
- Web: a catalog screen for every authenticated user (search, kind filter, pagination, detail) and an administrator screen to create, edit and delete items, with a new menu entry.

Out of scope: embeddings and the pgvector column (added by the later `rag-chatbot` change), normalized authors or genres, cover image upload from the application (an item only stores a cover URL or a site path), import from external sources, and any AI feature.

## Capabilities

### New Capabilities
- `item-catalog`: the book and comic catalog API, including the data model, validation, list/search/filter, detail and administrator-only writes.
- `catalog-demo-seed`: a repeatable, idempotent command that loads the demo catalog.
- `web-catalog-ui`: the web catalog browsing screen for all users and the administrator management screen.

### Modified Capabilities
<!-- None: auth and user requirements are unchanged; the catalog reuses the existing guards. -->

## Impact

- API: new `items` module, `Item` model, `Kind` enum and migration, a seed script and a `db:seed` package script.
- Web: new routes, catalog and admin pages, extra menu card and API client calls, a cover component with a placeholder, and about 30 WebP images (under 1 MB in total) in `public/covers/`.
- Tooling: `sharp` as a dev dependency and a one-off cover download script; it never runs in production.
- Legal note: covers are copyrighted and used for academic purposes only; the README and the PDF say so.
- Deployment: the migration runs on container start as before; the seed is run manually against production once, no new CI secrets or environment variables.
- Swagger: new `items` tag with bearer auth on all endpoints.
- Evidence: screenshots of the catalog list with covers and the placeholder, search, administrator CRUD, a `USER` blocked from writes in Swagger, and the seed output run twice.
