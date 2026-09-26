# PortMate product specification

**Status:** Human-approved product and architecture baseline, 2026-09-27.

## Product

PortMate is a mobile-first web application and PWA that helps people travelling or working aboard cruise ships discover real-world meeting opportunities. A user adds ship assignments; PortMate derives relevant port calls and finds overlaps with PortMate connections.

PortMate is not a general social network. It has no chat, feed, posts, stories, followers, likes, continuous GPS tracking, crew-status requirement, or WhatsApp authentication.

## Architecture

- `mobile/`: Gemini-owned responsive PWA frontend.
- `server/`: GPT-owned TypeScript/Fastify application, PostgreSQL persistence, background processing and API.
- PostgreSQL is the only required data service. Docker Compose runs the application and database as one deployable PortMate system.
- `/contracts` contains versioned OpenAPI and JSON Schema boundary contracts. GPT owns compatible backend-side contract changes; Gemini consumes them.
- A production cruise-data provider is optional configuration. The application must use a provider abstraction and deterministic development data without prohibited scraping.

## Core domain

Accounts use verified email/password or Google authentication. Usernames are mandatory; profile picture and other profile details are optional. Last activity is privacy-conscious and coarsely represented.

Users may have current and future ship assignments containing company, ship, start date and end date. Assignment creation metadata supports analysis of how far ahead future assignments were entered.

A connection is created immediately through a deliberate QR scan or a shareable, scoped link. Users can remove connections or block users; all connection and block checks are server-enforced.

Itineraries come from assignment intervals and cached provider port calls. Current relevant location is itinerary-derived at port/city level.

An overlap has positive temporal intersection when `max(start) < min(end)`. Same-port overlaps need any positive intersection. Nearby-port overlaps also require distance within the user's configurable threshold (default 50 km). Same-ship assignment overlaps are a stronger state and suppress redundant ordinary meeting opportunities.

Persistent overlap state records participants, ports, coordinates, interval, lifecycle, intent and notification delivery state. Pokes are allowed only for future overlaps. A recipient can record Interested or Not Interested; the latter stops meeting reminders.

Email is the MVP outbound transport. In-app notification state is persisted. Overlap reminders are idempotent, retry-safe, duplicate-resistant and stop on expiry or Not Interested.

## Security and delivery

Use secure password hashing, verified email, safe sessions/tokens, authorization and ownership checks, rate limiting where appropriate, input validation, CSRF protection where applicable, secure QR/share tokens, secret-safe logging and dependency scanning. Never commit credentials.

The repository must ultimately support:

```sh
cp .env.example .env
docker compose up -d --build
```

Production hosting, DNS, TLS, cloud accounts and production secrets are outside repository automation.

## Completion

`[CLIENT_COMPLETE] PortMate release gate passed` is allowed only after the complete PWA/backend system, real contracts, tests, Docker validation and documentation pass the final system audit.
