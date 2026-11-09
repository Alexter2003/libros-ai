# chat-history Specification

## Purpose
Register every conversation and let each user consult their own past sessions and messages, as required for conversation history.

## Requirements

### Requirement: Persist sessions and messages

The system SHALL persist each chat turn: the user message and the assistant answer, in a session owned by the user. Each assistant message SHALL store its sources and tokens used. A new session SHALL take its title from the first question, truncated to 80 characters.

#### Scenario: Turn is registered
- **WHEN** a chat turn completes
- **THEN** the session contains the user message and the assistant message in order, with the assistant message holding its sources and tokens

#### Scenario: Session title
- **WHEN** a session is created from a question longer than 80 characters
- **THEN** its title is the first 80 characters of the question

### Requirement: List own sessions

The system SHALL let an authenticated user list their own sessions ordered by most recent activity, each with identifier, title and last activity date.

#### Scenario: Only own sessions
- **GIVEN** two users with sessions
- **WHEN** one of them lists sessions
- **THEN** only that user's sessions are returned, most recent first

### Requirement: Read own session

The system SHALL let an authenticated user read all messages of one of their sessions in chronological order. Reading a session that belongs to another user, or does not exist, SHALL return 404.

#### Scenario: Read messages
- **WHEN** a user reads one of their sessions
- **THEN** the messages are returned oldest first with role, content, sources and tokens

#### Scenario: Other user's session
- **WHEN** a user requests a session owned by another user
- **THEN** the response is 404

### Requirement: Continue only own sessions

The system SHALL reject a chat request that references a session owned by another user or non-existent with 404, without creating messages.

#### Scenario: Foreign session in chat
- **WHEN** a user sends a question with another user's session identifier
- **THEN** the response is 404 and nothing is stored

### Requirement: Administrator audit of history

The system SHALL let an administrator list sessions of all users, filtered by user and date range, and read the messages of any session. These administrator capabilities SHALL NOT change what a regular user can see: each user keeps access only to their own sessions.

#### Scenario: Admin lists all sessions
- **WHEN** an administrator requests the chat session report without filters
- **THEN** sessions of all users are returned

#### Scenario: User remains restricted
- **WHEN** a regular user lists or reads sessions
- **THEN** only their own sessions are accessible and another user's session returns 404
