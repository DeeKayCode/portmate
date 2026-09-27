# PortMate collaboration governance

## Source of truth

For API behavior/models the authority order is: explicit current human-approved product requirements, `contracts/openapi.yaml`, generated schemas/types, implementation. `SPEC.md` records product requirements; `DesignSpec.md` is Gemini-owned UI guidance subordinate to them. OpenAPI is the sole canonical HTTP contract. Repair stale generated artifacts and implementation drift autonomously; they are not human decisions.

Only contradictory authoritative human product requirements require `HUMAN_DECISION_REQUIRED`: identify the conflicting requirements, affected files and smallest needed decision; preserve all work. Use `automation/scripts/report-human-decision.ps1` with the active trigger for distinguishable workflow output. Technical failures (dependencies, generation, lint, build, tests) must be diagnosed and repaired.

## Ownership

- **Gemini** owns the complete frontend PWA: UI/UX, frontend architecture, client state/data, navigation, forms, caching, maps and frontend tests.
- **GPT** owns the complete backend and final system integration: API, PostgreSQL, migrations, backend/domain logic, authentication, authorization, provider abstraction, notifications, Docker readiness, backend/integration tests and release audit.
- There is no active server-worker/ÓE agent.

Both active workers use `client`. `main` remains human-reviewed stable integration; `server` is retained only as a historical branch and is not an active workstream.

## Contracts

`/contracts` is the shared API boundary. Gemini consumes canonical OpenAPI and may regenerate derived artifacts, but must not change OpenAPI. GPT may make compatible contract changes for the active handoff and records them in `contracts/CHANGELOG.md`. Run `npm --prefix server run generate:contracts`; never manually maintain competing API schemas. Breaking product changes require human approval.

## Prohibitions

No worker may commit secrets, force-push, rewrite published history, merge to `main`, disable security checks, deploy externally, access production accounts, or implement prohibited social/GPS features. Do not bypass system security controls.

## Workflow

The triggering commit SHA and marker decide turns: `[GEMINI]` invokes GPT; `[GPT]` invokes Gemini; `[GEMINI_COMPLETE]` invokes GPT's final audit; `[CLIENT_COMPLETE]` stops both. Bootstrap and maintenance commits never use worker markers.

On a normal handoff, work only on the required dependency chain. GPT may edit `server/`, `/contracts`, backend documentation and Docker/release configuration; Gemini may edit `mobile/` and `DesignSpec.md`. Each worker tests, repairs its own failures and creates one coherent handoff commit with `PortMate-Trigger: <trigger-sha>`. The wrapper pushes it.

Explicit human-requested maintenance may reconcile governance, generation and automation outside normal worker path ownership. Commit that maintenance with a non-triggering `chore:` subject. Keep any subsequent product repair handoff distinct, with the audit findings and remaining work. Normal automated workers still obey the single-child and role-specific path checks.

## Mandatory clean handoff and recovery

Inspect staged, unstaged and all untracked files. Review and stage every intentional change from this run, validate, create the handoff, and verify `git status --porcelain --untracked-files=all` is empty. A marker alone does not complete a handoff. Never push directly; the wrapper checks cleanliness again after validation and immediately before pushing.

After inspecting and attributing all pending changes to this run, save an explicit recovery checkpoint with `automation/scripts/checkpoint-agent-work.ps1 -Role <role> -TriggerSha <sha> -ConfirmAgentOwned`. Refresh it after intentional edits and after committing. This records a fingerprint in Git metadata, not application files. Never attest unknown changes. An interrupted run may resume only when the event, HEAD, index, tracked diffs and untracked file contents exactly match that checkpoint. Reinspect and validate recovered work; keep one handoff commit, amending only an unpublished commit belonging to this same run when necessary. Unknown changes or changes since the checkpoint are preserved and stop automatic recovery. Do not delete, reset, overwrite, stash or blindly commit them.
