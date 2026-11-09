# Spec Delta

## Purpose

Defines the repeatable command that loads the demo catalog, so any environment can be populated with realistic data and the course's demo-data deliverable is met.

## ADDED Requirements

### Requirement: Single-command demo load
The system SHALL provide one command that loads the demo catalog into the configured database without any manual step.

#### Scenario: Load on an empty catalog
- **WHEN** the command runs against a database with no items
- **THEN** it creates the demo items and reports how many were created

### Requirement: Demo catalog content
The demo catalog SHALL contain between 20 and 30 real titles, with books and comics each making up at least 40% of them. Every item SHALL carry a synopsis of at least two sentences so retrieval has meaningful text to work with.

#### Scenario: Mixed kinds
- **WHEN** the demo catalog is loaded
- **THEN** both books and comics are present and every item has all required fields

### Requirement: Demo covers
Each demo item SHOULD reference a cover image stored with the web application, and the cover files SHALL be committed to the repository so no external service is needed at run time. A title without a downloaded cover SHALL be seeded without one.

#### Scenario: Covers available offline
- **WHEN** the demo catalog is loaded and the web application is served
- **THEN** every demo item that has a cover shows it without any request to a third-party host

#### Scenario: Title without cover
- **WHEN** no cover file exists for a demo title
- **THEN** the item is created without a cover and the load does not fail

### Requirement: Idempotent re-runs
Running the command repeatedly SHALL never create duplicate items. Items that already exist SHALL be updated to the demo values and items that are new SHALL be created. Items not part of the demo data SHALL be left untouched.

#### Scenario: Second run without changes
- **WHEN** the command runs again with unchanged demo data
- **THEN** the item count stays the same and the report shows no new items

#### Scenario: Edited and added titles
- **WHEN** the demo data has one edited title and one new title and the command runs again
- **THEN** the edited item is updated, the new item is created and no other item is duplicated

#### Scenario: Items created by an administrator
- **WHEN** the command runs on a catalog that also contains items created through the application
- **THEN** those items are not modified or removed

### Requirement: Seed does not alter users
The demo load SHALL NOT create, modify or delete user accounts.

#### Scenario: Users unchanged
- **WHEN** the command runs
- **THEN** the set of users is identical before and after
