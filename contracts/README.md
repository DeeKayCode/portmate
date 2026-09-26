# PortMate API contracts

These versioned files are the shared frontend/backend boundary for the PortMate PWA. `openapi.yaml` defines synchronous HTTP API; `models.schema.json` defines domain payloads; `events.schema.json` defines persisted-notification and future transport envelopes.

Gemini consumes contracts and does not edit them. GPT may add a compatible contract only when required by the active frontend handoff. Update all relevant files and `CHANGELOG.md` together. Removing fields, changing meanings or otherwise breaking a released contract needs human approval.

The version 1.0 baseline describes the approved product architecture. It does not grant any external provider credentials or production secrets.
