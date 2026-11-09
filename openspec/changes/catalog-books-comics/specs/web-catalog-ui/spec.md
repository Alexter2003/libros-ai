# Spec Delta

## Purpose

Defines the web screens for browsing the catalog, available to every signed-in user, and for managing it, available to administrators.

## ADDED Requirements

### Requirement: Catalog menu entry
The main menu SHALL offer a catalog entry to every authenticated user and a catalog management entry only to administrators.

#### Scenario: Regular user menu
- **WHEN** a user with the USER role opens the main menu
- **THEN** the catalog entry is shown and the management entry is not

#### Scenario: Administrator menu
- **WHEN** an administrator opens the main menu
- **THEN** both the catalog and the management entries are shown

### Requirement: Browse the catalog
The catalog screen SHALL list items in pages, with a text search box, a filter by kind (all, books, comics), and a view of one item's full details.

#### Scenario: Search and filter
- **WHEN** a user types a search text or changes the kind filter
- **THEN** the list updates to show only matching items and the page returns to the first one

#### Scenario: Navigate pages
- **WHEN** the catalog has more items than one page holds and the user moves to another page
- **THEN** the list shows that page and keeps the active search and filter

#### Scenario: Item detail
- **WHEN** a user selects an item
- **THEN** the screen shows its title, author, kind, genre, year, synopsis and the optional fields that exist

#### Scenario: No results
- **WHEN** the search matches no item
- **THEN** the screen shows an empty-state message instead of a blank list

### Requirement: Item covers
The catalog list and the item detail SHALL show the item's cover image. When an item has no cover, or its image fails to load, the screen SHALL show a generated placeholder with the item's title instead of a broken image.

#### Scenario: Item with cover
- **WHEN** an item has a cover that loads
- **THEN** the list and the detail show that image

#### Scenario: Item without cover
- **WHEN** an item has no cover
- **THEN** the list and the detail show the generated placeholder

#### Scenario: Broken cover
- **WHEN** an item's cover fails to load
- **THEN** the screen replaces it with the generated placeholder

### Requirement: Administrator catalog management
Administrators SHALL have a screen to create, edit and delete items, with the form showing validation errors returned by the API.

#### Scenario: Create item
- **WHEN** an administrator submits a valid new item
- **THEN** it appears in the list

#### Scenario: Edit item
- **WHEN** an administrator saves changes to an item
- **THEN** the list shows the updated values

#### Scenario: Delete requires confirmation
- **WHEN** an administrator chooses to delete an item
- **THEN** the screen asks for confirmation and removes the item only after it is given

#### Scenario: Invalid form
- **WHEN** the API rejects a submitted item
- **THEN** the form stays open and shows which fields are invalid

#### Scenario: Cover field
- **WHEN** an administrator fills the cover field with a URL
- **THEN** the saved item shows that image in the catalog

#### Scenario: Comic-only fields
- **WHEN** the selected kind in the form is book
- **THEN** the series and issue number fields are hidden

### Requirement: Management screen restricted to administrators
The management screen SHALL be reachable only by administrators.

#### Scenario: Regular user opens the management route
- **WHEN** a user with the USER role navigates directly to the management route
- **THEN** the app does not show the screen and sends the user away from it
