# bedrock-generation Specification

## Purpose
TBD - created by archiving change token-metering-gateway. Update Purpose after archive.

## Requirements

### Requirement: Gateway generation endpoint
The API SHALL expose an authenticated endpoint that takes an enabled AI service and a text prompt, runs the quota check, calls the model through Amazon Bedrock and returns the generated text together with the token usage reported by the model.

#### Scenario: Successful generation
- **WHEN** an authenticated user sends a prompt to an enabled service and is within the quota
- **THEN** the API responds with the generated text, the input and output token counts, and the service name

#### Scenario: Disabled service
- **WHEN** a user sends a prompt to a disabled service
- **THEN** the API responds with a not found or unprocessable status and no model call is made

#### Scenario: Empty prompt
- **WHEN** a user sends an empty prompt
- **THEN** the API responds with a validation error and no model call is made

### Requirement: Model invocation failure
When the model call fails, the API SHALL respond with a server error that does not expose provider credentials or internal details, and SHALL NOT record usage.

#### Scenario: Provider unavailable
- **WHEN** the model provider returns an error
- **THEN** the API responds with a service unavailable status and stores no usage event

### Requirement: Configuration without secrets in responses
The API SHALL read the model region, model identifier and credentials from server configuration and SHALL NOT return any of them in responses or logs.

#### Scenario: Response content
- **WHEN** any generation request is answered, successfully or not
- **THEN** the body contains no credential values and no provider account identifiers
