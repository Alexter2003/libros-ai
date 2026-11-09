# Spec Delta

## Purpose

Documents every endpoint of the API in a public Swagger page so that the API can be explored and tested without reading the code.

## ADDED Requirements

### Requirement: Complete Swagger documentation

The system SHALL serve at `/docs` an OpenAPI document that lists every endpoint with a summary, grouped by tag, with request and response shapes, and that declares both the bearer token and the `X-API-Key` security schemes. Endpoints that accept an API key SHALL be marked with that scheme.

#### Scenario: Every route documented
- **WHEN** the OpenAPI document is generated
- **THEN** every controller route appears with a summary and a tag

#### Scenario: Security schemes
- **WHEN** a person opens `/docs`
- **THEN** they can authorize with a bearer token or an API key and call report endpoints from the page
