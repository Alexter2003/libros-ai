# bedrock-generation Specification

## Purpose
Defines the gateway endpoint that generates text through Amazon Bedrock for an enabled AI service, including failure behaviour and the rule that configuration secrets never appear in responses.

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

### Requirement: Tool-use conversations through the gateway

The gateway SHALL support a model conversation with tool definitions, returning the model text and any tool calls it requests, with the same rules as text generation: a disabled service is rejected with 422, a user over the token limit with 429, a provider failure with 503, and the tokens of every call are recorded as usage of the service. Text generation used by the chat and the generation endpoint SHALL keep its current behavior.

#### Scenario: Disabled service
- **WHEN** a tool-use conversation is requested on a disabled service
- **THEN** the response is 422 and nothing is recorded

#### Scenario: Usage recorded
- **WHEN** a tool-use call completes
- **THEN** its input and output tokens are recorded for the user and the service

#### Scenario: Text generation unchanged
- **WHEN** the chat or the generation endpoint is used
- **THEN** it behaves exactly as before this change
