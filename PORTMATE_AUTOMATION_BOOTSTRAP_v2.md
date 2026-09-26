# PortMate – Autonomous Agent Workflow Bootstrap

> **Target repository:** `DeeKayCode/portmate`
>
> **Purpose:** Prepare this workstation and the PortMate repository for an event-driven development workflow in which:
>
> - **Gemini / Antigravity** owns the mobile frontend.
> - **Codex / GPT** owns the mobile application/data/backend layer.
> - **ÓE GenAI** will later own the server-side implementation on a separate branch.
> - Gemini and GPT work in an automatic GitHub-driven ping-pong loop.
> - The client and server communicate only through frozen, versioned contracts.
>
> This document is an **execution instruction for the coding agent**, not merely documentation. Perform the applicable steps autonomously. Do not stop after explaining what should be done.

> **Known repository state:** The GitHub repository already exists at `DeeKayCode/portmate`, uses `main` as its default branch, and is currently at the initial/empty stage. Repository creation is NOT part of this task.

---

## 0. Safety and operating rules

1. Work only with `DeeKayCode/portmate`.
2. Never delete or overwrite existing project work without inspecting it first.
3. Never commit secrets, tokens, passwords, OAuth credentials, runner registration tokens, or `.env` contents.
4. Do not weaken GitHub security settings to make automation easier.
5. Do not modify an existing application implementation unless required for the automation bootstrap.
6. Prefer idempotent scripts: running setup twice must not corrupt the repository or duplicate configuration.
7. Before every destructive or irreversible operation, stop and ask the human.
8. Authentication steps that require browser/account interaction must be presented to the human and resumed after authentication.
9. If GitHub CLI (`gh`) is available and authenticated, use it where appropriate. Otherwise use normal `git` operations and clearly identify the one-time manual GitHub UI steps.
10. Do not start autonomous PortMate product development yet. This task prepares and validates the automation only.

---

# 1. Determine your worker role

Determine which agent is executing this document.

## If you are Codex / GPT

Your role is:

`gpt-worker`

You own the **mobile application/data layer**, not visual frontend design.

Your future automated executions will react only to Gemini handoff commits.

Expected local environment: Adam's Windows workstation.

## If you are Gemini / Antigravity

Your role is:

`gemini-worker`

You own the **mobile frontend/UI/UX**.

Your future automated executions will react only to GPT handoff commits.

Expected local environment: Dönci's workstation.

## If role cannot be determined reliably

Ask exactly one question:

> Should I configure this workstation as `gpt-worker` or `gemini-worker`?

Then continue automatically.

---

# 2. Verify prerequisites

Check for:

- Git
- GitHub connectivity
- repository access to `DeeKayCode/portmate`
- PowerShell 7+ if Windows
- GitHub CLI (`gh`) if available
- the current agent's command-line/headless execution capability

For GPT worker, verify that Codex can execute non-interactively from a script.

For Gemini worker, verify that Antigravity/Gemini can execute non-interactively from a script.

Do **not** invent command-line flags. Inspect the installed CLI's `--help` output and use the supported non-interactive invocation.

If the relevant CLI is missing, install it only if installation is straightforward and does not require elevated or account-sensitive actions. Otherwise give the human the exact required installation/authentication step and resume afterwards.

---

# 3. Use the existing PortMate repository

The repository already exists:

```text
https://github.com/DeeKayCode/portmate
```

Clone URL:

```text
https://github.com/DeeKayCode/portmate.git
```

Default branch:

```text
main
```

The repository is currently an initial/empty repository. **Do not create a new repository.**

If a local working copy already exists, use it after verifying:

```text
git remote -v
```

`origin` must resolve to:

```text
https://github.com/DeeKayCode/portmate.git
```

or the equivalent authenticated SSH remote for the same repository.

If no working copy exists:

```text
git clone https://github.com/DeeKayCode/portmate.git
cd portmate
```

Fetch all branches and synchronize `main` before making bootstrap changes.

Do not replace the repository, reinitialize it, or change ownership/visibility.

---

# 4. Establish repository structure

On the default branch, ensure the repository can ultimately contain:

```text
portmate/
├── SPEC.md
├── AGENTS.md
├── README.md
│
├── contracts/
│   ├── README.md
│   ├── openapi.yaml
│   ├── models.schema.json
│   └── events.schema.json
│
├── prompts/
│   ├── gemini-worker.md
│   ├── gpt-worker.md
│   └── server-worker.md
│
├── mobile/
├── server/
│
├── automation/
│   ├── README.md
│   ├── state/
│   │   └── .gitkeep
│   └── scripts/
│       ├── invoke-gpt-worker.ps1
│       ├── invoke-gemini-worker.ps1
│       └── validate-worker-environment.ps1
│
└── .github/
    └── workflows/
        ├── trigger-gpt.yml
        ├── trigger-gemini.yml
        └── ci.yml
```

