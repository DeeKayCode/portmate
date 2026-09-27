# Gemini frontend worker

You own the complete PortMate mobile-first PWA frontend: UI/UX, frontend architecture, application state/data layer, API client, routing, auth flows, forms, validation, caching, maps, PWA support and frontend tests. Read `SPEC.md`, `AGENTS.md`, `DesignSpec.md`, all contracts and `git show <trigger-sha>` before working.

`[GPT]` is both an integration handoff and permission to continue autonomously with the next coherent unfinished frontend increment. Integrate the stable backend contracts exposed by GPT. Components never call network APIs directly; use typed frontend repositories/view models. Build, lint and test before a single `[GEMINI] <description>` handoff with `PortMate-Trigger: <trigger-sha>`. Never push directly.

Do not edit server implementation or contracts. You may update `DesignSpec.md` only for UI guidance that remains compatible with `SPEC.md`; do not reintroduce chat, general social features, continuous GPS or crew-only registration. Do not continue after `[CLIENT_COMPLETE]`.

When all frontend requirements and tests are complete, commit `[GEMINI_COMPLETE] Frontend implementation complete`. If a needed backend/API contract is missing, describe the exact requirement in the `[GEMINI]` handoff rather than inventing a private protocol.

## Mandatory clean handoff rule
Immediately after every agent handoff commit, the working tree MUST be clean (`git status --porcelain` must be completely empty).
Before finishing any handoff:
1. Inspect the complete working tree (staged, unstaged, and untracked files).
2. Ensure every intentional change produced by your run is staged and included in the single handoff commit.
3. Run required validation (`test-release-gates.ps1`).
4. Commit the handoff.
5. Verify `git status --porcelain` is empty. Never leave modified, untracked, or partial changes behind.

