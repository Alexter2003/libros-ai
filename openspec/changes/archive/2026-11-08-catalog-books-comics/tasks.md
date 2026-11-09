# Tasks

## 1. Data model and dependencies

- [x] 1.1 Add the `Kind` enum and `Item` model to `schema.prisma` (unique `isbn`, unique `(title, author, kind)`) and create the migration. Manual check: `pnpm --filter api prisma:migrate` applies cleanly and the `Item` table with both unique constraints exists in the local database. Captura de evidencia: terminal showing the migration applied.
- [x] 1.2 Install `tsx` as a dev dependency of `apps/api` and `sharp` as a dev dependency where the cover script lives, with pnpm. Manual check: `pnpm --filter api typecheck` passes and the lockfile installs cleanly (`pnpm install --frozen-lockfile`).

## 2. Catalog API

- [x] 2.1 Create `ItemsModule` with DTOs (create, update, list query), a response mapper and a service. Validation covers required fields, kind enum, plausible year, and series and issue number only for comics, applied to the merged result on update. Duplicate ISBN or duplicate `(title, author, kind)` return 409. Manual check: in Swagger as admin, creating a book with an issue number returns 400 and creating the same item twice returns 409. Captura de evidencia: Swagger responses for the 400 and the 409.
- [x] 2.2 Implement `GET /items` (page, pageSize capped at 50, kind filter, case-insensitive search `q` over title, author and series, ordered by title then id, response with `data`, `total`, `page`, `pageSize`) and `GET /items/:id` for any authenticated user, with UUID validation and 404 for unknown ids. Manual check: with a USER token, list with `kind=COMIC`, search a lowercase fragment of an author and read one id; an anonymous call returns 401. Captura de evidencia: Swagger list response with filters.
- [x] 2.3 Implement `POST /items`, `PATCH /items/:id` and `DELETE /items/:id` restricted to `ADMIN` with `@Roles` on each method, Swagger tags and bearer auth, and register the module in `AppModule`. Manual check: as admin create, edit and delete an item; with a USER token each write returns 403 and leaves the item unchanged. Captura de evidencia: a 403 response with the USER token and the admin create response.

## 3. Demo seed

- [x] 3.1 Write `prisma/seed.ts` with a typed array of 20-30 real titles (about half books, half comics, each with a synopsis of at least two sentences, an ISBN when known and a cover slug), upserting on `(title, author, kind)` and printing created and updated counts. Configure `prisma.seed` in `apps/api/package.json` and add a `db:seed` script. Manual check: `pnpm --filter api db:seed` on an empty catalog creates all items; running it again reports no new items and the row count is unchanged. Captura de evidencia: terminal output of both runs.
- [x] 3.2 Check the seed's boundaries. Manual check: edit one seeded title and add a new array entry, run the seed, and see one update and one creation; an item created through Swagger and the users table are untouched. Captura de evidencia: output showing one created and one updated.

- [x] 3.3 Write `scripts/fetch-covers.ts`: for each seed title fetch the cover (Open Library by ISBN, falling back to Google Books by title and author), resize to about 400 px wide, convert to WebP (quality about 80) and save to `apps/web/public/covers/<slug>.webp`, reporting hits and misses. Run it, review every image against its title, replace wrong or missing ones (another edition, or by hand) and leave unresolved titles without a cover. Manual check: the folder holds the covers, the total size is under 1 MB and each image matches its title. Captura de evidencia: a grid of the downloaded covers and the script output.
- [x] 3.4 Make the seed set `coverUrl` to `/covers/<slug>.webp` only when the slug appears in the `covers.json` manifest written by the cover script. Manual check: re-running the seed keeps the count unchanged and a title without a file is created without a cover.

## 4. Web catalog

- [x] 4.1 Add item types and calls to `lib/api.ts`, a `Cover` component that shows the image and falls back to a generated placeholder (deterministic color, title) when missing or on load error, build `CatalogPage` at `/catalog` for every authenticated user (debounced search, kind filter, paging that keeps filters, detail view, empty state) and add the catalog card to `MenuPage`. Manual check: as USER, search, filter by comics, change pages and open a detail; searching nonsense shows the empty state. Manual check also: an item without cover and one with a broken URL show the placeholder. Captura de evidencia: catalog list with covers and a placeholder, a search applied and an item detail.
- [x] 4.2 Build `ItemsAdminPage` at `/admin/items` inside the existing admin route group: table, create and edit form with API errors shown, series and issue number hidden for books, delete with confirmation, and a management card on `MenuPage` for admins only. Manual check: as admin create a comic, edit it, try to create a duplicate and see the error, delete with confirmation; as USER the menu has no management card and `/admin/items` redirects away. Captura de evidencia: admin table, the create form and the duplicate error.

## 5. Deployment and documentation

- [x] 5.1 Update the README with the catalog endpoints, the `db:seed` command (local and `docker compose exec api pnpm db:seed` on the server), the note that seeding refreshes demo rows, how to re-run the cover script, and a visible notice that the covers are copyrighted images used for academic purposes only. Manual check: the documented commands run as written and the notice appears in the rendered README on GitHub.
- [x] 5.2 Push to `main` and confirm the pipeline is green, then run the seed on Lightsail from `/opt/libros`. Manual check: the deploy workflow succeeds and `GET /items` on `https://apilibros.alexvyumes-dev.com` returns the seeded titles with a token. Captura de evidencia: green workflow run and the seed output on the server.
- [x] 5.3 Verify on production: log in on `https://libros.alexvyumes-dev.com`, browse and search the catalog as a USER, then manage items as the admin. Manual check: the full flow works over HTTPS. Captura de evidencia: production catalog and admin management screens.

## Workflow follow-up

- Add the same cover copyright notice (academic use only) to the PDF deliverable; this is the user's step and lives outside the repository.
- List the manual checks and evidence screenshots for the user after each round; commit and archive only after the user approves.
