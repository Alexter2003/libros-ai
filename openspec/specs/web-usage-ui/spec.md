# web-usage-ui Specification

## Purpose

Gives users a screen for their own consumption and history, and administrators screens to audit usage and manage API keys.

## Requirements

### Requirement: Personal consumption screen

The web app SHALL provide a screen, reachable from the navigation, where any authenticated user sees their token limit, tokens used and remaining, consumption per service and per day with an optional date range, and their chat sessions linking to the chat.

#### Scenario: Consumption visible
- **WHEN** a user opens the screen
- **THEN** they see their limit, used and remaining tokens, and the per-service and per-day breakdown

#### Scenario: Open a past conversation
- **WHEN** a user selects one of their sessions
- **THEN** the chat opens with that conversation

### Requirement: Admin usage report screen

The web app SHALL provide an administrator-only screen with the usage rows and chat sessions of all users, filterable by user, AI service and date range, showing totals for the filtered rows, and allowing the administrator to open a session's messages. Regular users SHALL be redirected away.

#### Scenario: Apply filters
- **WHEN** an administrator selects a user and a date range
- **THEN** the table and totals show only matching rows

#### Scenario: Read a conversation
- **WHEN** an administrator opens a session from the report
- **THEN** its messages are shown read-only

#### Scenario: Regular user
- **WHEN** a non-admin navigates to the screen
- **THEN** they are redirected

### Requirement: API key management screen

The web app SHALL provide an administrator-only screen to create, list and revoke API keys. After creation it SHALL show the plain key once with a copy action and a warning that it will not be shown again.

#### Scenario: Create and copy
- **WHEN** an administrator creates a key
- **THEN** the plain key is displayed once with a copy action

#### Scenario: Revoke
- **WHEN** an administrator revokes a key
- **THEN** the list marks it as revoked

