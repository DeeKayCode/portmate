# PortMate – Contracts Directory

> The contracts directory is the single source of truth for communication between PortMate components. Worker agents MUST NOT modify contracts during implementation. Contract changes require explicit human approval.

## Overview
This directory houses all formal schemas and interface contracts governing the interactions between the mobile client and the backend server:

- `openapi.yaml`: REST API specification (OpenAPI 3.1) defining endpoints, parameters, request bodies, and responses.
- `models.schema.json`: JSON Schema definitions for domain entities (Users, Vessels, Itineraries, Ports, Overlaps, Meetups).
- `events.schema.json`: JSON Schema definitions for asynchronous event payloads (WebSockets / Push Notifications).

## Contract Immutability Rule
1. Agents (`gemini-worker`, `gpt-worker`, `server-worker`) must **never modify** files within this directory.
2. In the event of schema deficiencies, inconsistencies, or newly required endpoints, the agent must pause execution, document the proposed contract change, and submit it for human approval.
