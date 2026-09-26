# PortMate architecture baseline

PortMate is one deployable PWA/backend system. Gemini owns the PWA in \`mobile/\`; GPT owns the TypeScript/Fastify backend in \`server/\`. PostgreSQL is the source of persistent state.

The server is structured around domain modules to be added during Gemini handoffs: identity, profile, assignments, itinerary providers, connections, blocks, overlaps, meeting intent and notifications. External cruise data is accessed only through a provider interface. Development and tests use deterministic fixtures until a compliant production provider is configured.

No production account, provider credential, hosting configuration or DNS/TLS configuration is stored in this repository.
