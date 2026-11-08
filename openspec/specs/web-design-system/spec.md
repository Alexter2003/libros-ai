# web-design-system Specification

## Purpose
Defines the shared visual language of the web app: a dark, low-chroma theme with a single accent colour, consistent typography, spacing and component shapes, documented in a design file that guides all later screens.

## Requirements

### Requirement: Design reference document in the repository
The repository SHALL contain a `DESIGN.md` at its root describing colours, typography, spacing, radii, surfaces and component rules, with valid colour values.

#### Scenario: Colour values are valid
- **WHEN** the colour tokens in `DESIGN.md` are read
- **THEN** every hex value has 3, 6 or 8 digits and no token is malformed

### Requirement: Dark theme by default
The web app SHALL render on a near-black canvas with elevated surfaces one luminance step above it, and SHALL NOT use drop shadows for elevation.

#### Scenario: Initial render
- **WHEN** the web app loads
- **THEN** the page background is the canvas colour and cards use the card surface colour

### Requirement: Single accent colour
The web app SHALL use one accent colour for functional highlights only and SHALL NOT use it as a large background fill.

#### Scenario: Accent usage
- **WHEN** a screen shows links, icons or chart series
- **THEN** they may use the accent colour while panels and page backgrounds remain neutral

### Requirement: Design tokens available to components
Colours, font families, spacing steps and radii SHALL be defined once as tokens and consumed by components instead of hard-coded values.

#### Scenario: Token change propagates
- **WHEN** a colour token value is changed
- **THEN** every component using that token reflects the change without further edits

### Requirement: Typography pairing
The web app SHALL use a proportional sans-serif for reading text and a monospace face for uppercase category labels.

#### Scenario: Section eyebrow
- **WHEN** a section label is rendered
- **THEN** it uses the monospace face, uppercase, with wide letter spacing

### Requirement: Base button and card primitives
The web app SHALL provide a filled primary button, a ghost secondary button and a card container following the design reference.

#### Scenario: Button pair
- **WHEN** a primary and a secondary action are shown together
- **THEN** the primary is a light-filled button and the secondary is a transparent button with a thin border
