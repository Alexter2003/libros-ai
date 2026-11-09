# ai-service-config Specification

## Purpose
TBD - created by archiving change token-metering-gateway. Update Purpose after archive.

## Requirements

### Requirement: AI service catalog management
Administrators SHALL be able to create, list, read, update and delete AI services. Each service has a unique name, a model identifier, a provider, an enabled flag and optional generation parameters (maximum output tokens, temperature).

#### Scenario: Create a service
- **WHEN** an administrator submits a valid new service
- **THEN** the API stores it as enabled and responds with its profile

#### Scenario: Duplicate name
- **WHEN** an administrator submits a service name that already exists, in any letter case
- **THEN** the API responds with a conflict status and creates nothing

#### Scenario: Invalid input
- **WHEN** an administrator submits a service with an empty model identifier or a temperature outside the allowed range
- **THEN** the API responds with a validation error naming each invalid field

### Requirement: Enable and disable services
Administrators SHALL be able to enable or disable a service without deleting it.

#### Scenario: Disable a service
- **WHEN** an administrator disables a service
- **THEN** the service is stored as disabled and any call to it is refused until it is enabled again

### Requirement: Administrator-only service management
All AI service management endpoints SHALL be restricted to administrators. Any authenticated user SHALL be able to list enabled services so they can choose one.

#### Scenario: Regular user manages services
- **WHEN** a user with the USER role attempts to create, update, disable or delete a service
- **THEN** the API responds with a forbidden status

#### Scenario: Regular user lists services
- **WHEN** a user with the USER role requests the service list
- **THEN** the API returns only the enabled services

### Requirement: Deleting a service keeps usage history
Deleting a service SHALL NOT delete the usage records that reference it.

#### Scenario: Delete a used service
- **WHEN** an administrator deletes a service that has usage records
- **THEN** the service is removed and its usage records remain, identified by the service name stored at call time
