## ADDED Requirements

### Requirement: Embedding refresh on write

Creating an item or updating any of its title, author, kind, genre, year, series or synopsis SHALL refresh that item's embedding. If the embedding provider fails, the write SHALL still succeed and the item SHALL be left without embedding so a later reindex picks it up.

#### Scenario: Create refreshes embedding
- **WHEN** an administrator creates an item and the provider is available
- **THEN** the item has an embedding after the request

#### Scenario: Update of embedded fields
- **WHEN** an administrator changes the synopsis of an item
- **THEN** its embedding is regenerated

#### Scenario: Update of other fields
- **WHEN** an administrator changes only the cover or ISBN of an item
- **THEN** the embedding is not regenerated

#### Scenario: Provider failure does not fail the write
- **GIVEN** the embedding provider is unavailable
- **WHEN** an administrator creates or updates an item
- **THEN** the item is saved, the response is successful and the item has no embedding
