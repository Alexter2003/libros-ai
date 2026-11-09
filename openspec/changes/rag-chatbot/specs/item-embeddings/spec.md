## Purpose

Keep a vector representation of every catalog item so the chatbot can retrieve the items most relevant to a question by semantic similarity.

## ADDED Requirements

### Requirement: Item embedding

The system SHALL store one embedding of 1024 dimensions per catalog item, generated with Amazon Titan Text Embeddings v2 from the item's title, author, kind, genre, year, series and synopsis. An item without an embedding SHALL be excluded from similarity search.

#### Scenario: Embedding is built from item content
- **WHEN** an embedding is generated for an item
- **THEN** the text sent to the embedding model includes the title, author, kind, genre, year, series (when present) and synopsis

#### Scenario: Item without embedding is not retrievable
- **GIVEN** an item whose embedding is missing
- **WHEN** a similarity search runs
- **THEN** that item is never returned

### Requirement: Administrator reindex

The system SHALL expose an administrator-only endpoint that generates embeddings for all items that lack one and reports how many were indexed and how many failed. A query option SHALL allow regenerating the embeddings of every item.

#### Scenario: Reindex missing embeddings
- **GIVEN** 25 items and 5 of them without embedding
- **WHEN** an administrator calls the reindex endpoint
- **THEN** only the 5 items are embedded and the response reports 5 indexed, 0 failed and 25 total

#### Scenario: Reindex everything
- **WHEN** an administrator calls the reindex endpoint requesting all items
- **THEN** every item is embedded again

#### Scenario: Non-administrator is rejected
- **WHEN** a user with the USER role calls the reindex endpoint
- **THEN** the response is 403

#### Scenario: One item fails
- **GIVEN** the embedding provider fails for one item
- **WHEN** an administrator calls the reindex endpoint
- **THEN** the remaining items are still processed and the failed one is counted as failed

### Requirement: Similarity search

The system SHALL return the catalog items closest to a query embedding ordered by cosine similarity, limited to a configured maximum number of results, each with its similarity score.

#### Scenario: Closest items first
- **WHEN** a similarity search runs with a query embedding
- **THEN** at most the configured number of items is returned, ordered from highest to lowest similarity

### Requirement: Embedding usage recording

The system SHALL record every embedding call as a usage event of the service "Titan Embeddings" attributed to the user who triggered it, with the input tokens reported by the provider and zero output tokens. These events SHALL count in the user's consumption total but SHALL NOT be checked against the token limit on their own.

#### Scenario: Question embedding is recorded
- **WHEN** a user's chat question is embedded
- **THEN** a usage event named "Titan Embeddings" is stored for that user with the reported input tokens

#### Scenario: Embedding is not blocked by the limit
- **GIVEN** a user already past the limit
- **WHEN** an administrator reindexes items
- **THEN** the embeddings are generated and recorded without a 429 response
