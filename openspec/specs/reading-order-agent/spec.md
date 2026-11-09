# reading-order-agent Specification

## Purpose
Tell the user in which order to read the items of a series in the catalog: the model finds the series and proposes the order with an explanation through catalog tools, and the code validates it and falls back to a deterministic order.

## Requirements

### Requirement: Authenticated reading-order endpoint

The system SHALL expose an authenticated endpoint that receives a series or title query (maximum 200 characters) and the identifier of an enabled AI service, and returns the matching series name, the ordered items, an explanation in Spanish and the tokens used.

#### Scenario: Order a known series
- **WHEN** an authenticated user asks for the reading order of a series present in the catalog
- **THEN** the response lists that series' items in order with the explanation

#### Scenario: Unauthenticated request
- **WHEN** a request without a valid token calls the endpoint
- **THEN** the response is 401

### Requirement: Deterministic ordering

The system SHALL order the items of the series by issue number ascending, then by year ascending, then by title, in code and not by the model. Items without issue number SHALL go after numbered ones.

#### Scenario: Numbered issues
- **GIVEN** a series with issues 3, 1 and 2
- **WHEN** the reading order is requested
- **THEN** the items are returned as 1, 2, 3

### Requirement: Series resolution

The system SHALL resolve the query to a series by case-insensitive match on the series name or on an item title; when no series matches, it SHALL fall back to the most similar item by embedding and use its series. If the item has no series, the result SHALL contain only that item.

#### Scenario: Query is a title inside a series
- **WHEN** the query is the title of one issue of a series
- **THEN** the whole series is returned in order

#### Scenario: Nothing matches
- **WHEN** no series or item reaches the minimum similarity
- **THEN** the response has no items, an explanation saying the catalog has no information, and zero generation tokens

### Requirement: Quota and usage

The agent SHALL generate the explanation through the gateway, with the same service, limit and usage-recording rules as the other AI features.

#### Scenario: Disabled service
- **WHEN** the selected service is disabled
- **THEN** the response is 422
