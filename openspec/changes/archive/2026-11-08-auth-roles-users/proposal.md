## Why

The course brief requires login and logout with administrator and user roles, access restricted by role, and a user CRUD. Every later change (catalog, token limits, chatbot, agents, reports) needs to know who is calling, so identity and role checks must exist before any of them. The API currently has no data models, no users and no guards, and the web app has a single public landing screen.

## What Changes

- Add a `User` model with an `ADMIN | USER` role enum, a bcrypt-hashed password and an active flag, with a Prisma migration.
- Add login that returns a short-lived JWT access token (no refresh token), plus logout and a "who am I" endpoint. The web stores the token in `localStorage` and sends it as an `Authorization: Bearer` header.
- Add a global JWT guard (everything protected by default, with explicit public routes such as `/health` and login) and a roles guard driven by a decorator.
- Add admin-only user management: create, list, read, update (name, role, active flag, password reset) and delete. There is no public registration.
- Bootstrap the first administrator from environment variables at API startup when no admin exists, so a fresh deployment is usable.
- Add new required environment variables for the JWT secret, token lifetime and the bootstrap admin, validated at startup.
- Web: login screen, session handling, protected routes, a main menu shell that shows items by role, a logout action and an admin users screen (list, create, edit, deactivate, delete).

Out of scope: a permissions table or full RBAC (roles are an enum), refresh tokens, public registration, password recovery by email, per-user token limits (`tokenLimit` lands in the later `ai-usage-metering` change) and API-key authentication for Power BI (later `usage-reports-api` change).

## Capabilities

### New Capabilities
- `user-auth`: credential login, JWT access tokens, logout, current-user lookup, default-protected routes and role-based access checks.
- `user-management`: administrator-only lifecycle of user accounts, including the bootstrapped first administrator.
- `web-auth-ui`: web login, session persistence, role-aware navigation, protected routes and the administrator users screen.

### Modified Capabilities
<!-- None: existing baseline requirements keep their behaviour; the health endpoint and /docs stay public. -->

## Impact

- API: new `auth` and `users` modules, global guards, `User` model and migration, new dependencies (`@nestjs/jwt`, `bcrypt`), extended environment validation.
- Web: router, auth context and API client with token header, login and users screens, new dependency for routing.
- Deployment: the server `.env` and `deploy/docker-compose.yml` gain `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`; `.env.example` and the README are updated. No new CI secrets are needed because values live in the server `.env`.
- Swagger: bearer scheme is applied to protected endpoints; `/docs` stays public.
- Evidence: screenshots of login, role-restricted menu, users CRUD and Swagger authorization for the PDF.
