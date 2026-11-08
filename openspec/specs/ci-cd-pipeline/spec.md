# ci-cd-pipeline Specification

## Purpose
Defines the automated quality gate and delivery flow: every change is linted and tested, and only a passing main branch is deployed automatically to the cloud instance.

## Requirements

### Requirement: Checks run on every push and pull request
The pipeline SHALL run lint, type checks and automated tests for both the API and the web app on every push and pull request.

#### Scenario: Pull request opened
- **WHEN** a pull request is opened or updated
- **THEN** the pipeline runs lint, type checks and tests for both apps and reports the result on the pull request

### Requirement: Deployment only when checks succeed
The pipeline SHALL deploy to the cloud instance only for pushes to the main branch and only if every check succeeded.

#### Scenario: Passing main branch
- **WHEN** a commit is pushed to main and all checks pass
- **THEN** the new version is built and deployed automatically

#### Scenario: Failing tests
- **WHEN** a commit is pushed to main and any test fails
- **THEN** no deployment is performed and the running version is unchanged

### Requirement: Deployment verified after release
The pipeline SHALL verify that the health endpoint of the deployed API responds successfully after a release and mark the run as failed otherwise.

#### Scenario: Release does not become healthy
- **WHEN** the health endpoint does not respond successfully within a defined time after deployment
- **THEN** the pipeline run is marked as failed

### Requirement: Deployment credentials kept as secrets
The pipeline SHALL read the server address, user and private key from the repository's secret store, and SHALL NOT print them in logs.

#### Scenario: Log inspection
- **WHEN** a deployment run log is viewed
- **THEN** it contains no private key or other credential values
