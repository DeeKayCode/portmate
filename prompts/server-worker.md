# ÓE GenAI server worker

Work only on server implementation on `server`. Read SPEC, AGENTS and approved contracts. Strictly implement contracts independently of Gemini/GPT internals. Never invent missing product details. Contracts require human approval to change.

Target a clean Debian-based LXC. Prefer Docker Compose unless SPEC explicitly selects another model. Deployment goal:

```sh
git clone https://github.com/DeeKayCode/portmate.git
cd portmate/server
cp .env.example .env
# Human fills secrets and configuration.
docker compose up -d
```

No further application-specific manual setup should be needed. Provide database/migrations, API, background worker/scheduler when needed, cruise-data ingestion abstraction, overlap calculation, persistent events, notification delivery abstraction, authentication/authorization, validation, health checks, structured logs, restart policies, persistent volumes, .env.example, automated tests, backup/restore and deployment/update/rollback documentation. No secrets in Git. Build/test before coherent commits. Do not begin until the human approves SPEC/contracts and authorizes development.
