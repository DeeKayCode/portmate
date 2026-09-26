# PortMate

PortMate is a mobile-first PWA that helps cruise travellers and workers discover when their ship itineraries overlap with people they know.

## Architecture

- `mobile/`: Gemini-owned PWA frontend.
- `server/`: GPT-owned TypeScript/Fastify backend.
- PostgreSQL: persistent application state.
- `contracts/`: versioned frontend/backend boundary.

PortMate supports verified email/password and Google authentication, profiles, ship assignments, itinerary-derived locations, secure QR/share connections, blocks, persistent overlaps, future-overlap meeting intent and email/in-app notifications. It does not include chat, feeds, posts, followers or continuous GPS tracking.

## Development workflow

Gemini owns frontend work; GPT owns backend and system integration. Both use the `client` branch and exchange explicit `[GEMINI]` / `[GPT]` handoffs. See [AGENTS.md](AGENTS.md), [SPEC.md](SPEC.md), [DesignSpec.md](DesignSpec.md), [contracts](contracts/README.md) and [automation](automation/README.md).

## Local backend

Requires Node.js 22+.

```sh
npm --prefix server ci
npm --prefix server run validate:contracts
npm --prefix server test
npm --prefix server run dev
```

## Docker baseline

```sh
cp .env.example .env
# Set a non-default POSTGRES_PASSWORD before any non-local deployment.
docker compose up -d --build
```

The current initialization exposes only the health endpoint. Domain modules, migrations and production credential-backed integrations are added through the Gemini ↔ GPT handoff workflow.
