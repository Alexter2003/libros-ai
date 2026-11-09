# api-key-auth Specification

## Purpose

Allows external read-only consumers, such as Power BI, to authenticate with a revocable API key instead of a user login, without exposing the rest of the API.

## Requirements

### Requirement: Create API keys

The system SHALL let an administrator create an API key with a name. The plain key SHALL be returned only in the creation response and never again. Only a hash of the key SHALL be stored.

#### Scenario: Key created
- **WHEN** an administrator creates a key named "Power BI"
- **THEN** the response contains the plain key once, its id, name and prefix, and later listings do not contain the plain key

#### Scenario: Not an administrator
- **WHEN** a regular user tries to create a key
- **THEN** the response is 403

### Requirement: List and revoke API keys

The system SHALL let an administrator list keys with id, name, prefix, creation date, last use date and revocation date, and revoke a key. A revoked key SHALL stop authenticating immediately.

#### Scenario: Listing
- **WHEN** an administrator lists keys
- **THEN** each key shows its metadata and never its plain value or hash

#### Scenario: Revoked key
- **GIVEN** a revoked key
- **WHEN** a client uses it on a report endpoint
- **THEN** the response is 401

### Requirement: Authenticate with X-API-Key

The system SHALL accept an `X-API-Key` header as credential only on report endpoints. Any other endpoint SHALL ignore it and require a bearer token. A missing, unknown or revoked key SHALL produce 401. A successful use SHALL update the key's last use date.

#### Scenario: Valid key on a report endpoint
- **WHEN** a client sends a valid `X-API-Key` to a report endpoint
- **THEN** the request is authorized as read-only access and the key's last use date is updated

#### Scenario: Key on another endpoint
- **WHEN** a client sends a valid `X-API-Key` to the chat endpoint
- **THEN** the response is 401

#### Scenario: Unknown key
- **WHEN** a client sends an unknown key to a report endpoint
- **THEN** the response is 401

