# PortMate automation

Automation supports the approved PortMate PWA and backend baseline. Both workers use `client`: Gemini owns `mobile/`; GPT owns `server/`, compatible contracts and final integration. `main` remains reserved for human release review.

## Emergency stop

In GitHub → Actions → each of **Trigger GPT** and **Trigger Gemini** → … → Disable workflow. Cancel already queued/running jobs as well. Set repository variable `PORTMATE_AUTOMATION_ENABLED` to `false` to prevent new worker jobs. To stop the workstation, open Services and stop its **GitHub Actions Runner** service, or run `Stop-Service -Name <exact-name-from-runner-.service>` in an administrator PowerShell. Stop any surviving agent process after checking its PID; stopping a listener alone is not proof that its child has stopped. Disable both workstations for a complete stop.

## One-time workstation setup

1. Use a dedicated Windows x64 worker account and checkout. Install Git and PowerShell 7 on its PATH. Authenticate Git with access only to DeeKayCode/portmate using Git Credential Manager or a repository-scoped credential. Do not put credentials in remote URLs, files in this repository, or logs.
2. GPT: install Codex and run `codex login` as the service account. Verified installed syntax is `codex exec --sandbox workspace-write --cd <checkout> -` with the prompt on stdin. Perform a harmless read-only invocation before enabling automation.
3. Gemini: inspect the installed Antigravity/Gemini CLI `--help` on Dönci's machine. Create a local PowerShell adapter outside the repository accepting `-Prompt`, `-RepositoryPath` and `-ValidateOnly`. It must invoke the discovered headless command, validate installed CLI/authentication in validation mode, and return a nonzero exit on failure. Set `PORTMATE_GEMINI_ADAPTER` for the runner account. No flags were guessed on the GPT workstation.
4. Open [New self-hosted runner](https://github.com/DeeKayCode/portmate/settings/actions/runners/new), select Windows/x64, and use the current GitHub download/checksum/registration commands in a dedicated directory outside the repository, such as `C:\Users\Adam.DESKTOP-9CMLFIG\actions-runner-portmate`. Add custom label `gpt-worker` or `gemini-worker`. Registration tokens expire and must stay out of chat/Git/logs. Configure the Windows service using administrator PowerShell, under the account with the CLI login and Git credential. Restart after environment changes.
5. Clone this repository into a dedicated worker checkout and switch to `client`. Set `PORTMATE_RUNNER_DIRECTORY` to the runner directory. Set repository Actions variables `GPT_REPOSITORY_PATH` and `GEMINI_REPOSITORY_PATH` to their absolute checkout paths. Each checkout must contain the reviewed bootstrap scripts. Workflows call those scripts without destructive checkout/cleanup.
6. Configure repository-local Git identity on each checkout. Run `pwsh -NoProfile -File automation/scripts/validate-worker-environment.ps1 -Role gpt` (or gemini). Both validations must pass. Confirm both runners are online with their required labels in GitHub.
7. Keep `PORTMATE_AUTOMATION_ENABLED` unset/false until the handshake is approved. Keep runner labels repository-specific in runner access policy. Trigger workflows only run on client pushes, never pull requests.

Worker pushes deliberately use the account's Git credential, not `GITHUB_TOKEN`: GitHub suppresses new push workflow runs created by that token. Use a GitHub App installation credential or appropriately scoped personal credential if needed; never weaken branch/security settings. See [GitHub trigger rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## First handshake: explicit human approval required

Only after both runners validate and are online, request human confirmation immediately before initiation. Set `PORTMATE_AUTOMATION_ENABLED=true`. On Gemini's clean client checkout, fast-forward from origin/client. Change only `automation/handshake/state.json` from START to GEMINI_OK, commit `[GEMINI] automation handshake`, and push client. GPT deterministically changes it to GPT_OK and commits `[GPT] automation handshake`; Gemini changes it to COMPLETE and commits `chore: automation handshake complete`. That final commit triggers neither worker. No model or application code is needed. Inspect both Actions runs, commit ancestry and COMPLETE. Disable the variable again after this test pending product authorization. Re-running an old event is rejected as stale, not replayed.

## Implementation and release gates

The approved baseline uses `automation/gates/` for contract, backend and mobile checks. Contract validation parses OpenAPI and JSON Schema. The backend gate runs dependency install, type checking, linting, tests and build. The client gate runs after `mobile/package.json` is supplied by Gemini. `[CLIENT_COMPLETE]` requires all release gates and passing CI.

## Execution safeguards and recovery

Both wrappers require a clean client checkout, correct origin, full event SHA at origin/client HEAD, fast-forward ancestry, expected incoming marker and one outgoing commit with a trigger trailer. They share an OS file lock, protect every path outside mobile during product work, inspect commits for obvious secrets, and use normal pushes. This lightweight scan is not a complete secret scanner. No local untracked state controls handoff progress. Ancestry, event SHA and committed handshake state define progress. Never force-reset, force-push or automatically stash human changes.

- Agent failure: disable triggers, inspect preserved diff and logs; repair deliberately. No push occurs after a failed invocation.
- Offline PC: restore the service and review queued jobs. Stale jobs fail rather than processing an obsolete handoff. Resume from the latest valid event.
- Rejected push / remote advanced: preserve local commit, integrate manually, rerun tests, then push an expected marker only after review.
- Dirty checkout: recover only an exact agent-attested checkpoint for the active role and trigger. The checkpoint fingerprints HEAD, staging, tracked changes and all untracked file contents. Changed or unknown files stop recovery and are preserved. No automatic stash, reset, deletion or blind commit is permitted. See `AGENTS.md` for the checkpoint command.
- Merge conflict: stop; resolve manually and rerun gates. No automatic rebase or history rewrite.
- CI failure: inspect failed gate, fix its cause and revalidate; a completion marker is not a release.
- Timeout: Actions cancels after 45 minutes; check and stop surviving child processes before restarting. OS handles release the lock when the wrapper exits; never bypass a live lock. Review any leftover changes/commit before retry.
- Duplicate event: if origin advanced, the stale-SHA check rejects it. An unpublished handoff can resume through a matching checkpoint, then passes the same marker, ancestry, ownership, secret and validation gates before pushing.

Every handoff must include all intentional changes. The wrapper checks the complete worktree after the agent, after validation, immediately before push and after push. Validation-created changes block publication. A checkpoint is an explicit ownership attestation, not proof inferred from filenames, author names or a dirty checkout; interruption before an attested checkpoint still requires review. Ignored build output and external processes that ignore the worker lock are outside the tracked/untracked cleanliness guarantee. Checkpoints live in Git metadata and are cleared after successful publication.

## Current bootstrap status

The GPT runner, Actions configuration and the cross-machine handshake have been validated. The handshake state is `COMPLETE`. The next step is Gemini's first real `[GEMINI]` frontend handoff; GPT then performs its backend and final-integration work under `SPEC.md` and `/contracts`.
