# PortMate architecture baseline

PortMate is one deployable PWA/backend system. Gemini owns the PWA in \`mobile/\`; GPT owns the TypeScript/Fastify backend in \`server/\`. PostgreSQL is the source of persistent state.

The Fastify server implements identity, profiles/settings, assignments, itinerary caching, connections, blocks, overlaps, meeting intent and persistent notifications. PostgreSQL owns durable state. A background timer creates idempotent upcoming-overlap notifications and delivers queued email when SMTP is configured.

External cruise data is accessed only through `CruiseDataProvider`. Development and tests use deterministic fixtures until a compliant licensed production provider is configured. Authentication uses short-lived bearer tokens, bcrypt password hashes, one-time hashed verification/connection tokens, throttled public endpoints and ownership checks.

No production account, provider credential, hosting configuration or DNS/TLS configuration is stored in this repository.
