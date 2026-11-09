# agent-tool-loop Specification

## Purpose
Lets an AI agent decide which catalog functions to call and use their results to continue until it can answer, with a bounded number of steps and with every model call subject to the service switch, the token limit and usage recording.

## Requirements

### Requirement: Model-driven tool calls

The system SHALL run each agent as a loop in which the model may request calls to the agent's tools and receives their results, until the model answers without requesting a tool or the step limit is reached. The tools available SHALL be defined by the system, and the model SHALL NOT be able to call anything else.

#### Scenario: Model uses a tool and answers
- **WHEN** the model requests a catalog search and then answers using the result
- **THEN** the agent executes the search, returns its result to the model and finishes with the model's answer

#### Scenario: Unknown tool
- **WHEN** the model requests a tool that does not exist
- **THEN** the model receives an error result for that request and the loop continues

### Requirement: Step limit

The loop SHALL perform at most 5 model calls per agent request. When the limit is reached without a final answer, the agent SHALL return a result built from the data the tools returned, using the deterministic fallback of that agent, instead of failing.

#### Scenario: Model never stops calling tools
- **WHEN** the model requests tools on every step
- **THEN** after the fifth model call the agent returns its fallback result with status 200

### Requirement: Tool errors do not abort the request

Tool inputs coming from the model SHALL be validated. An invalid input or a failure while running a tool SHALL be reported to the model as an error result for that call, and SHALL NOT abort the request.

#### Scenario: Invalid tool input
- **WHEN** the model calls a search tool with an empty or oversized query
- **THEN** the model receives an error result and may try again

### Requirement: Quota and service switch on every step

Every model call of the loop SHALL go through the gateway, which SHALL reject a disabled service with 422 and a user over the token limit with 429, and SHALL record the tokens of each call. When the limit is reached in the middle of a request, the request SHALL end with 429 and the calls already made SHALL remain recorded.

#### Scenario: Limit reached mid-run
- **GIVEN** a user whose limit is exhausted by the second model call
- **WHEN** the agent needs a third call
- **THEN** the response is 429 and the first two calls are recorded as usage

### Requirement: Catalog tools

The system SHALL provide tools to search the catalog by meaning (only items at or above the minimum similarity), read one item by identifier, find series matching a name, and list the volumes of a series. Tool results SHALL contain only catalog data and SHALL be presented to the model as data, not as instructions.

#### Scenario: Search finds nothing relevant
- **WHEN** the model searches for text that matches nothing in the catalog
- **THEN** the tool returns an empty list

#### Scenario: Read an unknown item
- **WHEN** the model asks for an item identifier that does not exist
- **THEN** the tool returns an error result
