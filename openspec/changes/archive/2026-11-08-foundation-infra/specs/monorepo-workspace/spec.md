# Spec Delta

## Purpose

Defines how the repository is organised and how a developer runs, builds and tests the API and the web app together from a single checkout, so both apps evolve and ship as one project.

## ADDED Requirements

### Requirement: Single repository with API and web apps
The repository SHALL contain the API and the web app as separate workspace packages managed by one package manager and one lockfile.

#### Scenario: Fresh install
- **WHEN** a developer runs the workspace install command at the repository root
- **THEN** dependencies for both apps are installed and no per-app install is required

### Requirement: One command to run both apps locally
The repository SHALL provide a root command that starts the API and the web app together for local development.

#### Scenario: Start development environment
- **WHEN** a developer runs the root development command with the database container running
- **THEN** the API and the web dev server start and the web app can reach the API health endpoint

### Requirement: Root commands for build, test and lint
The repository SHALL provide root commands that build, test and lint every app, failing with a non-zero exit code if any app fails.

#### Scenario: Test failure propagates
- **WHEN** a test in any app fails and the root test command is run
- **THEN** the command exits with a non-zero code and reports which app failed

### Requirement: Strict typing without escape hatches
Both apps SHALL compile with TypeScript strict mode, and linting SHALL reject explicit `any` types.

#### Scenario: Explicit any is rejected
- **WHEN** source code contains an explicit `any` type and lint runs
- **THEN** lint fails and reports the offending location

### Requirement: Secrets are never committed
The repository SHALL ignore local environment files and SHALL provide a documented example environment file listing every required variable without real values.

#### Scenario: Example environment file
- **WHEN** a developer copies the example environment file and fills in values
- **THEN** the API starts without reporting missing configuration
