## ADDED Requirements

### Requirement: Token limit in the users administration screen

The users administration screen SHALL show each user's token limit ("Sin límite" when null) and let an administrator edit it. A "Sin límite" checkbox SHALL store a null limit; when unchecked, a non-negative integer SHALL be required.

#### Scenario: Set a limit
- **WHEN** an administrator unchecks "Sin límite", enters 500 and saves
- **THEN** the user's token limit becomes 500 and the table shows 500

#### Scenario: Remove the limit
- **WHEN** an administrator checks "Sin límite" and saves
- **THEN** the user's token limit becomes null and the table shows "Sin límite"
