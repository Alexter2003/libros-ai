# web-agents-ui Specification

## Purpose

Let authenticated users run the recommender and reading-order agents from the web app and see results linked to the catalog.

## ADDED Requirements

### Requirement: Agents screen

The web app SHALL provide an authenticated `/agents` screen reachable from the menu, with one tab per agent, an enabled-service selector and the remaining token budget.

#### Scenario: Open the screen
- **WHEN** an authenticated user opens `/agents`
- **THEN** both agents are available and the service selector lists only enabled services

### Requirement: Recommender tab

The recommender tab SHALL send the description, show each recommendation with its reason and a link to the item in the catalog, and show the tokens used.

#### Scenario: Run the recommender
- **WHEN** the user submits a description
- **THEN** up to 3 recommendation cards appear with title, author, reason and a catalog link

### Requirement: Reading-order tab

The reading-order tab SHALL send the query and show the explanation and the numbered list of items in order, each linking to the catalog.

#### Scenario: Run the reading order
- **WHEN** the user submits a series name
- **THEN** the explanation and the ordered list appear

### Requirement: Friendly errors

The screen SHALL show a friendly message for 422 (service disabled), 429 (limit reached) and 503 (model unavailable) responses.

#### Scenario: Limit reached
- **WHEN** the API responds 429
- **THEN** the screen shows a message that the token limit was reached
