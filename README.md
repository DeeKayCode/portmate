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
npm --prefix mobile ci
npm --prefix server run validate:contracts
npm --prefix server test
npm --prefix server run dev
```

Set `DATABASE_URL` and `JWT_SECRET` first. The server applies the idempotent SQL migration at startup. The deterministic cruise provider supplies development/test itinerary data; no external cruise account is required.

The frontend uses the API but still needs authentication, connection-link and session-isolation repairs. See `docs/release-audit.md`; the system has not passed the final release audit.

## Docker baseline

```sh
cp .env.example .env
# Set unique POSTGRES_PASSWORD and JWT_SECRET values.
docker compose up -d --build
```

Open `http://localhost:3000`. The web container serves the PWA and proxies `/api/` to the backend. Check backend health at `/api/v1/health`.

Optional integrations use `GOOGLE_CLIENT_ID` and `SMTP_URL`. Email/password registration requires SMTP and returns 503 before creating an account when SMTP is absent. Without SMTP, in-app notifications remain persistent but outbound email is not sent. Tests use a test-only verification header. Production cruise data requires a separately licensed provider adapter; the repository does not scrape third-party sites.

Stop or restart with `docker compose down` and `docker compose restart`. Update with `git pull && docker compose up -d --build`. Back up with `docker compose exec -T db pg_dump -U portmate portmate > portmate.sql`; restore into an empty database with `docker compose exec -T db psql -U portmate portmate < portmate.sql`. Keep `.env` and backups outside version control.
