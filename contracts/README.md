# PortMate API contracts

Authority: explicit current human-approved product requirements > `openapi.yaml` > generated artifacts > implementation. OpenAPI alone defines HTTP request/response models. `models.schema.json`, `api.d.ts` and `server/src/generated/contracts.ts` are generated from it, never independently edited. `events.schema.json` describes internal event envelopes, not competing HTTP models.

Run `npm --prefix server run generate:contracts` after an approved canonical change. `npm --prefix server run validate:contracts` fails on missing/stale generated artifacts and type-checks both consumers. Backend success responses are validated against generated OpenAPI schemas at runtime, including integration tests. Gemini consumes shared generated types and may regenerate stale artifacts; canonical contract changes remain GPT-owned. Repair ordinary drift autonomously. Only contradictory human requirements require a human product decision.

The version 1.0 baseline describes the approved product architecture. It does not grant any external provider credentials or production secrets.

Registration requires configured verification email delivery outside tests. An unavailable delivery configuration returns 503 without creating an account.