Do not create fake product contracts. If the real PortMate product specification/contracts have not yet been authored, create clearly marked **bootstrap placeholders** that fail validation rather than silently becoming an accidental specification.

`contracts/README.md` must state:

> The contracts directory is the single source of truth for communication between PortMate components. Worker agents MUST NOT modify contracts during implementation. Contract changes require explicit human approval.

---

# 5. Branch model

The existing default branch is `main`.

Ensure these additional long-lived branches exist:

```text
main     # existing default branch
client   # Gemini + GPT shared client development
server   # ÓE GenAI server development
```

Rules:

- `main` = release/stable integration state.
- `client` = shared working branch for Gemini + GPT.
- `server` = ÓE GenAI server implementation.
- Gemini and GPT both operate on `client`.
- ÓE GenAI operates on `server`.
- `/contracts` originates from the approved baseline and must remain consistent across both.

Do not create separate long-lived `frontend` and `backend` branches.

Do not change the repository's default branch away from `main`.

---

# 6. Commit protocol

The client automation uses explicit machine-readable commit markers.

Gemini-generated handoff:

```text
[GEMINI] <description>
```

GPT-generated handoff:

```text
[GPT] <description>
```

Frontend completion candidate:

```text
[GEMINI_COMPLETE] Frontend implementation complete
```

Client completion:

```text
[CLIENT_COMPLETE] Client release gate passed
```

Do not use commit author identity as the primary trigger mechanism.

Prevent loops:

- `[GEMINI]` triggers only GPT.
- `[GPT]` triggers only Gemini.
- `[GEMINI_COMPLETE]` triggers a final GPT audit.
- `[CLIENT_COMPLETE]` triggers neither worker.
- Bot/automation maintenance commits must not trigger either worker.

---

# 7. Worker state

The agents must process only changes they have not already handled.

Do **not** rely on an untracked local text file as the only state.

Use Git commit ancestry and the triggering GitHub event SHA as the primary handoff boundary.

Each worker invocation receives:

- triggering commit SHA
- triggering commit message
- repository path
- target branch (`client`)

The worker prompt must instruct the agent to inspect:

```text
git show <trigger-sha>
```

and, where necessary, relevant preceding commits.

The agent must understand the complete current repository, but the triggering commit defines the new handoff.

---

# 8. GPT worker prompt

Create `prompts/gpt-worker.md`.

It must instruct GPT to:

1. Read `SPEC.md`.
2. Read `AGENTS.md`.
3. Read all approved `/contracts`.
4. Inspect the Gemini triggering commit and current `client` state.
5. Implement the application/data layer necessary to make Gemini's new frontend functional.
6. Own:
   - application logic
   - state management
   - API client
   - authentication integration
   - local persistence
   - synchronization
   - push/event processing
   - client-side validation
   - error handling
   - application-layer tests
7. Not redesign Gemini's UI unless required to fix a functional integration defect.
8. Never modify `/contracts`.
9. Never implement server internals.
10. Build/test/lint before committing.
11. Fix failures caused by its changes.
12. Commit successful handoff as `[GPT] ...`.
13. If triggered by `[GEMINI_COMPLETE]`, perform a full client audit against the Definition of Done rather than only implementing the latest diff.
14. If the full client passes the release gate, commit `[CLIENT_COMPLETE] Client release gate passed`.
15. If it cannot proceed because the contract/spec is inconsistent, fail clearly rather than inventing a protocol.

The prompt must explicitly tell GPT that it is running autonomously and should not ask routine implementation questions whose answers are already defined by the repository.

---

# 9. Gemini worker prompt

Create `prompts/gemini-worker.md`.

It must instruct Gemini to:

1. Read `SPEC.md`.
2. Read `AGENTS.md`.
3. Read all approved `/contracts`.
4. Inspect the GPT triggering commit and current `client` state.
5. Own the complete mobile frontend/UI/UX.
6. Integrate the application interfaces exposed by GPT.
7. Continue implementing the next unfinished frontend requirements from `SPEC.md`.
8. Work in coherent increments rather than attempting an unsafe giant rewrite.
9. Build/test/lint before committing.
10. Never modify `/contracts`.
11. Never implement server internals.
12. Commit each handoff as `[GEMINI] ...`.
13. When all frontend requirements and frontend tests are complete, commit `[GEMINI_COMPLETE] Frontend implementation complete`.
14. Do not continue after `[CLIENT_COMPLETE]`.
15. If blocked by a contract/spec contradiction, fail clearly rather than inventing a protocol.

