## Purpose

Answer user questions about books and comics using only the catalog items retrieved for the question, citing them as sources and admitting when the catalog does not contain enough information.

## ADDED Requirements

### Requirement: Authenticated chat endpoint

The system SHALL expose an authenticated endpoint that receives a question and the identifier of an enabled AI service, and optionally the identifier of an existing session. It SHALL return the answer, the session identifier, the sources, whether the answer was grounded, and the tokens used. A question SHALL be limited to 1000 characters.

#### Scenario: Ask a question in a new session
- **WHEN** an authenticated user sends a question without a session identifier
- **THEN** a new session is created and the response includes its identifier, the answer and the sources

#### Scenario: Unauthenticated request
- **WHEN** a request without a valid token calls the chat endpoint
- **THEN** the response is 401

#### Scenario: Question too long
- **WHEN** the question exceeds 1000 characters
- **THEN** the response is 400

### Requirement: Catalog-grounded answers

The system SHALL answer using only the catalog items retrieved for the question. The generation prompt SHALL contain those items, the recent conversation and instructions to answer in Spanish and to rely only on the provided items.

#### Scenario: Retrieved items feed the answer
- **GIVEN** the catalog contains items similar to the question
- **WHEN** the user asks the question
- **THEN** the generation prompt includes the retrieved items and the response sources list those items

### Requirement: Sources in every grounded answer

Each grounded answer SHALL list the catalog items used, each with identifier, title, author, kind and similarity score, so the user can open them in the catalog.

#### Scenario: Sources returned
- **WHEN** a grounded answer is produced
- **THEN** the response contains the retrieved items as sources

### Requirement: Not enough information answer

When no retrieved item reaches the minimum similarity, the system SHALL answer that it does not have enough information in the catalog, SHALL NOT call the generation model, SHALL return no sources and SHALL mark the answer as not grounded.

#### Scenario: Off-topic question
- **GIVEN** no catalog item reaches the minimum similarity
- **WHEN** the user asks the question
- **THEN** the answer states there is not enough information, the sources are empty, grounded is false and no generation tokens are consumed

### Requirement: Session memory

The system SHALL include the most recent messages of the session in the generation prompt so follow-up questions are understood in context.

#### Scenario: Follow-up question
- **GIVEN** a session where the user asked about a comic series
- **WHEN** the user asks "and who wrote it?"
- **THEN** the prompt sent to the model includes the previous question and answer

### Requirement: Gateway rules apply to chat

The chat SHALL respect the AI service on/off switch and the user's token limit, and SHALL record the generation tokens as usage through the gateway.

#### Scenario: Disabled service
- **WHEN** the user selects a disabled AI service
- **THEN** the response is 422

#### Scenario: Limit reached
- **GIVEN** a user whose consumption reached the token limit
- **WHEN** the user asks a question
- **THEN** the response is 429 and the question is not embedded or generated

#### Scenario: Unknown service
- **WHEN** the service identifier does not exist
- **THEN** the response is 404

#### Scenario: Model unavailable
- **WHEN** the provider fails during generation
- **THEN** the response is 503 with a generic message and the user message of that turn is not stored
