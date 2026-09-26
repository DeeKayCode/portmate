# PortMate

Itinerary tracking and social connectivity mobile platform designed for cruise ship crew members and maritime workers.

---

## 🚢 Overview

PortMate enables cruise crew members to track their port itineraries, discover when friends on other vessels share port stops, and connect in real time during port calls.

The development of PortMate is organized around an **autonomous multi-agent ping-pong workflow**:
- **Mobile Frontend (UI/UX)**: Built autonomously by **Gemini / Antigravity** (`gemini-worker`).
- **Mobile Application/Data Layer**: Built autonomously by **Codex / GPT** (`gpt-worker`).
- **Server Implementation**: Built on a dedicated branch by **ÓE GenAI** (`server-worker`).

---

## 🌿 Branching Model

| Branch | Purpose | Owners |
|---|---|---|
| `main` | Stable integration and release baseline | Human-reviewed releases only |
| `client` | Shared mobile client development (ping-pong loop) | `gemini-worker` + `gpt-worker` |
| `server` | Independent backend server implementation | `server-worker` (ÓE GenAI) |

*Note: All components communicate exclusively via versioned contracts defined in `/contracts`.*

---

## 🤖 Commit Protocol & Automation Loop

Client development proceeds via event-driven GitHub Actions workflows reacting to explicit commit markers:

- `[GEMINI] <description>`: Handoff commit from Gemini; triggers GPT worker to implement data/app layer.
- `[GPT] <description>`: Handoff commit from GPT; triggers Gemini worker to advance frontend implementation.
- `[GEMINI_COMPLETE] Frontend implementation complete`: Signals frontend completion; triggers comprehensive GPT release audit.
- `[CLIENT_COMPLETE] Client release gate passed`: Terminal commit when the mobile client passes all tests and Definition of Done.

Bot maintenance and bootstrap commits (e.g. `chore: ...`) do not trigger the ping-pong loop.

---

## 📁 Repository Structure

```text
portmate/
├── SPEC.md                           # Product & feature specification
├── AGENTS.md                         # Multi-agent governance and ownership boundaries
├── README.md                         # Project overview and developer guide
├── contracts/                        # Frozen API & schema contracts (single source of truth)
│   ├── README.md
│   ├── openapi.yaml
│   ├── models.schema.json
│   └── events.schema.json
├── prompts/                          # Worker role instructions
│   ├── gemini-worker.md
│   ├── gpt-worker.md
│   └── server-worker.md
├── mobile/                           # Mobile client codebase
├── server/                           # Server codebase
├── automation/                       # Runner scripts, locks, and handshake tests
│   ├── README.md
│   ├── scripts/
│   │   ├── invoke-gemini-worker.ps1
│   │   ├── invoke-gpt-worker.ps1
│   │   └── validate-worker-environment.ps1
│   ├── handshake/
│   └── state/
└── .github/
    └── workflows/
        ├── trigger-gemini.yml
        ├── trigger-gpt.yml
        └── ci.yml
```

---

## 🛠️ Workstation Setup & Verification

To validate your local worker environment, run:

```powershell
pwsh -File ./automation/scripts/validate-worker-environment.ps1 -Role gemini
# or for GPT:
pwsh -File ./automation/scripts/validate-worker-environment.ps1 -Role gpt
```

See [the automation runbook](automation/README.md) for runner registration, the disabled-by-default trigger switch, CLI adapter setup and recovery. Product work remains blocked pending approval. Release CI intentionally fails while contracts and specification are placeholders.
