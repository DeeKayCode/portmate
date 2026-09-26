# PortMate – Multi-Agent Collaboration Governance

This document establishes the ground rules, boundaries, and communication protocol for all autonomous and semi-autonomous AI agents operating within `DeeKayCode/portmate`.

---

## 1. Source of Truth Hierarchy

When resolving requirements, architectural decisions, or discrepancies, agents must follow this strict priority order:

1. **`/contracts`** – Frozen, versioned schemas and API specifications. (Highest priority)
2. **`SPEC.md`** – Approved product and architectural specification.
3. **`AGENTS.md`** – This governance and ownership guideline.
4. **Existing implementation** – Current repository code on the relevant branch.

> [!CAUTION]
> If any conflict or ambiguity is detected between these sources, the agent **MUST STOP and report the conflict**. Never guess, invent schemas, or create proprietary protocol extensions.

---

## 2. Worker Ownership Boundaries

### Gemini (`gemini-worker`)
- **Domain**: Mobile frontend, user interface (UI), and user experience (UX).
- **Branch**: `client`
- **Workstation**: Dönci's Windows workstation.
- **Trigger**: Pushes to `client` with commit prefix `[GPT]`.
- **Handoff marker**: `[GEMINI] <description>` or `[GEMINI_COMPLETE] Frontend implementation complete`.
- **Responsibilities**:
  - Implement and refine views, components, navigation flows, and styling.
  - Bind to state and data interfaces provided by `gpt-worker`.
  - Maintain UI/component tests.
  - Never modify `/contracts` or implement server code.

### GPT (`gpt-worker`)
- **Domain**: Mobile application logic, data layer, state management, and client-side persistence.
- **Branch**: `client`
- **Workstation**: Adam's Windows workstation.
- **Trigger**: Pushes to `client` with commit prefix `[GEMINI]` or `[GEMINI_COMPLETE]`.
- **Handoff marker**: `[GPT] <description>` or `[CLIENT_COMPLETE] Client release gate passed`.
- **Responsibilities**:
  - Implement application state, API clients, authentication token handling, and local storage.
  - Implement client-side business logic, synchronization, and event handlers.
  - Maintain data layer and integration unit tests.
  - Conduct full audit and release validation upon receiving `[GEMINI_COMPLETE]`.
  - Never redesign Gemini's UI unless fixing a functional integration defect.
  - Never modify `/contracts` or implement server code.

### ÓE GenAI (`server-worker`)
- **Domain**: Server-side implementation, persistence, and external service adapters.
- **Branch**: `server`
- **Deployment**: Debian-based LXC with Docker Compose.
- **Responsibilities**:
  - Implement REST/WebSocket APIs conforming exactly to `/contracts`.
  - Database schema, migrations, background workers, and scheduling.
  - Authentication verification, health checks, and logging.
  - Maintain server-side automated test suites.
  - Never modify `/contracts` without explicit human sign-off.

---

## 3. Strict Prohibitions (Forbidden Without Explicit Human Approval)

No agent may autonomously:
1. **Modify `/contracts`** under any circumstance.
2. **Alter the fundamental architecture** or branch model.
3. **Introduce paid third-party infrastructure** or external paid SaaS dependencies.
4. **Commit secrets**, API tokens, private keys, passwords, or credentials.
5. **Disable or bypass security checks**, linters, or test gates.
6. **Delete or corrupt existing user data** or database tables without verified migration scripts.
7. **Force-push** (`git push --force` or `--force-with-lease`) to shared branches (`main`, `client`, `server`).
8. **Rewrite Git history** (rebase or reset published commits).
9. **Merge into `main`** (merges to `main` are reserved for human release review).

---

## 4. Engineering Quality Standards

Every agent must:
- **Inspect existing code first** before proposing or writing modifications.
- **Implement functioning code** rather than returning instructions or descriptions.
- **Test all modifications** locally using relevant test runners before committing.
- **Repair any regression or build failure** introduced by its modifications.
- **Produce coherent, atomic commits** with standard prefix tags.
- **Preserve buildability**: Always leave the repository in a clean, buildable state.

## 5. Bootstrap execution boundary

Product development requires final human-approved SPEC/contracts and explicit authorization to start. During automated client implementation, only mobile files may change; automation, workflows, prompts, SPEC and governance remain protected. The wrapper validates and pushes; agents must not push themselves. Every outgoing worker commit includes `PortMate-Trigger: <trigger-sha>` in its body. Maintenance commits never use handoff markers. A completion marker requires actual release gates and passing CI.
