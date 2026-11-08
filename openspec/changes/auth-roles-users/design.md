# Design

## Context

- The API (NestJS 12, Prisma 6) has no models yet; `schema.prisma` only enables the `vector` extension. `ValidationPipe` (whitelist, transform) and CORS limited to `WEB_ORIGIN` are already global; Swagger already declares Bearer and `X-API-Key` schemes.
- The production container runs `prisma migrate deploy` then starts the API, so a migration plus a startup bootstrap is applied on every deploy without extra pipeline steps.
- `deploy/docker-compose.yml` passes environment variables explicitly to the API service, and the server keeps its values in `/opt/libros/.env`. New variables must be added to compose and to that file by hand; CI holds no application secrets.
- The web app is a single `App.tsx` with no router, using Tailwind tokens and `Button`, `Card`, `Eyebrow` primitives.
- Time is the main constraint (due 10 November); automated tests are limited to course-required areas and auth is not one of them, so verification here is manual.

## Goals / Non-Goals

**Goals:**
- One reusable guard pair (authentication, then roles) that later changes attach to with a decorator.
- A usable fresh deployment with no manual SQL.
- Auth state that is always consistent with the database (deactivated or demoted users take effect immediately).

**Non-Goals:**
- Refresh tokens, token revocation lists, password recovery, rate limiting or lockout.
- A permissions table. Roles stay a two-value enum.
- Any AI, catalog or metering behaviour; `tokenLimit` is added by `ai-usage-metering`.

## Decisions

### Access token only, kept in localStorage, sent as Bearer
JWT signed with HS256 using `JWT_SECRET`, lifetime from `JWT_EXPIRES_IN` (default `8h`). The web keeps it in `localStorage` and adds the `Authorization` header in one fetch wrapper.
- Why: the brief requires Swagger and Postman consumption, where Bearer is the natural scheme, and it needs no CSRF handling. Decided with the user during exploration.
- Alternatives: httpOnly cookie (better XSS posture, but needs credentialed CORS, CSRF handling and a second path for Swagger/Postman); access plus rotating refresh token (more tables and endpoints than the deadline allows).
- Trade-off: a token is readable by injected script. Mitigated by short lifetime and by React escaping output; stated as the known limitation.

### bcrypt for password hashing
Use the `bcrypt` package with cost 10.
- Why: chosen by the user for simplicity. It has prebuilt binaries for the `node:24-slim` image, so the Dockerfile needs no change.
- Alternative: argon2 (stronger, but heavier native build); rejected for time.
- Note: bcrypt truncates input at 72 bytes, so the password DTO caps length at 72.

### Roles as an enum, no permissions table
`Role { ADMIN, USER }` on `User`. A `@Roles(Role.ADMIN)` decorator plus a `RolesGuard` covers every requirement in the brief.
- Why: the brief only asks for administrator and user. A permissions table would add models, seeding and an admin screen with no demonstrable gain.
- Alternative: Role and Permission tables (RBAC). Rejected; it can be introduced later by replacing the decorator's check without changing call sites.
- This closes the user's "maybe a permissions table" remark: it stays out of scope.

### Plain JWT guard instead of Passport
A global `AuthGuard` verifies the token with `@nestjs/jwt`, loads the user from the database and attaches it to the request. A `@Public()` decorator opts routes out. A `RolesGuard` runs after it.
- Why: fewer dependencies and less indirection than `@nestjs/passport` + `passport-jwt` for one strategy. Both guards are registered as global `APP_GUARD` providers, so protection is the default and forgetting a decorator fails closed.
- Alternative: Passport strategy (conventional, but adds two packages and an abstraction layer that will not be reused).
- The guard does one primary-key lookup per request. This is what makes deactivation and role changes immediate without revocation lists; the cost is negligible at this scale.
- The proposal lists passport packages in Impact; the dependency set is `@nestjs/jwt` and `bcrypt` only.

### Module layout and data model
`AuthModule` (login, me, logout, guards, decorators) and `UsersModule` (admin CRUD, bootstrap). Controllers handle HTTP only; services hold logic; DTOs use class-validator.

`User`: `id` (uuid), `email` (unique, stored lowercase), `name`, `passwordHash`, `role` (default `USER`), `active` (default `true`), `createdAt`, `updatedAt`. Responses use a mapper that drops `passwordHash`.

Endpoints: `POST /auth/login` (public), `POST /auth/logout`, `GET /auth/me`, `GET|POST /users`, `GET|PATCH|DELETE /users/:id` (admin). Logout is a no-op on the server, since there is no revocation; the client drops the token. It exists so the flow is documented and testable in Swagger.

### First administrator bootstrap on startup
`UsersService` implements `OnApplicationBootstrap`: if there is no `ADMIN` row, create one from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; otherwise do nothing. Idempotent and never overwrites passwords.
- Why: production runs migrations then the app, so a startup hook needs no extra container command or Prisma seed script.
- Alternative: `prisma db seed` (needs the seed runner and dev tooling in the production image; extra deploy step).
- Both variables are required by environment validation so a deployment cannot start without a way in.

### Self-protection rules
The service rejects delete, deactivate and demote when the target is the caller. Combined with the bootstrap rule, at least one administrator always remains.

### Web routing and session
Add `react-router-dom`. An `AuthProvider` holds token and user, loads `/auth/me` on start when a token exists, and clears state on any 401 from the fetch wrapper. `RequireAuth` and `RequireRole` wrap routes. Screens: `/login`, `/` (menu), `/admin/users`. Styling reuses existing tokens and primitives; new inputs, table and modal follow `DESIGN.md`.

## Risks / Trade-offs

- [Token in localStorage readable by XSS] → Short lifetime, no HTML injection paths, documented as a known limitation.
- [Weak or default bootstrap password in production] → The password lives only in the server `.env`, never in the repository; the README tells the operator to use a strong value.
- [Stolen token valid until expiry, no revocation] → Per-request database check covers deactivation and deletion; expiry bounds the rest.
- [No login rate limiting] → Accepted for scope; bcrypt cost slows brute force. Can be added later with `@nestjs/throttler`.
- [Forgotten server `.env` variables break deploy] → Environment validation fails fast, and the health check in CI fails visibly. The tasks include the manual server step.

## Migration Plan

1. Add the migration creating `Role` and `User`; it runs automatically via `prisma migrate deploy` on container start.
2. Before pushing, add `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` to `/opt/libros/.env` on Lightsail; the compose file forwards them.
3. Push to `main`; the pipeline deploys and the bootstrap creates the administrator on first start.
4. Rollback: redeploy the previous image tag. The extra table is unused by the old version, so no down migration is required.
