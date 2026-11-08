# Tasks

## 1. Data model and configuration

- [x] 1.1 Add `Role` enum and `User` model to `schema.prisma` and create the migration. Manual check: `pnpm --filter api prisma:migrate` applies cleanly and the `User` table exists in the local database. Captura de evidencia: terminal showing the migration applied.
- [x] 1.2 Add `JWT_SECRET` (min 32 chars), `JWT_EXPIRES_IN` (default `8h`), `ADMIN_EMAIL` and `ADMIN_PASSWORD` to environment validation, `.env.example` and the `api` service in `deploy/docker-compose.yml`. Manual check: starting the API without `JWT_SECRET` exits with an error naming it.
- [x] 1.3 Install `@nestjs/jwt` and `bcrypt` (with types) in `apps/api` using pnpm. Manual check: `pnpm --filter api typecheck` passes.

## 2. Authentication and authorization (API)

- [x] 2.1 Create `UsersModule` with a service that finds users by email and id, hashes passwords with bcrypt and maps users to a response without `passwordHash`. Manual check: no response type contains a password field.
- [x] 2.2 Create `AuthModule` with `POST /auth/login`, `POST /auth/logout` and `GET /auth/me`, with DTO validation and the same generic error for wrong email, wrong password and inactive user. Manual check: in Swagger, login with the admin returns a token; wrong credentials return 401. Captura de evidencia: Swagger login response (token blurred).
- [x] 2.3 Add the global `AuthGuard` (verifies token, loads the user, rejects inactive or missing accounts), the `@Public()` decorator and the global `RolesGuard` with `@Roles()`. Mark `/health`, login and `/docs` as public. Manual check: `/health` works without a token, `/auth/me` without a token returns 401, and `/docs` still loads.
- [x] 2.4 Mark protected controllers with `@ApiBearerAuth()` so Swagger sends the token. Manual check: after Authorize in Swagger, `GET /auth/me` returns the admin profile. Captura de evidencia: Swagger Authorize dialog and `/auth/me` response.

## 3. User management (API)

- [x] 3.1 Implement admin-only `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id` (name, role, active, password) and `DELETE /users/:id` with DTOs, lowercase unique email and 409 on duplicates. Manual check: using the admin token, create, list, edit, reset a password and delete a user; a USER token gets 403 on all of them. Captura de evidencia: Swagger calls for create and for a 403 with a USER token.
- [x] 3.2 Block self-delete, self-deactivate and self-demote with a 403 and a clear message. Manual check: as the admin, each of the three actions on your own id returns 403.
- [x] 3.3 Add the `OnApplicationBootstrap` hook that creates the first admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` only when no admin exists. Manual check: with an empty database the admin can log in after the first start; restarting the API does not change the admin's password.

## 4. Web app

- [x] 4.1 Install `react-router-dom` with pnpm; add the API client wrapper that sends the Bearer header and signals 401, plus an `AuthProvider` that keeps the token in `localStorage`, loads `/auth/me` on start and clears the session on 401. Manual check: `pnpm --filter web typecheck` passes and reloading keeps the session.
- [x] 4.2 Build the login screen with the design-system inputs and Button, showing API errors. Manual check: wrong credentials show an error; correct credentials land on the menu. Captura de evidencia: login screen and the error state.
- [x] 4.3 Build the main menu shell with the user name, role, logout action and administrative options only for admins, plus `RequireAuth` and `RequireRole` route guards. Manual check: as USER the admin option is absent and `/admin/users` redirects to the menu; logout returns to login. Captura de evidencia: menu as admin and as USER.
- [x] 4.4 Build the admin users screen: table, create and edit form, active toggle, password reset and delete with confirmation, self-row actions disabled, API errors shown. Manual check: create a user, edit its role, deactivate it (its login then fails), reset its password and delete it. Captura de evidencia: users table and the create form.

## 5. Deployment and documentation

- [x] 5.1 Update the README with the new variables, the bootstrap admin behaviour and the manual server step. Manual check: the documented variable list matches `.env.example`.
- [x] 5.2 Add `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` to `/opt/libros/.env` on Lightsail, push to `main` and confirm the pipeline is green. Manual check: the deploy workflow succeeds and `https://apilibros.alexvyumes-dev.com/health` responds. Captura de evidencia: green workflow run.
- [x] 5.3 Verify on production: log in as the bootstrap admin on `https://libros.alexvyumes-dev.com`, create a USER, log in as that user and confirm the restricted menu. Manual check: the full flow works over HTTPS. Captura de evidencia: production login and the USER menu.

## Workflow follow-up

- List the manual checks and evidence screenshots for the user after each round; commit and archive only after the user approves.
