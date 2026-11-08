# Design

## Context

Greenfield project: the repository only contains the course brief and OpenSpec scaffolding. See `proposal.md` for motivation. Constraints:

- Delivery on 10 November, so every choice favours the lowest-risk path.
- One new AWS Lightsail instance (2 GB class, Ohio / us-east-2) hosts everything. An existing Lightsail instance for another project must not be reused.
- Domain `alexvyumes-dev.com` is managed in Cloudflare. Subdomains: `libros.` (web) and `apilibros.` (API).
- The developer works on macOS, uses pnpm, TypeScript strict, NestJS, Prisma, PostgreSQL, Jest. No `any` types.
- The web design reference is the pasted Dovetail-style `DESIGN.md`, preserved in this change as `DESIGN.source.md` (typos fixed) and moved to the repository root during implementation.
- Later changes depend on this one: Postgres + pgvector (RAG), Bedrock access (Nova, Titan v2), Swagger at `/docs`, and an API-key auth path for Power BI.

## Goals / Non-Goals

**Goals:**
- A deployed, HTTPS-served "hello world" for web and API on day one, with CI/CD already gating it.
- A repository layout where both apps share tooling, scripts and one pipeline.
- A database ready for vector search without manual SQL on the server.
- A design token foundation so later screens look consistent without rework.

**Non-Goals:**
- Authentication, roles, catalog data, AI calls, token metering and reports.
- High availability, managed backups beyond Lightsail snapshots, autoscaling.
- Infrastructure-as-code (Terraform, CDK). The instance is created by hand through the console and documented.

## Decisions

### 1. pnpm workspace monorepo, no extra build orchestrator
`apps/api`, `apps/web`, `deploy/`. Root scripts use `pnpm -r` and `--parallel` for dev.
- Alternatives: Turborepo / Nx (caching and task graphs, but an extra tool to learn for two packages); two separate repositories (contradicts the single-pipeline goal).
- Why: two packages do not justify an orchestrator. Can be added later without restructuring.

### 2. Single Lightsail instance with Docker Compose (Option A)
Postgres (pgvector image), API, web static files and Caddy in one compose project.
- Alternatives: Lightsail managed database (backups included, but pgvector support unverified and higher cost); RDS (supports pgvector, but VPC and security-group setup costs time).
- Why: fewest moving parts for a two-day timeline. Trade-off: backups are manual (Lightsail snapshots) and RAM is shared between services.

### 3. Caddy as reverse proxy and static file server
Caddy issues and renews certificates automatically and serves the Vite build directly, so the web app needs no Node process in production.
- Alternatives: Nginx + Certbot (more configuration, renewal cron); Next.js server (rejected earlier, extra RAM).
- Why: a ~10-line Caddyfile covers both subdomains.

### 4. Cloudflare records in "DNS only" mode
Caddy completes the Let's Encrypt challenge itself. With the Cloudflare proxy on, challenges and SSL mode need extra configuration.
- Trade-off: no Cloudflare CDN or DDoS shielding. Acceptable for a course project; can be enabled later with SSL mode Full (strict).

### 5. Prisma migrations own the schema, including `CREATE EXTENSION vector`
The first migration enables pgvector so a fresh database (local, CI, production) is identical.
- Alternative: init SQL file mounted in the Postgres container (only runs on first volume creation, easy to drift).
- Vector dimension is decided in the RAG change (Titan v2 supports 256, 512 and 1024).

### 6. Images built in CI, pulled on the server
GitHub Actions builds API and web artifacts, publishes the API image to GitHub Container Registry, then SSHes into Lightsail to pull and restart with compose.
- Alternative: build on the server (2 GB RAM can fail during builds and is slow).
- Why: the server only runs containers; failed tests never reach it because deploy `needs` the test job.
- Web static build is produced in CI and shipped as part of an image served by Caddy, so a deploy is a single compose update.

### 7. Health check as the deploy gate
`GET /health` checks the database connection. The deploy job polls it after release and fails the run if it does not turn healthy, which also gives a clean screenshot for evidence.

### 8. Public Swagger at `/docs`
Required for the demo. Protected endpoints stay protected; only the documentation page is public. Both auth schemes (Bearer, `X-API-Key`) are declared now so later changes only attach guards.

### 9. Design tokens in Tailwind v4 `@theme`
Tokens from `DESIGN.md` become CSS variables consumed by Tailwind utilities and components. A small set of primitives (Button, Card, Eyebrow) lands now; everything else is built per change.
- Alternative: component library with its own theme (faster components, but fights the strict dark/one-accent rules).

### 10. Evidence-screenshot rule in `openspec/config.yaml`
A `tasks` rule makes every later `tasks.md` end visible work with a "Captura de evidencia" subtask. Applied during implementation of this change, so it governs all later proposals.

## Risks / Trade-offs

- [No automated tests in this change, by user decision to save time] → Automated tests are limited to what the course requires (AI services, history, token calculation) and are written alongside those features. Until then the CI check job gates deploys with lint, type checks and build, and the test script passes when no tests exist, so the gate is ready when those tests arrive.

- [2 GB RAM shared by Postgres, API, Caddy] → Keep Postgres memory settings modest, add a swap file on the instance, avoid building on the server.
- [Single instance is a single point of failure and the database lives on it] → Lightsail snapshot before the demo and after seeding data.
- [Bedrock model access approval can be delayed] → Request access for Nova and Titan v2 in the first tasks, in parallel with infrastructure work.
- [Lightsail firewall blocks 80/443 by default] → Explicit task to open ports 80 and 443 and restrict 22 to a known address when possible.
- [DNS propagation delays certificate issuance] → Create records before the first deploy and verify with `dig` before starting Caddy.
- [SSH deploy key leakage] → Dedicated deploy key, stored only as a GitHub Actions secret, never in the repository.
- [Cloudflare proxy accidentally enabled breaks certificate issuance] → Checklist item with screenshot of the DNS-only setting.

## Migration Plan

1. Create instance and static IP, open ports, install Docker.
2. Create DNS records and verify resolution.
3. Deploy the stack manually once to prove it works, then switch to the pipeline.
4. Rollback: re-run the pipeline on the previous commit, or `docker compose` with the previous image tag. The database is not changed by this change beyond enabling pgvector.

## Open Questions

- Whether to add a swap file or choose the next Lightsail size up if memory is tight during the demo (decide from observed usage).
