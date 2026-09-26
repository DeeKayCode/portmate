# PortMate – Multi-Agent Collaboration Governance (AGENTS.md)

This document establishes the ground rules, boundaries, and communication protocol for the two autonomous AI agents operating within `DeeKayCode/portmate`.

---

## 1. Source of Truth Hierarchy

When resolving requirements, architectural decisions, or discrepancies, agents must follow this strict priority order:

1. **`/contracts`** – Frozen, versioned schemas and API specifications. (Highest priority)
2. **`SPEC.md`** – Approved product and architectural specification.
3. **`DesignSpec.md`** – Approved UI/UX and design specification.
4. **`AGENTS.md`** – This governance and ownership guideline.
5. **Existing implementation** – Current repository code on the `client` branch.

> [!CAUTION]
> If any conflict or ambiguity is detected between these sources, the agent **MUST STOP and report the conflict**. Never guess, invent schemas, or create proprietary protocol extensions.

---

## 2. Worker Ownership Boundaries

### Gemini (`gemini-worker`)
- **Domain**: Complete mobile frontend / PWA, UI, UX, state, routing, and API client.
- **Branch**: `client`
- **Workstation**: Dönci's Windows workstation.
- **Trigger**: Pushes to `client` with commit prefix `[GPT]`.
- **Handoff marker**: `[GEMINI] <description>` or `[GEMINI_COMPLETE] Frontend implementation complete`.
- **Responsibilities**:
  - Implement and refine views, components, navigation flows, and styling in `/mobile`.
  - Frontend state management, client-side data layer, and API client.
  - Maintain mobile frontend unit and integration tests.
  - Never implement server backend internals or database queries.

### GPT (`gpt-worker`)
- **Domain**: Complete backend, REST API implementation, PostgreSQL database, and business logic.
- **Branch**: `client`
- **Workstation**: Adam's Windows workstation.
- **Trigger**: Pushes to `client` with commit prefix `[GEMINI]` or `[GEMINI_COMPLETE]`.
- **Handoff marker**: `[GPT] <description>` or `[CLIENT_COMPLETE] Client release gate passed`.
- **Responsibilities**:
  - Implement backend REST APIs in `/server` conforming strictly to `/contracts`.
  - Database schema, migrations, relational models, and connection pools in PostgreSQL.
  - Itinerary generation and geographical overlap calculation engine (`same-ship`, `same-port`, `nearby-port`).
  - Poke / Meeting Intent state machine and scheduled email notification dispatch.
  - Maintain server-side automated test suites and Docker configuration.
  - Conduct full audit and release validation upon receiving `[GEMINI_COMPLETE]`.
  - Never redesign Gemini's UI unless fixing a functional integration defect.

---

## 3. Strict Prohibitions (Forbidden Without Explicit Human Approval)

No agent may autonomously:
1. **Modify `/contracts`** without collaborative agreement.
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

---

## 5. Development Execution Boundary

Product development is actively authorized and governed by approved SPEC, contracts, and DesignSpec. During automated client implementation:
- Gemini modifies `/mobile`.
- GPT modifies `/server` (and functional integration touchpoints).
- Automation, workflows, prompts, and governance remain protected.

The wrapper validates and pushes; agents must not push themselves. Every outgoing worker commit includes `PortMate-Trigger: <trigger-sha>` in its body. Maintenance commits never use handoff markers. A completion marker requires actual release gates and passing CI.
