# Spec Delta

## ADDED Requirements

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
