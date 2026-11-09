# Spec Delta

## ADDED Requirements

### Requirement: Administrator audit of history

The system SHALL let an administrator list sessions of all users, filtered by user and date range, and read the messages of any session. These administrator capabilities SHALL NOT change what a regular user can see: each user keeps access only to their own sessions.

#### Scenario: Admin lists all sessions
- **WHEN** an administrator requests the chat session report without filters
- **THEN** sessions of all users are returned

#### Scenario: User remains restricted
- **WHEN** a regular user lists or reads sessions
- **THEN** only their own sessions are accessible and another user's session returns 404
