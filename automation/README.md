# PortMate Automation Infrastructure & Runbook

This directory contains the operational tooling, scripts, runtime state guards, and documentation for the multi-agent autonomous development workflow.

---

## 🛑 1. Emergency Stop / Kill Switch

If the autonomous agent loop must be halted immediately, use either of the following methods:

### Method A: Disable GitHub Actions Workflows (Recommended)
1. Navigate to the GitHub repository:
   `https://github.com/DeeKayCode/portmate/actions`
2. Select **Trigger Gemini Worker** → click `...` → **Disable workflow**.
3. Select **Trigger GPT Worker** → click `...` → **Disable workflow**.
This immediately ceases any new runner dispatches on push events.

### Method B: Stop Local Self-Hosted Runner
On the runner workstation:
- **If running as Windows Service**:
  Open an administrative terminal and run:
  ```powershell
  Stop-Service actions.runner.*
  ```
- **If running in interactive terminal**:
  Press `Ctrl + C` in the runner terminal window.

---

## 🔄 2. Architecture & The Ping-Pong Loop

```text
       Gemini Worker (Dönci)                   GPT Worker (Adam)
    [Self-hosted: gemini-worker]           [Self-hosted: gpt-worker]
                 │                                     │
                 ▼                                     │
         git push [GEMINI] ...                         │
                 │                                     │
                 ▼                                     ▼
         trigger-gpt.yml  ────────────────►   Wakes & Implements
                                              Data Layer / Logic
                                                       │
                                                       ▼
                 ▲                            git push [GPT] ...
                 │                                     │
         Wakes & Implements   ◄────────────────  trigger-gemini.yml
         UI / Components
                 │
                 ▼
         (Repeats until completion)
```

- **Branch**: Both agents work on `client`.
- **Contracts**: Neither agent may touch `/contracts`.
- **Stop Conditions**:
  - `[CLIENT_COMPLETE]`: Signals all requirements and gates have passed; triggers neither worker.
  - Non-triggering commits (`chore: ...`): Processed without re-triggering the loop.

---

## 🛠️ 3. Failure Recovery Procedures

> [!WARNING]
> **NEVER force-push (`git push --force`) or hard-reset (`git reset --hard`) on shared branches.**

### Scenario A: Dirty Working Tree / Stuck Lock
If a worker script crashed or terminated prematurely:
1. Check `automation/state/gemini.lock` or `automation/state/gpt.lock`.
2. Delete the stale lock file once verified that no process is running:
   ```powershell
   Remove-Item ./automation/state/*.lock -Force
   ```
3. Inspect `git status`. Either commit genuine progress or clean untracked test debris.

### Scenario B: Offline Worker PC
If one workstation is offline when a handoff commit is pushed:
- GitHub Actions queues the job on the designated runner label.
- When the offline workstation comes back online and starts its runner, it will automatically consume the queued handoff job in chronological order.

### Scenario C: Rejected Push (Concurrent Update)
The workflow uses `concurrency: cancel-in-progress: false` to sequence runs. However, if a push is rejected:
1. Run `git fetch origin client`.
2. Inspect differences: `git log HEAD..origin/client --oneline`.
3. If fast-forwardable: `git merge --ff-only origin/client`.
4. If merge conflict exists, see Scenario D.

### Scenario D: Merge Conflict
If conflicting changes occurred:
1. Human or developer must review the conflict:
   ```powershell
   git status
   git diff
   ```
2. Resolve conflicts manually, adhering strictly to `/contracts`.
3. Commit with a standard message:
   ```text
   chore: resolve merge conflict between agent commits
   ```
4. Push to `origin/client`.

### Scenario E: CI Failure
If CI fails on `client`:
- Inspect the CI logs on GitHub Actions.
- Determine whether the failure originated in the UI layer (Gemini) or data layer (GPT).
- The responsible agent repairs the defect in the next handoff increment.

---

## 🧪 4. Bootstrap Handshake Ping-Pong Test

To verify cross-machine automation before product feature development:
1. Ensure both runners (`gemini-worker` and `gpt-worker`) are online in GitHub:
   `https://github.com/DeeKayCode/portmate/settings/actions/runners`
2. Run the environment validator:
   ```powershell
   pwsh -File ./automation/scripts/validate-worker-environment.ps1 -Role gemini-worker
   ```
3. On confirmation, Gemini initiates the handshake:
   - Sets `phase: "GEMINI_OK"` in `automation/handshake/state.json`.
   - Commits: `[GEMINI] automation handshake: phase GEMINI_OK`.
   - Pushes to `client`.
4. GitHub wakes GPT runner → GPT updates to `phase: "GPT_OK"` → commits `[GPT] automation handshake: phase GPT_OK`.
5. GitHub wakes Gemini runner → Gemini updates to `phase: "COMPLETE"` → commits `chore: automation handshake complete`.
6. Loop stops cleanly.
