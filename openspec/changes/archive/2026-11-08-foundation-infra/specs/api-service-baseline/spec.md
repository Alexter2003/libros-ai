# Spec Delta

## Purpose

Defines the minimal behaviour every deployment of the API must provide before feature work begins: a health check, public interactive documentation, restricted cross-origin access and validated configuration.

## ADDED Requirements

### Requirement: Health endpoint
The API SHALL expose a health endpoint that reports whether the service and its database connection are working.

#### Scenario: Healthy service
- **WHEN** a client requests the health endpoint and the database is reachable
- **THEN** the API responds with a success status and a body indicating the service and database are up

#### Scenario: Database unavailable
- **WHEN** a client requests the health endpoint and the database cannot be reached
- **THEN** the API responds with a failure status and a body indicating the database is down

### Requirement: Public interactive API documentation
The API SHALL publish interactive documentation at `/docs` that is accessible without authentication, including in production.

#### Scenario: Open documentation without logging in
- **WHEN** an unauthenticated visitor opens `/docs` on the API subdomain
- **THEN** the documentation page loads and lists the available endpoints

### Requirement: Documentation lists authentication schemes
The documentation SHALL declare the bearer-token scheme and the API-key header scheme so callers can authorise requests from the documentation page.

#### Scenario: Authorise button
- **WHEN** a visitor opens the documentation page
- **THEN** both authentication schemes are available to configure

### Requirement: Cross-origin access limited to the web app
The API SHALL accept browser cross-origin requests only from the configured web origin.

#### Scenario: Allowed origin
- **WHEN** the web app origin calls the API from a browser
- **THEN** the response includes the headers that allow the call

#### Scenario: Unknown origin
- **WHEN** a browser page from any other origin calls the API
- **THEN** the response does not allow the cross-origin call

### Requirement: Configuration validated at startup
The API SHALL validate its required configuration at startup and refuse to start with a clear message naming each missing or invalid variable.

#### Scenario: Missing variable
- **WHEN** the API starts without the database connection variable
- **THEN** it exits with an error that names that variable
