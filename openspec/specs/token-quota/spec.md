# token-quota Specification

## Purpose
Defines per-user token limits, how every completed model call is recorded, and how the system refuses calls once a user has consumed their limit.

## Requirements

### Requirement: Per-user token limit
Each user SHALL have a token limit, expressed as a total number of tokens (input plus output). A user without a limit SHALL be treated as unlimited. Administrators SHALL be able to set or clear the limit of any user.

#### Scenario: Administrator sets a limit
- **WHEN** an administrator sets a token limit for a user
- **THEN** the limit is stored and returned with the user's profile

#### Scenario: Invalid limit
- **WHEN** an administrator sets a negative token limit
- **THEN** the API responds with a validation error and keeps the previous value

### Requirement: Usage recording
The system SHALL record one usage event for every model call that completes, with the user, the service, the input tokens and the output tokens reported by the model, and the time of the call.

#### Scenario: Successful call is recorded
- **WHEN** a model call completes successfully
- **THEN** exactly one usage event is stored with the token counts reported by the model

#### Scenario: Failed call is not recorded
- **WHEN** a model call fails before the model returns usage
- **THEN** no usage event is stored

### Requirement: Quota check before each call
Before every model call, the system SHALL compute the total tokens the user has consumed and SHALL refuse the call when that total has reached the user's token limit.

#### Scenario: Call within the limit
- **WHEN** a user whose consumption is below the limit makes a call
- **THEN** the call proceeds

#### Scenario: Call at the limit
- **WHEN** a user whose consumption has reached the limit makes a call
- **THEN** the API responds with a too-many-requests status, the body states the limit was reached, and no model call is made

#### Scenario: Unlimited user
- **WHEN** a user without a token limit makes a call
- **THEN** the call proceeds regardless of consumption

### Requirement: Limits apply to administrators as well
The quota check SHALL apply to every user, including administrators, when they have a limit set.

#### Scenario: Administrator with a limit
- **WHEN** an administrator with a token limit reaches it and makes a call
- **THEN** the call is refused in the same way as for any other user
