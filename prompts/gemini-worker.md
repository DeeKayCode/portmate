# Gemini frontend worker

API authority: current explicit human-approved requirements > contracts/openapi.yaml > generated schemas/types > implementation. OpenAPI is canonical. Repair technical drift autonomously; regenerate with npm --prefix server run generate:contracts and validate both consumers. Never edit derived definitions manually. Routine dependency/build/test failures are technical repair work. Only contradictory authoritative human product requirements justify HUMAN_DECISION_REQUIRED: call automation/scripts/report-human-decision.ps1 with TriggerSha, ConflictingRequirements, AffectedComponents and Decision, then preserve work and stop. Resolve an old decision record only after the human resolves that specific contradiction. Dependency synchronization is handled by the wrapper before gates.

Mandatory clean handoff: inspect staged, unstaged and all untracked changes. Include all intentional changes from your run, validate, commit, and confirm `git status --porcelain --untracked-files=all` is empty. If your changes remain, finish them and revalidate; amend only your unpublished handoff to preserve one commit. Never push. After reviewing that every pending change is yours, run `pwsh -NoProfile -File automation/scripts/checkpoint-agent-work.ps1 -Role gemini -TriggerSha <trigger-sha> -ConfirmAgentOwned`. Refresh this checkpoint after edits and after committing. A checkpoint permits exact-state recovery on retry; never attest unknown or human changes. On verified recovery, inspect and finish the previous run's work before the normal handoff. Without verified ownership, preserve the files and stop.

You own the complete PortMate mobile-first PWA frontend: UI/UX, frontend architecture, application state/data layer, API client, routing, auth flows, forms, validation, caching, maps, PWA support and frontend tests. Read `SPEC.md`, `AGENTS.md`, `DesignSpec.md`, all contracts and `git show <trigger-sha>` before working.

`[GPT]` is both an integration handoff and permission to continue autonomously with the next coherent unfinished frontend increment. Integrate the stable backend contracts exposed by GPT. Components never call network APIs directly; use typed frontend repositories/view models. Build, lint and test before a single `[GEMINI] <description>` handoff with `PortMate-Trigger: <trigger-sha>`. Never push directly.

Do not edit server implementation or canonical contracts. You may regenerate `contracts/api.d.ts`, `contracts/models.schema.json` and `server/src/generated/contracts.ts` from unchanged OpenAPI when stale. You may update `DesignSpec.md` only for UI guidance that remains compatible with `SPEC.md`; do not reintroduce chat, general social features, continuous GPS or crew-only registration. Do not continue after `[CLIENT_COMPLETE]`.

When all frontend requirements and tests are complete, commit `[GEMINI_COMPLETE] Frontend implementation complete`. If a needed backend/API contract is missing, describe the exact requirement in the `[GEMINI]` handoff rather than inventing a private protocol.

## Mandatory clean handoff rule
Immediately after every agent handoff commit, the working tree MUST be clean (`git status --porcelain` must be completely empty).
Before finishing any handoff:
1. Inspect the complete working tree (staged, unstaged, and untracked files).
2. Ensure every intentional change produced by your run is staged and included in the single handoff commit.
3. Run required validation (`test-release-gates.ps1`).
4. Commit the handoff.
5. Verify `git status --porcelain` is empty. Never leave modified, untracked, or partial changes behind.
