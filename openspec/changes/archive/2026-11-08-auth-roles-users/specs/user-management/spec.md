# Spec Delta

## Purpose

Defines how administrators manage user accounts, since there is no public registration, and how the first administrator exists on a fresh deployment.

## ADDED Requirements

### Requirement: Administrator-only account management
All user management endpoints SHALL be restricted to administrators.

#### Scenario: Regular user attempts management
- **WHEN** a user with the USER role calls any user management endpoint
- **THEN** the API responds with a forbidden status

### Requirement: Create users
An administrator SHALL be able to create a user by providing email, name, initial password and role. Emails SHALL be unique, compared case-insensitively.

#### Scenario: Successful creation
- **WHEN** an administrator submits a valid new user
- **THEN** the API creates an active account and responds with its profile without the password hash

#### Scenario: Duplicate email
- **WHEN** an administrator submits an email that already exists, in any letter case
- **THEN** the API responds with a conflict status and creates nothing

#### Scenario: Invalid input
- **WHEN** an administrator submits an invalid email, a password shorter than 8 characters or an unknown role
- **THEN** the API responds with a validation error naming each invalid field

### Requirement: List and read users
An administrator SHALL be able to list all users and read one user by id.

#### Scenario: List
- **WHEN** an administrator requests the user list
- **THEN** the API returns every user with id, email, name, role, active flag and creation date

#### Scenario: Unknown id
- **WHEN** an administrator requests a user id that does not exist
- **THEN** the API responds with a not found status

### Requirement: Update users
An administrator SHALL be able to change a user's name, role and active flag, and to set a new password.

#### Scenario: Update profile fields
- **WHEN** an administrator changes a user's name, role or active flag
- **THEN** the change is stored and returned in the updated profile

#### Scenario: Reset password
- **WHEN** an administrator sets a new password for a user
- **THEN** the user can log in with the new password and no longer with the old one

### Requirement: Delete users
An administrator SHALL be able to delete a user.

#### Scenario: Delete another user
- **WHEN** an administrator deletes a different user
- **THEN** the account no longer exists and its tokens are rejected

### Requirement: Last administrator is protected
The system SHALL NOT allow an administrator to delete, deactivate or demote their own account, so the system always keeps at least one active administrator.

#### Scenario: Self-delete
- **WHEN** an administrator tries to delete their own account
- **THEN** the API responds with a forbidden status and the account remains

#### Scenario: Self-demote or self-deactivate
- **WHEN** an administrator tries to change their own role to USER or set themselves inactive
- **THEN** the API responds with a forbidden status and the account is unchanged

### Requirement: First administrator bootstrap
On startup, if no administrator exists, the API SHALL create one from the configured bootstrap email and password. If an administrator already exists, startup SHALL NOT create or modify any account.

#### Scenario: Fresh database
- **WHEN** the API starts against a database with no administrator
- **THEN** an active administrator with the configured email can log in with the configured password

#### Scenario: Restart with existing administrator
- **WHEN** the API restarts and an administrator already exists
- **THEN** no account is created and no password is changed
