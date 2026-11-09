## Purpose

Give authenticated users a chat screen in the web application to ask about the catalog, see the sources of each answer and revisit earlier conversations.

## ADDED Requirements

### Requirement: Chat menu entry

The main menu SHALL show a chat entry for every authenticated user that opens the chat screen.

#### Scenario: Open the chat
- **WHEN** an authenticated user selects the chat entry in the menu
- **THEN** the chat screen opens

#### Scenario: Anonymous visitor
- **WHEN** an unauthenticated visitor opens the chat route
- **THEN** they are redirected to the login screen

### Requirement: Ask and read answers

The chat screen SHALL let the user choose among enabled AI services, type a question and see the conversation thread, with a loading state while the answer is generated.

#### Scenario: Send a question
- **WHEN** the user submits a question
- **THEN** the question and the answer appear in the thread

#### Scenario: Not enough information
- **WHEN** the answer is not grounded
- **THEN** the thread shows the answer without sources

### Requirement: Sources visible

Each grounded answer SHALL show its sources as links that open the item in the catalog.

#### Scenario: Open a source
- **WHEN** the user selects a source of an answer
- **THEN** the catalog opens on that item

### Requirement: Session history in the screen

The chat screen SHALL list the user's previous sessions, open any of them with its messages, and allow starting a new one.

#### Scenario: Reopen a session
- **WHEN** the user selects a previous session
- **THEN** its messages are shown and new questions continue that session

### Requirement: Remaining tokens and errors

The chat screen SHALL show the user's remaining tokens and explain the failures the user can act on: limit reached, service disabled and model unavailable.

#### Scenario: Limit reached
- **WHEN** the API answers 429
- **THEN** the screen explains that the token limit was reached and suggests asking an administrator

#### Scenario: Remaining tokens
- **WHEN** the chat screen loads
- **THEN** the user sees how many tokens remain, or that there is no limit
