# Spec Delta

## ADDED Requirements

### Requirement: Model-driven series lookup

The reading-order agent SHALL let the model decide which catalog tools to call to find the series that matches the query and list its volumes, and SHALL propose the reading order and its explanation in Spanish. Only the volumes returned by the tools during the request SHALL be considered part of the series.

#### Scenario: Find a series by title
- **WHEN** the query is the title of one issue of a series
- **THEN** the model finds the series, lists its volumes and the response contains all of them in order with the explanation

## MODIFIED Requirements

### Requirement: Deterministic ordering

The system SHALL accept the order proposed by the model only if it contains every listed volume exactly once and keeps numbered volumes in ascending issue number. Otherwise, and when the step limit is reached or the output cannot be parsed, the system SHALL order the volumes in code by issue number ascending, then year ascending, then title, with volumes without issue number after numbered ones.

#### Scenario: Numbered issues
- **GIVEN** a series with issues 3, 1 and 2
- **WHEN** the reading order is requested and the model proposes 3, 1, 2
- **THEN** the items are returned as 1, 2, 3

#### Scenario: Valid model order
- **GIVEN** a series whose volumes have no issue numbers
- **WHEN** the model proposes an order that includes every volume once
- **THEN** that order is returned

### Requirement: Series resolution

The system SHALL resolve the query to a series through catalog tools called by the model: matching by series name or item title, and by similarity when there is no textual match. If the matched item has no series, the result SHALL contain only that item. When no series or item matches, the response SHALL have no items and an explanation saying the catalog has no information.

#### Scenario: Query is a title inside a series
- **WHEN** the query is the title of one issue of a series
- **THEN** the whole series is returned in order

#### Scenario: Nothing matches
- **WHEN** the tools find no series or item for the query
- **THEN** the response has no items and an explanation saying the catalog has no information

### Requirement: Quota and usage

The agent SHALL call the model through the gateway on every step, with the same service, limit and usage-recording rules as the other AI features, and SHALL report the tokens summed over all its model calls.

#### Scenario: Disabled service
- **WHEN** the selected service is disabled
- **THEN** the response is 422