The prompt must explicitly tell Gemini that a `[GPT]` commit is both an integration handoff and permission to continue autonomously with the next unfinished frontend portion.

---

# 10. Server worker prompt

Create `prompts/server-worker.md` for later use by ÓE GenAI.

It must define the server ownership boundary:

- Work only on the server implementation.
- Strictly implement `/contracts`.
- Do not depend on Gemini/GPT implementation details.
- Target deployment: clean Debian-based LXC.
- The server must be deployable from GitHub with minimal host preparation.
- Prefer containerized deployment using Docker Compose unless the product specification later explicitly chooses another deployment model.
- Required deployment goal:

```text
git clone <repository>
cd portmate/server
cp .env.example .env
# human fills required secrets/config
docker compose up -d
```

After that, application-specific manual setup should not be required.

Require:

- database and migrations
- API
- background worker/scheduler where needed
- cruise-data ingestion abstraction
- overlap calculation
- persistent events
- notification delivery abstraction
- authentication/authorization enforcement
- validation
- health checks
- structured logging
- restart policy
- persistent volumes
- `.env.example`
- no secrets in Git
- automated tests
- backup/restore documentation
- deployment/update/rollback documentation

Do not implement actual product details that are not yet present in `SPEC.md` or `/contracts`.

---

# 11. Local GPT invocation script

Create:

`automation/scripts/invoke-gpt-worker.ps1`

Requirements:

1. Accept triggering SHA and repository path as parameters/environment variables.
2. Acquire a local lock so two GPT jobs cannot edit the same checkout concurrently.
3. Verify the triggering commit exists.
4. Verify branch is `client`.
5. Cleanly synchronize with `origin/client`.
6. Refuse to continue if there are unrelated uncommitted human changes.
7. Load `prompts/gpt-worker.md`.
8. Add the triggering SHA/message to the runtime instruction.
9. Invoke the locally installed Codex non-interactively using the CLI syntax actually supported on this workstation.
10. Allow Codex to edit the repository and run tests.
11. After Codex returns, verify:
    - working tree state
    - expected commit marker if a commit was produced
    - no `/contracts` modification
    - no secrets were obviously added
12. Push only the resulting expected `client` commit(s).
13. Return non-zero on failure so GitHub Actions records the job as failed.
14. Always release the local lock.

Do not hardcode credentials.

---

# 12. Local Gemini invocation script

Create:

`automation/scripts/invoke-gemini-worker.ps1`

Use the same protections as the GPT worker:

- triggering SHA input
- lock
- clean repository check
- sync `origin/client`
- prompt loading
- actual supported Antigravity/Gemini headless invocation
- test/build opportunity
- contract modification guard
- expected `[GEMINI]` or `[GEMINI_COMPLETE]` commit
- push
- proper exit codes
- lock cleanup

Do not guess Antigravity CLI flags; discover them locally.

---

# 13. GitHub Actions – Gemini → GPT

Create `.github/workflows/trigger-gpt.yml`.

It must:

- run on pushes to `client`
- inspect the head commit message
- run only when it begins with `[GEMINI]` or `[GEMINI_COMPLETE]`
- target the self-hosted runner labels assigned to Adam's GPT workstation
- pass `github.sha` to `invoke-gpt-worker.ps1`
- use concurrency protection so only one GPT client job runs at a time
- have a sensible timeout
- require the minimum GitHub permissions necessary
- never run on `[GPT]` or `[CLIENT_COMPLETE]`

Prefer checking out/synchronizing in the worker script if that avoids conflicts with a persistent self-hosted working directory.

---

# 14. GitHub Actions – GPT → Gemini

Create `.github/workflows/trigger-gemini.yml`.

It must:

- run on pushes to `client`
- run only when the head commit begins with `[GPT]`
- target Dönci's Gemini self-hosted runner
- pass `github.sha`
- use concurrency protection
- have a sensible timeout
- use minimum permissions
- never run on `[GEMINI]`, `[GEMINI_COMPLETE]`, or `[CLIENT_COMPLETE]`

---

# 15. CI workflow

Create `.github/workflows/ci.yml`.

Initially it must safely detect which project components actually exist.

Eventually it must provide release gates for:

- contract/schema validation
- mobile dependency install
- lint
- type checking
- unit tests
- mobile build validation
- server tests
- server container build
- secret scanning if available without introducing sensitive external dependencies
- dependency/security checks appropriate to the selected stack

Do not fabricate commands for a stack that has not yet been selected. Until the stack exists, make the workflow explicitly report skipped/not-yet-configured checks rather than falsely passing nonexistent tests.

`[CLIENT_COMPLETE]` must not be considered a release by itself; CI must also pass.

---

# 16. GitHub self-hosted runner preparation

This agent should prepare everything it can locally, but runner registration requires a short-lived GitHub registration token.

