# Tasks

Working agreement: automated tests are written only for what the course brief requires (AI services, conversation history, token consumption calculation) and are run only by the CI gate, in the later changes that build those features. This change has none of them, so it has no automated tests. Claude does not run verification commands after each task. Each task lists a **Manual check** that the user performs after the apply round. After finishing a round of tasks, Claude lists exactly what to check, the user verifies and reports errors, Claude fixes them, and only after the user's approval are the commit and the archive done.

Screenshots: save every evidence capture in `docs/evidence/foundation-infra/` named `NN-description.png`, for the final PDF.

## 1. Project rules and cloud prerequisites (guided, user-driven)

- [x] 1.1 Add to `openspec/config.yaml` (a) a `tasks` rule requiring every task that produces something visible (UI, endpoint, pipeline, report, console setup) to end with a "Captura de evidencia: <what to capture>" subtask, and (b) `operations.apply.guidance` stating: no automated verification per step; write automated tests only for what the course brief requires (AI services, history, token calculation); finish a round, list the manual checks for the user, wait for the user's report, commit and archive only after approval. Manual check: both blocks are present in the file
- [ ] 1.2 Guide the user to request Bedrock model access for Amazon Nova (Lite and Pro) and Titan Text Embeddings v2 in us-east-2. Manual check: both show "Access granted" in the console. Captura de evidencia: Bedrock model access page with the granted models
- [ ] 1.3 Guide the user to create a new Lightsail instance (Ubuntu, 2 GB class, Ohio), attach a static IP and open ports 80 and 443. Manual check: SSH login works and the static IP is shown. Captura de evidencia: instance details, static IP and firewall rules
- [ ] 1.4 Guide the user to create Cloudflare A records `libros` and `apilibros` pointing to the static IP, both "DNS only". Manual check: `dig +short` for both names returns the IP. Captura de evidencia: Cloudflare DNS table with grey-cloud records and the `dig` output
- [ ] 1.5 Guide the user to install Docker and the compose plugin on the instance, add a swap file, and create a deploy user with a dedicated SSH key. Manual check: `docker compose version` and `free -h` work over SSH

## 2. Monorepo scaffold

- [x] 2.1 Initialise git, `.gitignore`, `pnpm-workspace.yaml` and root `package.json` with `dev`, `build`, `test`, `lint` scripts (`test` must not fail when no tests exist). Manual check: `pnpm install` succeeds at the root
- [x] 2.2 Add shared TypeScript strict base config and ESLint config rejecting explicit `any`. Manual check: `pnpm lint` passes on the scaffold
- [x] 2.3 Add `.env.example` documenting every variable and a README with local setup commands. Manual check: README steps start the project locally

## 3. API baseline (NestJS + Prisma)

- [x] 3.1 Scaffold `apps/api` with NestJS and Prisma, strict TypeScript, and validated configuration that exits naming any missing variable. Manual check: starting the API without the database variable shows the error naming it
- [x] 3.2 Add the initial Prisma migration enabling `pgvector`. Manual check: `SELECT * FROM pg_extension WHERE extname = 'vector';` returns a row on the local database
- [x] 3.3 Implement `GET /health` checking the database. Manual check: returns "up" with the database running and "down" with it stopped
- [x] 3.4 Add Swagger at `/docs` (public) declaring Bearer and `X-API-Key` schemes, and CORS restricted to the configured web origin. Manual check: `/docs` opens without credentials and shows the Authorize dialog with both schemes
- [x] 3.5 Add the API Dockerfile (multi-stage, runs migrations on start). Manual check: the container starts and `/health` answers. Captura de evidencia: Swagger UI at `/docs` running locally

## 4. Web baseline (Vite + React) and design system

- [x] 4.1 Scaffold `apps/web` with Vite, React, TypeScript strict and Tailwind v4. Manual check: `pnpm --filter web dev` serves the page
- [x] 4.2 Move `DESIGN.source.md` from this change to the repository root as `DESIGN.md`. Manual check: the file is at the root and contains no 5-digit hex colours
- [x] 4.3 Map `DESIGN.md` tokens into the Tailwind `@theme`, load Inter and JetBrains Mono, apply the canvas background and optional grid layer. Manual check: the page is near-black with the correct fonts
- [x] 4.4 Build Button (primary and ghost), Card and Eyebrow primitives. Manual check: the landing screen shows all variants as specified
- [x] 4.5 Build a landing screen that calls the API `/health` and renders the result in a Card. Manual check: it shows "healthy" with the API running and an error state with it stopped. Captura de evidencia: landing screen locally showing API status

## 5. Local run flow

- [x] 5.1 Add a development compose file with Postgres + pgvector and wire the root `dev` command to start API and web together. Manual check: `pnpm dev` leads to the web app showing "healthy"
- [x] 5.2 Confirm root `build` and `lint` scripts work for both apps. Manual check: `pnpm build` and `pnpm lint` finish without errors

## 6. Production stack

- [x] 6.1 Write the production compose file (Postgres on a persistent volume with no public port, API image, web static files served by Caddy, Caddy data volume). Manual check: `docker compose config` prints without errors
- [x] 6.2 Write the Caddyfile for `libros.alexvyumes-dev.com` (static web) and `apilibros.alexvyumes-dev.com` (reverse proxy to API). Manual check: the file is readable and names both hosts
- [ ] 6.3 Deploy the stack manually once on Lightsail. Manual check: both subdomains load over trusted HTTPS, HTTP redirects to HTTPS, `/health` and `/docs` respond, and the Postgres port is unreachable from the laptop. Captura de evidencia: padlock on both subdomains, `/docs` public, `/health` response, and the failed external DB connection
- [ ] 6.4 Restart the stack on the server. Manual check: the database extension and the certificate are still present

## 7. CI/CD

- [ ] 7.1 Create the GitHub repository, push, and configure Actions secrets (host, user, deploy key) and registry login. Manual check: secrets are listed in the repository settings
- [x] 7.2 Add the workflow job that runs lint, type checks, build and the test script (passing when no tests exist) for both apps on push and pull request. Manual check: a pull request shows the checks green. Captura de evidencia: green checks on a pull request
- [x] 7.3 Add the deploy job (main only, `needs` the check job) that builds and pushes the image, updates the server over SSH and polls `/health`. Manual check: a push to main deploys and the run shows the health poll succeeding
- [ ] 7.4 Prove the gate by pushing a deliberate lint or type error to main (or a temporary branch rule) and then reverting. Manual check: the deploy job is skipped on the failing run and runs on the fixed one. Captura de evidencia: failed run with the skipped deploy job and the later successful deploy run

## 8. Closing

- [ ] 8.1 Push a visible text change in the web app. Manual check: it appears on `https://libros.alexvyumes-dev.com` after the pipeline finishes
- [ ] 8.2 Guide the user to create a Lightsail snapshot of the configured instance. Manual check: the snapshot is listed as available. Captura de evidencia: snapshot list
- [ ] 8.3 Collect all screenshots in `docs/evidence/foundation-infra/`. Manual check: one image exists for each "Captura de evidencia" item above

## Workflow follow-up

- After the user approves the manual checks: commit to the repository, then archive the change.
