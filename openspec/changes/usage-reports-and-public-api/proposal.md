# Proposal

## Why

The course brief asks for conversation history and token consumption to be consultable, for an externally consumable API (Power BI) and for the API to be documented. Today every user can read their own chat sessions, but nobody can see consumption broken down, an administrator cannot audit other users, and there is no way for an external tool to read data without a web login. This change closes those gaps and unblocks the Power BI report.

## What Changes

- Add usage reports: a user sees their own consumption (totals, per service, per day) and an administrator sees everyone's, filtered by user, AI service and date range.
- Let an administrator list and read the chat sessions of any user (filtered by user and date range); a user keeps seeing only their own.
- Add API key authentication (`X-API-Key` header) for read-only report endpoints under `/reports`, meant for Power BI. Keys are created and revoked by an administrator, shown in plain text only once and stored hashed. JWT stays the mechanism for the web app.
- Add web screens: "Mi consumo" (history and consumption for every user), an admin usage report with filters, and an admin screen to create and revoke API keys.
- Complete the Swagger documentation (every endpoint, both security schemes). Swagger is the only API documentation; no Postman collection.
- **BREAKING**: none. Existing endpoints keep their behavior.

## Capabilities

### New Capabilities
- `usage-reports`: consumption reports per user, service and day, with role-based visibility and admin filters; flat read-only report endpoints under `/reports`.
- `api-key-auth`: API keys for external read-only consumers: generation, one-time display, hashed storage, revocation, `X-API-Key` authentication restricted to report endpoints.
- `api-documentation`: complete Swagger at `/docs` as the sole API documentation.
- `web-usage-ui`: web screens for personal consumption, admin usage report and API key management.

### Modified Capabilities
- `chat-history`: administrators can list and read sessions of any user, with filters; users remain restricted to their own sessions.

## Impact

- API: new `usage` / `reports` module, new `api-keys` module, `AuthGuard` extended to accept `X-API-Key` on opted-in routes, new admin chat-history endpoints; Prisma migration adds the `ApiKey` table.
- Web: three new pages, route and navigation entries, shared API client types.
- Docs: README section on reports and API keys.
- Tests: only the consumption aggregation and the API key hashing/verification (token calculation and history are course-required).
- Production: one migration to apply on deploy; no new environment variables.