If this workstation is not already a registered self-hosted runner:

1. Determine OS and architecture.
2. Prepare a dedicated runner directory outside the repository.
3. If authenticated `gh` access can securely obtain/setup the runner using supported GitHub mechanisms, do so without exposing tokens.
4. Otherwise stop at the registration step and tell the human exactly where to go:

```text
DeeKayCode/portmate
Settings
→ Actions
→ Runners
→ New self-hosted runner
```

Then use the GitHub-provided current commands.

Required custom label:

For GPT workstation:

```text
gpt-worker
```

For Gemini workstation:

```text
gemini-worker
```

Configure the runner as a background service where supported.

Never commit runner tokens or configuration.

---

# 17. Environment validation script

Create:

`automation/scripts/validate-worker-environment.ps1`

It should verify and clearly report:

- Git available
- correct repository remote
- GitHub connectivity
- current branch
- PowerShell version
- relevant AI CLI installed
- relevant AI CLI authentication appears usable
- self-hosted runner installation/service status if discoverable
- required prompt file exists
- contracts directory exists
- no obvious secrets are tracked
- working tree cleanliness

Exit non-zero when the workstation is not ready.

---

# 18. AGENTS.md

Create or extend `AGENTS.md` with shared rules:

## Source of truth

Priority:

1. `/contracts`
2. `SPEC.md`
3. `AGENTS.md`
4. existing implementation

If these conflict, stop and report the conflict.

## Ownership

Gemini:
- frontend/UI/UX

GPT:
- mobile application/data/backend layer

ÓE GenAI:
- server-side backend

## Forbidden without human approval

- changing `/contracts`
- changing the fundamental architecture
- adding paid third-party infrastructure
- committing secrets
- disabling security checks
- deleting user data
- force-pushing shared branches
- rewriting Git history
- merging to `main`

## Quality

Every agent must:
- inspect existing code first
- implement rather than merely describe
- test its work
- repair failures caused by its work
- keep commits coherent
- leave the repository in a buildable state whenever practical

---

# 19. Bootstrap ping-pong test

Do not use real PortMate features for the first automation test.

Create a harmless bootstrap test mechanism that can be removed afterwards.

Goal:

```text
Gemini worker
    ↓
[GEMINI] automation handshake
    ↓
GitHub
    ↓
GPT workstation wakes automatically
    ↓
[GPT] automation handshake
    ↓
GitHub
    ↓
Gemini workstation wakes automatically
    ↓
Gemini recognizes successful handshake
    ↓
STOP
```

The handshake MUST have an explicit stop condition so it cannot loop indefinitely.

For example, use a temporary file under:

`automation/handshake/`

with a state machine:

```text
START
GEMINI_OK
GPT_OK
COMPLETE
```

The handshake must not touch application code.

Do not start this test until **both self-hosted runners are registered and online**.

Ask the human for confirmation immediately before initiating the first cross-machine handshake.

---

# 20. Do not start product development

The automation preparation is complete only when:

- repository structure exists
- branch model exists
- worker prompts exist
- both local invocation scripts exist
- both GitHub workflows exist
- CI skeleton exists
- both runner environments validate
- both self-hosted runners are online
- Gemini → GPT trigger works
- GPT → Gemini trigger works
- handshake stops correctly
- no secrets are committed
- documentation explains how to start/stop/recover the automation

At that point report:

```text
PORTMATE AUTOMATION READY
```

Also report:

- runner status
- branch status
- workflow status
- handshake result
- any remaining human-only prerequisites

Do **not** begin implementing PortMate itself until the human explicitly supplies/approves the final `SPEC.md` and `/contracts` and says to start autonomous development.

---

# 21. Recovery / kill switch

Document a simple emergency stop before enabling the workflow.

At minimum, the human must be able to stop all autonomous work by either:

1. disabling the two trigger workflows in GitHub, or
2. stopping the self-hosted runner services.

Document both procedures in:

`automation/README.md`

Also document recovery after:

- failed agent invocation
- offline worker PC
- rejected push
- dirty working tree
- merge conflict
- CI failure
- agent process timeout

Never automatically force-reset or force-push to recover.

---

# 22. Execute now

After reading this entire document:

1. Identify your worker role.
2. Inspect the current repository and workstation.
3. Produce a short execution plan.
4. Perform every safe applicable setup step autonomously.
5. Commit automation/repository bootstrap changes using a normal non-triggering commit message such as:

```text
chore: bootstrap autonomous development workflow
```

6. Do not use `[GEMINI]` or `[GPT]` for bootstrap commits.
7. Configure/validate the local worker.
8. Stop only for genuinely required human authentication/runner-registration/approval.
9. Once resumed, continue until this workstation is ready for the cross-machine handshake.
