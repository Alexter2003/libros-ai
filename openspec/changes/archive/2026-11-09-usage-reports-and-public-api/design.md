# Design

## Context

- `UsageEvent` already stores one row per model call (`userId`, `serviceId`, `serviceName`, input/output tokens, `createdAt`); `serviceId` is nulled if the service is deleted, `serviceName` survives. `TokenQuotaService.getStatus` already computes totals and remaining tokens per user.
- `ChatSession`/`ChatMessage` already exist and the chat endpoints only serve the owner's data. The web chat page already lists the user's sessions.
- Auth is a global `AuthGuard` (JWT bearer, skipped by `@Public()`) plus `RolesGuard` (`@Roles`). Swagger already declares an `api-key` scheme in `main.ts` that nothing uses yet.
- Time is the main constraint (see proposal and project config), so reuse over new abstractions.

## Goals / Non-Goals

**Goals:**
- One set of report endpoints serving both the admin web screen and Power BI.
- API keys that cannot be used for anything but reading reports.
- Flat JSON rows that Power BI imports without transformation.

**Non-Goals:**
- Per-key scopes or rate limits, key expiry, multiple admin tenants.
- Exporting CSV or building charts in the web app (charts belong to the Power BI guide).
- Changing how usage is recorded.

## Decisions

### 1. Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /usage/me?from&to` | any user (JWT) | own totals, limit, remaining, `byService[]`, `byDay[]` |
| `GET /reports/usage?userId&serviceId&from&to` | ADMIN JWT or API key | flat rows per day, user and service |
| `GET /reports/chat-sessions?userId&from&to` | ADMIN JWT or API key | flat session metadata, no content |
| `GET /reports/chat-sessions/:id` | ADMIN JWT only | full messages of any session |
| `POST/GET/DELETE /api-keys` | ADMIN JWT | create (plain key once), list, revoke |

The admin screen and Power BI hit the same `/reports/*` endpoints, so there is a single aggregation implementation. Alternative considered: separate `/admin/...` and `/reports/...` endpoints; rejected as duplicated code for no behavior difference. Dates are inclusive `from`/`to` ISO dates, interpreted in UTC; day buckets are UTC days.

### 2. Aggregation in SQL, not in memory

Rows come from one Prisma `$queryRaw` with `date_trunc('day', "createdAt")`, `GROUP BY` day, user, service name, joined to `User` for email, with optional filters. Alternative: `groupBy` in Prisma, which cannot group by a truncated date. The pure pieces (range validation, summing rows into `byService`/`byDay` for `/usage/me`) are plain functions and are the part under unit test.

### 3. API key format and storage

Key = `lk_` + 32 random bytes in base64url (about 43 chars). Stored: SHA-256 hex digest (unique index), the first 8 characters as `prefix` for display, `name`, `createdAt`, `lastUsedAt`, `revokedAt`. Lookup by hash, so no timing-sensitive comparison is needed on a secret that is 256 bits of entropy. Alternatives: bcrypt/argon2 (slow hashing is meant for low-entropy passwords and would make every Power BI refresh expensive; rejected), storing plain text (rejected, a database leak would expose live keys), JWT with long expiry (cannot be revoked individually).

### 4. Letting `AuthGuard` accept a key only where allowed

A new `@AllowApiKey()` decorator marks the report handlers. In `AuthGuard`: if the route is public, continue; else if the route allows API keys and `X-API-Key` is present, validate it and attach a read-only principal (`request.apiKey`) instead of `request.user`; otherwise require a bearer token as today. `RolesGuard` treats a request with a valid `apiKey` principal as satisfying `@Roles(ADMIN)` only on `@AllowApiKey` routes. Routes without the decorator ignore the header and answer 401. Alternative: a second global guard or a separate controller path outside the guard; rejected because the single guard keeps one place that decides who is authenticated and fails closed.

### 5. Visibility rules

`/usage/me` always uses the id of the authenticated user (no `userId` parameter, so there is nothing to tamper with). `/reports/*` are admin-only by role, so the admin "filter by user" is a plain query parameter. Message content is only reachable via the JWT-only detail endpoint; API keys get metadata and token counts, to limit what a leaked key exposes.

### 6. Web

Three pages: `/usage` (everyone), `/admin/usage` (admin; filters + tables + totals + opens a session read-only in a panel), `/admin/api-keys` (admin). Navigation and menu cards follow the existing pattern (`AppShell`, `MenuPage`, `RequireRole`). No chart library: tables and totals are enough for the screens; the visuals are Power BI's job.

### 7. Documentation

Swagger: add `@ApiOperation` summary, `@ApiTags`, and response classes to any controller route missing them, and `@ApiSecurity('api-key')` on the report routes. Swagger is the only API documentation (no Postman collection, by user decision). The README gets a short "Reports and API keys" section.

### 8. Tests

Only what the brief requires: Vitest for the consumption aggregation (summing rows, range validation) and for key generation/hashing/verification, with a fake Prisma. No tests for controllers or the web.

## Risks / Trade-offs

- [A leaked API key exposes consumption metadata of all users] → read-only, no message content, revocable immediately, shown once, only hashed at rest.
- [Raw SQL bypasses Prisma typing] → keep the query in one function with explicit row types and parameterised values (`Prisma.sql`), never string interpolation.
- [UTC day buckets can look off by hours for users in another timezone] → documented in Swagger; acceptable for the course scope.
- [`lastUsedAt` write on every request] → negligible at this traffic; no batching.

## Migration Plan

1. Prisma migration adds `ApiKey` (additive, no data changes). It applies on deploy through the existing flow.
2. After deploy the administrator creates the key in `/admin/api-keys` and keeps it for the Power BI step.
3. Rollback: revert the commit; the extra table is harmless.
