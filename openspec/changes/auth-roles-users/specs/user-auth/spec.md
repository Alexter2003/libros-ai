# Spec Delta

## Purpose

Defines how the API identifies callers and decides what each role may do: credential login, bearer access tokens, current-user lookup and default-protected endpoints with role checks.

## ADDED Requirements

### Requirement: Credential login
The API SHALL authenticate a user by email and password and return a signed access token together with the user's public profile.

#### Scenario: Valid credentials
- **WHEN** an active user submits a correct email and password
- **THEN** the API responds with a success status, an access token and the user's id, email, name and role

#### Scenario: Wrong password or unknown email
- **WHEN** a client submits an unknown email or an incorrect password
- **THEN** the API responds with an unauthorized status and the same generic message in both cases

#### Scenario: Deactivated user
- **WHEN** a deactivated user submits correct credentials
- **THEN** the API responds with an unauthorized status and no token

### Requirement: Short-lived access tokens
Access tokens SHALL expire after a configured lifetime and SHALL be rejected after expiry or when their signature is invalid.

#### Scenario: Expired token
- **WHEN** a client calls a protected endpoint with an expired token
- **THEN** the API responds with an unauthorized status

#### Scenario: Tampered token
- **WHEN** a client calls a protected endpoint with a token whose signature does not verify
- **THEN** the API responds with an unauthorized status

### Requirement: Endpoints protected by default
Every API endpoint SHALL require a valid access token unless it is explicitly marked public. The health endpoint, the login endpoint and the documentation page SHALL remain public.

#### Scenario: Missing token
- **WHEN** a client calls a protected endpoint without an Authorization header
- **THEN** the API responds with an unauthorized status

#### Scenario: Public endpoints
- **WHEN** an unauthenticated client calls the health endpoint, the login endpoint or opens `/docs`
- **THEN** the request is served without requiring a token

### Requirement: Token reflects current account state
A valid token SHALL be accepted only while its account still exists and is active, and the user's role SHALL be read from the account, not from the token.

#### Scenario: Account deactivated after login
- **WHEN** an administrator deactivates a user and that user then calls a protected endpoint with a previously issued token
- **THEN** the API responds with an unauthorized status

#### Scenario: Role changed after login
- **WHEN** an administrator changes a user's role and that user calls a role-restricted endpoint with a previously issued token
- **THEN** the access decision uses the new role

### Requirement: Role-based access
Endpoints marked as restricted to a role SHALL reject callers who do not hold that role.

#### Scenario: Regular user on admin endpoint
- **WHEN** an authenticated user with the USER role calls an administrator-only endpoint
- **THEN** the API responds with a forbidden status

#### Scenario: Administrator on admin endpoint
- **WHEN** an authenticated administrator calls an administrator-only endpoint
- **THEN** the request is served

### Requirement: Current user lookup
The API SHALL provide an endpoint that returns the profile of the authenticated caller.

#### Scenario: Valid token
- **WHEN** an authenticated user calls the current-user endpoint
- **THEN** the API responds with that user's id, email, name and role, and never the password hash

### Requirement: Logout
The API SHALL provide a logout operation that ends the client session. Because access tokens are stateless and short-lived, the client discards the token and the operation SHALL succeed for any valid token.

#### Scenario: Logout
- **WHEN** an authenticated user calls logout
- **THEN** the API responds with a success status and the web app no longer holds a usable session

### Requirement: Credential and secret handling
Passwords SHALL be stored only as salted hashes and SHALL never appear in any response or log. The API SHALL refuse to start without a signing secret of adequate length.

#### Scenario: Response never exposes the hash
- **WHEN** any endpoint returns a user
- **THEN** the body contains no password or password hash field

#### Scenario: Missing signing secret
- **WHEN** the API starts without the token signing secret
- **THEN** it exits with an error that names that variable
