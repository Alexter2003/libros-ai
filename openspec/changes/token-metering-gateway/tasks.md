# Tasks

## 1. AWS Bedrock access (manual, by the user)

- [x] 1.1 Enable access to Amazon Nova Lite in the Bedrock console for `us-east-2`.
  Manual check: the model shows "Access granted" in the Bedrock model access page.
  Captura de evidencia: screenshot of the model access page with Nova Lite granted.
- [x] 1.2 Create an IAM user with `bedrock:InvokeModel` on the Nova Lite model only, and generate an access key.
  Manual check: the policy simulator allows `bedrock:InvokeModel` on that model and denies other actions.
  Captura de evidencia: screenshot of the attached policy (without the key values).

## 2. Data model

- [x] 2.1 Add the `AiService` model (unique name, model id, provider, enabled flag, optional max output tokens and temperature) and the `UsageEvent` model (user, service name snapshot, input tokens, output tokens, created at).
  Manual check: `prisma migrate dev` applies cleanly on a fresh database.
- [x] 2.2 Add a nullable `tokenLimit` to `User`, with the migration in the same change.
  Manual check: an existing user shows `tokenLimit` as null after migrating.

## 3. AI service configuration

- [x] 3.1 Implement administrator CRUD for AI services, with enable and disable, using the existing role guard. Any authenticated user can list enabled services.
  Manual check: as ADMIN, create, disable and delete a service in Swagger; as USER, the create call returns forbidden and the list shows only enabled services.
  Captura de evidencia: Swagger responses for create and forbidden.
- [x] 3.2 Seed one default service (Nova Lite) through the same idempotent seed used by the catalog.
  Manual check: running the seed twice leaves one service row.

## 4. Token quota

- [x] 4.1 Add the administrator endpoint that sets or clears a user's `tokenLimit`, with validation of negative values.
  Manual check: set a limit for a test user in Swagger and see it on the user's profile.
  Captura de evidencia: Swagger response with the updated limit.
- [x] 4.2 Implement the quota check that sums the user's recorded tokens and refuses calls at or above the limit.
  Manual check: with a limit lower than the tokens already recorded, a call returns too many requests and creates no usage row.
  Captura de evidencia: the rejected response in Swagger.

## 5. Gateway and Bedrock

- [x] 5.1 Implement the Bedrock client with the Converse API and the environment configuration (region, model id, credentials), returning text and usage.
  Manual check: the API starts with the AWS variables set, and a Bedrock health probe from a local shell returns text.
- [x] 5.2 Implement the gateway endpoint that runs service check, quota check, invocation and usage recording, in that order.
  Manual check: from the web or Swagger, a generation with a valid prompt returns text and token counts, and one usage row appears in the database.
  Captura de evidencia: Swagger response with token counts and the usage row.
- [x] 5.3 Map model errors to a service unavailable response that exposes no provider details.
  Manual check: with a wrong region in a local environment, the response carries no credential or account data.

## 6. Automated tests (required areas only)

- [x] 6.1 Tests for AI service management: create, duplicate name, disable refuses calls, USER forbidden. Bedrock mocked.
- [x] 6.2 Tests for usage recording: one event per successful call, none on failure.
- [x] 6.3 Tests for the token calculation: the sum of input and output tokens, and the boundary at the limit.

## 7. Documentation and deployment

- [x] 7.1 Document the AWS variables in `.env.example` and in the README, with the required IAM policy.
  Manual check: a new developer can follow the README and reach a successful generation with their own keys.
- [x] 7.2 Add the new endpoints to the README endpoint table and confirm they appear in `/docs`.
  Manual check: the production Swagger page lists the new endpoints.
- [ ] 7.3 Set the AWS variables on the server `.env` with `deploy:deploy` ownership and mode 600, then deploy and verify the generation endpoint in production.
  Manual check: a production generation with a test user returns text, and a second call with a limit of zero is refused.
  Captura de evidencia: production Swagger response and the refusal.
