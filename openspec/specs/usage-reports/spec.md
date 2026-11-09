# usage-reports Specification

## Purpose

Lets users see their own token consumption and lets administrators audit consumption and chat activity of every user, with flat report data that external tools such as Power BI can read.

## Requirements

### Requirement: Own consumption summary

The system SHALL let any authenticated user read their own consumption: total input, output and combined tokens, token limit and remaining tokens, plus totals grouped by AI service and by day, optionally restricted to a date range. A user SHALL never receive data of another user.

#### Scenario: Summary of own usage
- **WHEN** a user requests their consumption without filters
- **THEN** the response contains their totals, the limit, the remaining tokens, and their totals per AI service and per day

#### Scenario: Date range
- **WHEN** a user requests their consumption with a start and end date
- **THEN** only usage events inside the range are counted

#### Scenario: Invalid range
- **WHEN** the start date is later than the end date
- **THEN** the response is 400

### Requirement: Usage report rows

The system SHALL expose a report of usage rows, one per day, user and AI service, each with date, user id, user email, service name, request count, input tokens, output tokens and total tokens. It SHALL accept optional filters by user, AI service and date range, and return rows ordered by date ascending.

#### Scenario: Filtered by user and service
- **GIVEN** usage by several users on several services
- **WHEN** the report is requested with a user and a service filter
- **THEN** only rows of that user and service are returned

#### Scenario: Aggregation per day
- **GIVEN** three usage events of one user and one service on the same day
- **WHEN** the report is requested
- **THEN** one row is returned with request count 3 and the summed tokens

#### Scenario: Deleted service keeps its name
- **GIVEN** usage recorded for an AI service that was later deleted
- **WHEN** the report is requested
- **THEN** its rows still show the service name stored at the time of the call

### Requirement: Report access control

The usage report and the chat session report SHALL be available to administrators authenticated with a bearer token and to clients authenticated with a valid API key. A regular user SHALL receive 403 and an unauthenticated request 401.

#### Scenario: Regular user
- **WHEN** a non-admin user requests the usage report
- **THEN** the response is 403

#### Scenario: Administrator
- **WHEN** an administrator requests the usage report
- **THEN** the response contains rows of all users

#### Scenario: API key
- **WHEN** a client sends a valid API key to the usage report
- **THEN** the response contains rows of all users

### Requirement: Chat session report

The system SHALL expose a report of chat sessions with session id, user id, user email, title, message count, total tokens, creation and last activity dates, filterable by user and date range, ordered by last activity descending. It SHALL NOT include message content.

#### Scenario: Filter by user
- **WHEN** an administrator requests the report filtered by one user
- **THEN** only that user's sessions are returned

#### Scenario: No content exposed
- **WHEN** a client authenticated with an API key reads the chat session report
- **THEN** the rows contain metadata and token totals but no message text

### Requirement: Administrator reads any session

The system SHALL let an administrator read the full messages of any user's session. API key clients SHALL NOT have access to this endpoint.

#### Scenario: Admin reads another user's session
- **WHEN** an administrator requests a session owned by another user
- **THEN** the messages are returned oldest first with role, content, sources and tokens

#### Scenario: API key rejected
- **WHEN** a client with a valid API key requests a session's messages
- **THEN** the response is 401

