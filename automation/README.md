# PortMate automation

Bootstrap only. Product work is blocked until approved SPEC/contracts, configured release gates, and explicit human authorization. `main` is stable; both client workers use `client`; server work uses `server`.

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

Once the human approves the final spec/contracts and explicitly authorizes development, configure `automation/gates.json` with approved=true and reviewed PowerShell gate files under `automation/gates/`. Contracts gate must validate OpenAPI and JSON Schema with the selected stack's actual validators. Client gate must install dependencies, lint, typecheck, run unit tests, validate a build and run appropriate dependency/security checks. Server gate must run server tests, a container build and appropriate security checks. Populate the Definition of Done in SPEC. Bootstrap placeholders deliberately fail release CI. Bootstrap syntax/security checks are separate from product release validation. `[CLIENT_COMPLETE]` requires the client gate and passing CI, not just a commit message.

## Execution safeguards and recovery

Both wrappers require a clean client checkout, correct origin, full event SHA at origin/client HEAD, fast-forward ancestry, expected incoming marker and one outgoing commit with a trigger trailer. They share an OS file lock, protect every path outside mobile during product work, inspect commits for obvious secrets, and use normal pushes. This lightweight scan is not a complete secret scanner. No local untracked state controls handoff progress. Ancestry, event SHA and committed handshake state define progress. Never force-reset, force-push or automatically stash human changes.

- Agent failure: disable triggers, inspect preserved diff and logs; repair deliberately. No push occurs after a failed invocation.
- Offline PC: restore the service and review queued jobs. Stale jobs fail rather than processing an obsolete handoff. Resume from the latest valid event.
- Rejected push / remote advanced: preserve local commit, integrate manually, rerun tests, then push an expected marker only after review.
- Dirty checkout: preserve/commit or move human work manually. Do not delete it to clear a job.
- Merge conflict: stop; resolve manually and rerun gates. No automatic rebase or history rewrite.
- CI failure: inspect failed gate, fix its cause and revalidate; a completion marker is not a release.
- Timeout: Actions cancels after 45 minutes; check and stop surviving child processes before restarting. OS handles release the lock when the wrapper exits; never bypass a live lock. Review any leftover changes/commit before retry.
- Duplicate event: if origin advanced, the stale-SHA check rejects it. If a process committed but failed before pushing, the ancestry check rejects its unpushed commit on retry; review and push/recover manually.

## Current bootstrap status

Runner registration, remote workflow enablement, Gemini CLI discovery and cross-machine handshake require workstation/account setup. Until all are verified, do not report PORTMATE AUTOMATION READY.

The concurrent remote bootstrap (`30f5e72`) and GPT bootstrap (`fe7a0e2`) were reconciled on client without rewriting either history. The remote SPEC and contracts are preserved byte-for-byte; their placeholder schemas are not approved contracts, and the release gate rejects them. The deterministic handshake uses the single `state` field (START → GEMINI_OK → GPT_OK → COMPLETE); follow this runbook instead of the earlier `phase` examples in the historical bootstrap document. Main/server retain their remote baseline until human-reviewed integration.
