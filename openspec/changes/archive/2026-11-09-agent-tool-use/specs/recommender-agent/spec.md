# Spec Delta

## ADDED Requirements

### Requirement: Model-driven search and comparison

The recommender SHALL let the model decide which catalog tools to call, such as searching the catalog and reading item details, before it recommends. The agent SHALL consider recommendable only the items that the tools returned during the request.

#### Scenario: Search, inspect and recommend
- **WHEN** a user describes their tastes
- **THEN** the model searches the catalog, may read details of candidates, and answers with up to 3 recommendations chosen among the items returned by the tools

## MODIFIED Requirements

### Requirement: Recommendations come only from the catalog

The system SHALL retrieve candidate items through catalog tools called by the model. Any recommended identifier that was not returned by a tool during the request SHALL be discarded, as well as duplicates. If the final model output cannot be parsed or the step limit is reached, the system SHALL fall back to the top items returned by the first search with a generic reason.

#### Scenario: Model returns an unknown item
- **WHEN** the model output references an identifier that no tool returned
- **THEN** that recommendation is discarded and never returned

#### Scenario: Unparseable model output
- **WHEN** the model output is not valid JSON
- **THEN** the response contains the top items found by the search with a generic reason

### Requirement: No relevant candidates

If the catalog tools return no item reaching the minimum similarity, the system SHALL return an empty recommendation list.

#### Scenario: Unrelated description
- **WHEN** the description matches nothing in the catalog
- **THEN** the response has no recommendations

### Requirement: Quota and usage

The agent SHALL call the model through the gateway on every step, so a disabled service is rejected with 422, a user over the token limit receives 429 and the usage of each call is recorded. The response SHALL report the tokens summed over all model calls of the request.

#### Scenario: Limit reached
- **WHEN** a user whose token limit is exhausted calls the endpoint
- **THEN** the response is 429

#### Scenario: Tokens summed
- **WHEN** the agent makes several model calls
- **THEN** the response reports the sum of their input and output tokens
