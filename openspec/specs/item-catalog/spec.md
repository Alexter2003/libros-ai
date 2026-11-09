# item-catalog Specification

## Purpose
Defines the catalog of books and comics stored by the application, who can read it and who can change it. It is the data the AI services will later retrieve from.

## Requirements

### Requirement: Catalog item model
The system SHALL store catalog items, each being either a book or a comic. An item SHALL have a title, an author, a kind (`BOOK` or `COMIC`), a genre, a publication year and a synopsis, and MAY have an ISBN, a cover URL, a series name and an issue number.

#### Scenario: Item returned with its fields
- **WHEN** a client reads an item
- **THEN** the response includes id, title, author, kind, genre, year, synopsis, the optional fields when present, and creation and update dates

### Requirement: Authenticated catalog reading
Reading the catalog SHALL require authentication and SHALL be allowed for both `ADMIN` and `USER` roles.

#### Scenario: Anonymous request
- **WHEN** a request without a valid token lists or reads items
- **THEN** the API responds with an unauthorized status

#### Scenario: Regular user reads
- **WHEN** a user with the USER role lists or reads items
- **THEN** the API returns the data

### Requirement: Paginated list with search and filter
The list endpoint SHALL return items in pages and SHALL support filtering by kind and a case-insensitive text search over title, author and series. Results SHALL be ordered by title and the response SHALL include the total count.

#### Scenario: Default page
- **WHEN** a client lists items without parameters
- **THEN** the API returns the first page with a default page size and the total number of items

#### Scenario: Filter by kind
- **WHEN** a client lists items with kind `COMIC`
- **THEN** every returned item is a comic and the total counts only comics

#### Scenario: Text search
- **WHEN** a client searches for a fragment of a title, author or series in any letter case
- **THEN** the API returns only items whose title, author or series contains that fragment

#### Scenario: Page size limit
- **WHEN** a client requests a page size above the maximum allowed
- **THEN** the API responds with a validation error

### Requirement: Read one item
Any authenticated user SHALL be able to read one item by id.

#### Scenario: Existing item
- **WHEN** a client requests an existing item id
- **THEN** the API returns the item

#### Scenario: Unknown id
- **WHEN** a client requests an id that does not exist
- **THEN** the API responds with a not found status

#### Scenario: Malformed id
- **WHEN** a client requests an id that is not a valid UUID
- **THEN** the API responds with a validation error

### Requirement: Administrator-only writes
Creating, updating and deleting items SHALL be restricted to administrators.

#### Scenario: Regular user attempts a write
- **WHEN** a user with the USER role creates, updates or deletes an item
- **THEN** the API responds with a forbidden status and changes nothing

### Requirement: Create item
An administrator SHALL be able to create an item. Title, author, kind, genre, year and synopsis SHALL be required. A series name and an issue number SHALL be accepted only for comics. An ISBN, when provided, SHALL be unique. A cover URL, when provided, SHALL be an http(s) URL or a site-relative path.

#### Scenario: Successful creation
- **WHEN** an administrator submits a valid item
- **THEN** the API stores it and responds with the created item

#### Scenario: Missing or invalid fields
- **WHEN** an administrator omits a required field, sends an unknown kind or a year outside a plausible range
- **THEN** the API responds with a validation error naming each invalid field

#### Scenario: Comic-only fields on a book
- **WHEN** an administrator submits a book with an issue number
- **THEN** the API responds with a validation error

#### Scenario: Invalid cover URL
- **WHEN** an administrator submits a cover value that is neither an http(s) URL nor a site-relative path
- **THEN** the API responds with a validation error

#### Scenario: Duplicate ISBN
- **WHEN** an administrator submits an ISBN that already belongs to another item
- **THEN** the API responds with a conflict status and creates nothing

### Requirement: Update item
An administrator SHALL be able to change any field of an existing item, applying the same validation rules as creation to the resulting item.

#### Scenario: Successful update
- **WHEN** an administrator submits valid changes for an existing item
- **THEN** the API stores them and responds with the updated item

#### Scenario: Update unknown item
- **WHEN** an administrator updates an id that does not exist
- **THEN** the API responds with a not found status

#### Scenario: Update breaks a rule
- **WHEN** an administrator changes an item to a book while it still carries an issue number
- **THEN** the API responds with a validation error and keeps the stored item unchanged

### Requirement: Delete item
An administrator SHALL be able to delete an item.

#### Scenario: Successful deletion
- **WHEN** an administrator deletes an existing item
- **THEN** the API removes it and later reads of that id respond with a not found status

#### Scenario: Delete unknown item
- **WHEN** an administrator deletes an id that does not exist
- **THEN** the API responds with a not found status

### Requirement: Documented catalog endpoints
All catalog endpoints SHALL appear in the public API documentation under their own group, marked as requiring bearer authentication.

#### Scenario: Swagger shows the catalog
- **WHEN** a visitor opens the API documentation
- **THEN** the catalog endpoints are listed with their parameters, responses and the bearer authorization requirement

### Requirement: Embedding refresh on write

Creating an item or updating any of its title, author, kind, genre, year, series or synopsis SHALL refresh that item's embedding. If the embedding provider fails, the write SHALL still succeed and the item SHALL be left without embedding so a later reindex picks it up.

#### Scenario: Create refreshes embedding
- **WHEN** an administrator creates an item and the provider is available
- **THEN** the item has an embedding after the request

#### Scenario: Update of embedded fields
- **WHEN** an administrator changes the synopsis of an item
- **THEN** its embedding is regenerated

#### Scenario: Update of other fields
- **WHEN** an administrator changes only the cover or ISBN of an item
- **THEN** the embedding is not regenerated

#### Scenario: Provider failure does not fail the write
- **GIVEN** the embedding provider is unavailable
- **WHEN** an administrator creates or updates an item
- **THEN** the item is saved, the response is successful and the item has no embedding
