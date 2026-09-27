# PortMate collaboration governance

## Source of truth

Priority: approved `/contracts`, `SPEC.md`, this file, then implementation. `DesignSpec.md` is Gemini-owned UI guidance and must conform to the approved product scope. If two approved sources conflict, stop and report the conflict.

## Ownership

- **Gemini** owns the complete frontend PWA: UI/UX, frontend architecture, client state/data, navigation, forms, caching, maps and frontend tests.
- **GPT** owns the complete backend and final system integration: API, PostgreSQL, migrations, backend/domain logic, authentication, authorization, provider abstraction, notifications, Docker readiness, backend/integration tests and release audit.
- There is no active server-worker/ÓE agent.

Both active workers use `client`. `main` remains human-reviewed stable integration; `server` is retained only as a historical branch and is not an active workstream.

## Contracts

`/contracts` is the shared API boundary. Gemini must never change it. GPT may make a compatible contract change only when required to support the active Gemini handoff; it must update the OpenAPI/JSON schema together with backend validation and record it in `contracts/CHANGELOG.md`. Breaking changes require human approval.

## Prohibitions

No worker may commit secrets, force-push, rewrite published history, merge to `main`, disable security checks, deploy externally, access production accounts, or implement prohibited social/GPS features. Do not bypass system security controls.

## Workflow

The triggering commit SHA and marker decide turns: `[GEMINI]` invokes GPT; `[GPT]` invokes Gemini; `[GEMINI_COMPLETE]` invokes GPT's final audit; `[CLIENT_COMPLETE]` stops both. Bootstrap and maintenance commits never use worker markers.

On a normal handoff, work only on the required dependency chain. GPT may edit `server/`, `/contracts`, backend documentation and Docker/release configuration; Gemini may edit `mobile/` and `DesignSpec.md`. Each worker tests, repairs its own failures and creates one coherent handoff commit with `PortMate-Trigger: <trigger-sha>`. The wrapper pushes it.

The current initialization is an exception: GPT may reconcile source-of-truth documents, contracts and automation gates, then must commit a non-triggering `chore:` commit and wait for Gemini's first real product handoff.

## Mandatory clean handoff and recovery

Inspect staged, unstaged and all untracked files. Review and stage every intentional change from this run, validate, create the handoff, and verify `git status --porcelain --untracked-files=all` is empty. A marker alone does not complete a handoff. Never push directly; the wrapper checks cleanliness again after validation and immediately before pushing.

After inspecting and attributing all pending changes to this run, save an explicit recovery checkpoint with `automation/scripts/checkpoint-agent-work.ps1 -Role <role> -TriggerSha <sha> -ConfirmAgentOwned`. Refresh it after intentional edits and after committing. This records a fingerprint in Git metadata, not application files. Never attest unknown changes. An interrupted run may resume only when the event, HEAD, index, tracked diffs and untracked file contents exactly match that checkpoint. Reinspect and validate recovered work; keep one handoff commit, amending only an unpublished commit belonging to this same run when necessary. Unknown changes or changes since the checkpoint are preserved and stop automatic recovery. Do not delete, reset, overwrite, stash or blindly commit them.
