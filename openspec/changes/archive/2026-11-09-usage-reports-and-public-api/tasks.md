# Tasks

## 1. Usage aggregation and reports API

- [x] 1.1 Add pure helpers in `src/usage/usage-aggregation.ts` (`parseRange(from, to)` returning a validated UTC range or throwing 400 when `from > to`, and `summarize(rows)` building totals, `byService[]` and `byDay[]`) plus Vitest tests in `test/usage/`. Manual check: `pnpm test` in `apps/api` passes the new tests (token consumption calculation is course-required).
- [x] 1.2 Implement `UsageService` with `$queryRaw` (`Prisma.sql`) returning rows per day, user and service name with optional `userId`, `serviceId`, `from`, `to` filters, and `GET /usage/me` (JWT, own id only, includes limit and remaining from `TokenQuotaService`). Manual check: after using the chat, `/usage/me` in Swagger shows totals matching the quota status and the per-service and per-day breakdown. Captura de evidencia: `/usage/me` response.
- [x] 1.3 Implement `GET /reports/usage`, `GET /reports/chat-sessions` (metadata and message count and tokens, no content) and `GET /reports/chat-sessions/:id` (admin JWT only, full messages), with DTO query validation. Manual check: as admin, filtering by user, service and dates changes the rows; as a regular user all three return 403. Captura de evidencia: filtered report response and the 403.

## 2. API keys

- [x] 2.1 Add the `ApiKey` model (`id`, `name`, `keyHash` unique, `prefix`, `createdAt`, `lastUsedAt`, `revokedAt`), generate the migration, and apply it locally. Manual check: the migration applies on a clean database and `prisma migrate status` is up to date.
- [x] 2.2 Implement key generation and hashing (`lk_` + 32 random bytes base64url, SHA-256 hex, prefix) in `src/api-keys/api-key.util.ts` with Vitest tests (hash is deterministic, plain key differs from hash, generated keys are unique). Manual check: `pnpm test` passes.
- [x] 2.3 Implement `ApiKeysModule`: `POST /api-keys` (admin, returns plain key once), `GET /api-keys` (metadata only), `DELETE /api-keys/:id` (sets `revokedAt`). Manual check: creating returns the key once, listing never shows it, revoking sets the date, a regular user gets 403. Captura de evidencia: creation response and the listing.
- [x] 2.4 Add `@AllowApiKey()` and extend `AuthGuard`/`RolesGuard` so `X-API-Key` authenticates only on decorated routes (updating `lastUsedAt`), applying it to `/reports/usage` and `/reports/chat-sessions` only. Manual check: with a valid key, `/reports/usage` returns 200 and `/chat/sessions` and `/reports/chat-sessions/:id` return 401; a revoked or wrong key returns 401. Captura de evidencia: curl or Postman with the key succeeding on a report and failing on chat.

## 3. Documentation

- [x] 3.1 Audit every controller for `@ApiTags`, `@ApiOperation` and response classes, add what is missing, mark report routes with `@ApiSecurity('api-key')`, and note UTC day buckets in the report descriptions. Manual check: `/docs` lists every route with a summary and the Authorize dialog offers both schemes. Captura de evidencia: `/docs` with the tags expanded and the Authorize dialog.
- [x] 3.2 Add a "Reports and API keys" section to the README (endpoints, how to create a key, how to call with `X-API-Key`, UTC note) and run `openspec validate usage-reports-and-public-api --strict`. Manual check: validation passes and the section reads correctly.

## 4. Web

- [x] 4.1 Add API client types and functions for usage, reports and API keys in `apps/web/src/lib/api.ts`. Manual check: `pnpm typecheck` in `apps/web` passes.
- [x] 4.2 Build `UsagePage` at `/usage` (limit, used, remaining, per-service and per-day tables, date range, own sessions linking to `/chat`), route, navigation entry and menu card. Manual check: a regular user sees only their own data and can open a past conversation. Captura de evidencia: personal consumption screen.
- [x] 4.3 Build admin `UsageReportPage` at `/admin/usage` (filters by user, service and dates, totals, usage table, sessions table, read-only conversation panel) under `RequireRole ADMIN`. Manual check: filters change the tables and totals, a conversation of another user opens, a regular user is redirected. Captura de evidencia: report with filters applied and a conversation open.
- [x] 4.4 Build admin `ApiKeysPage` at `/admin/api-keys` (create with name, one-time key display with copy and warning, list, revoke). Manual check: create a key, copy it, reload and confirm it is no longer shown, revoke it. Captura de evidencia: one-time key dialog and the list with a revoked key.

## 5. Release

- [x] 5.1 Run lint, typecheck and tests locally, then after deploy verify the migration applied and create the production API key for Power BI. Manual check: the production `/reports/usage` answers 200 with the key. Captura de evidencia: production report response with the key.
