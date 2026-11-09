# recommender-agent Specification

## Purpose

Recommend books and comics from the catalog based on a free-text description of the user's tastes, with a short reason per recommendation and without inventing items that are not in the catalog.

## ADDED Requirements

### Requirement: Authenticated recommendation endpoint

The system SHALL expose an authenticated endpoint that receives a description of the user's tastes (maximum 1000 characters) and the identifier of an enabled AI service, and returns up to 3 recommendations plus the tokens used. Each recommendation SHALL include the item identifier, title, author, kind and a reason in Spanish.

#### Scenario: Recommend from a description
- **WHEN** an authenticated user sends "me gustan las historias de superhéroes oscuras"
- **THEN** the response contains up to 3 recommendations, each with item data and a reason

#### Scenario: Unauthenticated request
- **WHEN** a request without a valid token calls the endpoint
- **THEN** the response is 401

#### Scenario: Description too long
- **WHEN** the description exceeds 1000 characters
- **THEN** the response is 400

### Requirement: Recommendations come only from the catalog

The system SHALL retrieve candidate items by semantic similarity and ask the model to choose among them. Any recommended identifier that is not among the candidates SHALL be discarded. If the model output cannot be parsed, the system SHALL fall back to the top candidates with a generic reason.

#### Scenario: Model returns an unknown item
- **WHEN** the model output references an identifier that was not a candidate
- **THEN** that recommendation is discarded and never returned

#### Scenario: Unparseable model output
- **WHEN** the model output is not valid JSON
- **THEN** the response contains the top candidates with a generic reason

### Requirement: No relevant candidates

If no catalog item reaches the minimum similarity, the system SHALL return an empty recommendation list without calling the generation model.

#### Scenario: Unrelated description
- **WHEN** the description matches nothing in the catalog
- **THEN** the response has no recommendations and zero generation tokens

### Requirement: Quota and usage

The agent SHALL generate through the gateway, so a disabled service is rejected with 422, a user over the token limit receives 429, and the usage is recorded.

#### Scenario: Limit reached
- **WHEN** a user whose token limit is exhausted calls the endpoint
- **THEN** the response is 429
