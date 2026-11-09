## MODIFIED Requirements

### Requirement: Demo catalog content
The demo catalog SHALL contain between 20 and 60 real titles, with books and comics each making up at least 40% of them. Every item SHALL carry a synopsis of at least two sentences so retrieval has meaningful text to work with.

#### Scenario: Mixed kinds
- **WHEN** the demo catalog is loaded
- **THEN** both books and comics are present and every item has all required fields

## ADDED Requirements

### Requirement: Demo series with numbered entries
The demo catalog SHALL include at least five series that each have three or more entries with consecutive `issueNumber` values, so reading-order features can be demonstrated.

#### Scenario: Series available for reading order
- **WHEN** the demo catalog is loaded
- **THEN** at least five series each contain three or more numbered entries
