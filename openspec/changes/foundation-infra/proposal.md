# Proposal

## Why

The final project (books and comics app with a RAG chatbot and two AI agents) is due on 10 November, so nothing can be built or demonstrated until there is a repository, a running stack and a deployment path. The course also grades deployment and CI/CD as explicit requirements. Standing up the whole pipeline first, with a "hello world" that is already live over HTTPS, removes the biggest late-stage risk and lets every later change ship to production as it lands.

## What Changes

- Create a pnpm monorepo with `apps/api` (NestJS + Prisma), `apps/web` (Vite + React + TypeScript strict) and root scripts that run backend and frontend together (`dev`, `build`, `test`, `lint`).
- Provide a Docker Compose stack for local development and production: PostgreSQL with the `pgvector` extension enabled, the API, the static web build and Caddy as reverse proxy with automatic HTTPS.
- Provision a new AWS Lightsail instance (Docker Compose host) with a static IP, and expose two subdomains of `alexvyumes-dev.com`: `libros.` (web) and `apilibros.` (API, with Swagger at `/docs`, public in production). DNS records live in Cloudflare as DNS-only.
- Ship a minimal API baseline: health endpoint, Swagger UI at `/docs`, CORS limited to the web origin, environment validation, and an initial Prisma setup with a database migration that enables `pgvector`.
- Ship a minimal web baseline that calls the API health endpoint and renders it, built on the Dovetail-inspired dark design system (tokens in Tailwind, `DESIGN.md` at the repository root).
- Add a GitHub Actions workflow that runs lint and tests for both apps on every push and pull request, and on the main branch deploys to Lightsail over SSH only when tests pass.
- Add a rule to `openspec/config.yaml` so every `tasks.md` ends each visible deliverable with an evidence-screenshot subtask for the final PDF.
- Guide the user through the manual cloud steps (Bedrock model access for Nova and Titan v2, Lightsail instance and static IP, Cloudflare DNS records), each with a screenshot checkpoint.

Out of scope: authentication, catalog, AI services, token metering, reports, API keys and Power BI (each is a later change).

## Capabilities

### New Capabilities
- `monorepo-workspace`: repository layout, shared tooling and the single-command local development flow for API and web.
- `deployment-stack`: containerised runtime (Postgres + pgvector, API, web, Caddy) on one Lightsail instance, reachable over HTTPS on two subdomains.
- `api-service-baseline`: health endpoint, public Swagger documentation at `/docs`, CORS policy and validated configuration of the API.
- `web-design-system`: dark design tokens and base UI primitives for the React app, derived from `DESIGN.md`.
- `ci-cd-pipeline`: automated test gate for both apps and test-gated automatic deployment from the main branch.

### Modified Capabilities
<!-- None: the project has no existing specs. -->

## Impact

- New repository structure: `apps/api`, `apps/web`, `deploy/`, `.github/workflows/`, root `package.json`, `pnpm-workspace.yaml`, `DESIGN.md`.
- `openspec/config.yaml` gains an evidence-screenshot rule for `tasks`.
- External systems: AWS Lightsail (new instance and static IP), AWS Bedrock (model access request), Cloudflare DNS (two A records), GitHub (repository and Actions secrets for SSH deploy), Let's Encrypt (certificates through Caddy).
- Dependencies: NestJS, Prisma, `@nestjs/swagger`, Vite, React, Tailwind, Jest, Docker, Caddy, `pgvector/pgvector` image.
- Cost: one Lightsail instance, covered by the existing AWS credits.
