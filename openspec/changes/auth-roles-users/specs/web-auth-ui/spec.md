# Spec Delta

## Purpose

Defines the web experience for signing in and out, role-aware navigation and the administrator screen for managing users, using the existing dark design system.

## ADDED Requirements

### Requirement: Login screen
The web app SHALL present a login form that signs the user in against the API and shows a clear message when sign-in fails.

#### Scenario: Successful sign-in
- **WHEN** a visitor submits valid credentials
- **THEN** the app stores the session and shows the main menu

#### Scenario: Failed sign-in
- **WHEN** a visitor submits invalid credentials
- **THEN** the form stays visible and shows an error message without revealing which field was wrong

### Requirement: Session persistence and expiry
The web app SHALL keep the session across page reloads until logout or token expiry, and SHALL return the user to the login screen when the API rejects the token.

#### Scenario: Reload
- **WHEN** a signed-in user reloads the page
- **THEN** the user remains signed in and sees the same screen

#### Scenario: Expired session
- **WHEN** the API responds unauthorized to an authenticated request
- **THEN** the app clears the session and shows the login screen

### Requirement: Protected screens
Every screen except login SHALL require a session, and administrator screens SHALL require the ADMIN role.

#### Scenario: Visitor opens a protected address
- **WHEN** an unauthenticated visitor opens a protected address
- **THEN** the app shows the login screen

#### Scenario: Regular user opens an admin address
- **WHEN** a USER-role user opens the users administration address
- **THEN** the app does not show the screen and returns the user to the main menu

### Requirement: Role-aware main menu
The web app SHALL show a main menu with the signed-in user's name and role, listing administrative options only to administrators.

#### Scenario: Administrator menu
- **WHEN** an administrator is signed in
- **THEN** the menu includes the users administration option

#### Scenario: User menu
- **WHEN** a USER-role user is signed in
- **THEN** the menu does not include any administrative option

### Requirement: Logout action
The web app SHALL provide a logout action available from every authenticated screen.

#### Scenario: Logout
- **WHEN** a signed-in user chooses logout
- **THEN** the session is cleared and the login screen is shown

### Requirement: Users administration screen
Administrators SHALL be able to list, create, edit, deactivate, reset the password of and delete users from the web app, with API errors shown in the interface.

#### Scenario: Create user
- **WHEN** an administrator submits the create form with valid data
- **THEN** the new user appears in the list

#### Scenario: Duplicate email
- **WHEN** an administrator submits an email that already exists
- **THEN** the form shows that the email is already in use

#### Scenario: Own account actions
- **WHEN** an administrator views their own row
- **THEN** delete, deactivate and demote actions are unavailable for that row
