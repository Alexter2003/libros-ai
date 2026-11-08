# Spec Delta

## Purpose

Defines the runtime environment of the application: containerised services on a single cloud instance, reachable over HTTPS on two subdomains, with a PostgreSQL database that supports vector search.

## ADDED Requirements

### Requirement: Containerised stack on one instance
The system SHALL run the database, the API, the web app and the reverse proxy as containers orchestrated by a single compose definition on one cloud instance.

#### Scenario: Start the full stack
- **WHEN** the compose stack is started on the instance with valid environment configuration
- **THEN** all services reach a healthy state and no manual step inside a container is needed

### Requirement: Web app served on its own subdomain over HTTPS
The system SHALL serve the web app at `https://libros.alexvyumes-dev.com` with a valid, automatically issued and renewed certificate.

#### Scenario: Visit the web subdomain
- **WHEN** a user opens `https://libros.alexvyumes-dev.com`
- **THEN** the web app loads over a trusted HTTPS connection

#### Scenario: Plain HTTP is upgraded
- **WHEN** a client requests the web subdomain over HTTP
- **THEN** it is redirected to HTTPS

### Requirement: API served on its own subdomain over HTTPS
The system SHALL serve the API at `https://apilibros.alexvyumes-dev.com` with a valid, automatically issued and renewed certificate.

#### Scenario: Call the API subdomain
- **WHEN** a client requests the API health endpoint at `https://apilibros.alexvyumes-dev.com`
- **THEN** it receives a successful response over a trusted HTTPS connection

### Requirement: Database not publicly reachable
The database SHALL accept connections only from the API container and the local administrator, and SHALL NOT be exposed on a public port.

#### Scenario: External connection attempt
- **WHEN** a client outside the instance tries to connect to the database port
- **THEN** the connection is refused or times out

### Requirement: Vector search extension available
The database SHALL have the `pgvector` extension enabled through a versioned migration so that a fresh database is ready for embeddings.

#### Scenario: Fresh database
- **WHEN** migrations are applied to an empty database
- **THEN** the vector extension exists and a vector column can be created

### Requirement: Persistent data survives redeploys
Database data and certificates SHALL be stored on persistent volumes so that restarting or redeploying containers does not lose them.

#### Scenario: Redeploy
- **WHEN** the stack is redeployed with a new application version
- **THEN** existing database rows and issued certificates are still present
