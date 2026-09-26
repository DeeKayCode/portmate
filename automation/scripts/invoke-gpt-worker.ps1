[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$TriggerSha,

    [Parameter(Mandatory = $false)]
    [string]$RepoPath = (Resolve-Path "$PSScriptRoot\..\..").Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "=========================================="
Write-Host "PortMate Automation: GPT Worker Invocation"
Write-Host "Trigger SHA: $TriggerSha"
Write-Host "Repository : $RepoPath"
Write-Host "=========================================="

# 1. Ensure PATH has required tools
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$env:PATH = "$userPath;$machinePath;$env:PATH"

# 2. Acquire Local Lock
$lockDir = Join-Path $RepoPath "automation\state"
if (-not (Test-Path $lockDir)) {
    New-Item -ItemType Directory -Path $lockDir -Force | Out-Null
}
$lockFile = Join-Path $lockDir "gpt.lock"
$lockStream = $null

try {
    try {
        $lockStream = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    }
    catch {
        Write-Error "Could not acquire lock on '$lockFile'. Another GPT worker process is currently running."
        exit 1
    }

    Set-Location -Path $RepoPath

    # 3. Cleanliness Check
    $status = git status --porcelain
    if ($status) {
        Write-Error "Repository working tree is not clean. Uncommitted changes found:`n$status"
        exit 1
    }

    # 4. Synchronize Client Branch
    git fetch origin client
    $currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
    if ($currentBranch -ne 'client') {
        git checkout client
    }
    git merge --ff-only origin/client

    # 5. Verify Triggering Commit
    try {
        git rev-parse --verify "$TriggerSha^{commit}" | Out-Null
    }
    catch {
        Write-Error "Trigger SHA '$TriggerSha' does not exist in repository history."
        exit 1
    }

    $triggerMsg = (git log -1 --format=%s $TriggerSha).Trim()
    Write-Host "Trigger Commit Message: $triggerMsg"

    # Stop conditions
    if ($triggerMsg -like "*[CLIENT_COMPLETE]*") {
        Write-Host "Release gate already passed. No action needed."
        exit 0
    }

    # 6. Handshake State Machine Handling (Bootstrap Test)
    $handshakeFile = Join-Path $RepoPath "automation\handshake\state.json"
    if (Test-Path $handshakeFile) {
        try {
            $handshake = Get-Content -Raw $handshakeFile | ConvertFrom-Json
            if ($handshake.phase -eq "GEMINI_OK" -or $triggerMsg -like "*[GEMINI] automation handshake*") {
                Write-Host "Recognized Gemini handshake! Advancing handshake state to GPT_OK..."
                $handshake.phase = "GPT_OK"
                $handshake.updatedAt = (Get-Date).ToUniversalTime().ToString("o")
                $handshake.history += [PSCustomObject]@{
                    phase = "GPT_OK"
                    actor = "gpt-worker"
                    timestamp = (Get-Date).ToUniversalTime().ToString("o")
                    message = "GPT received Gemini handshake. Advancing to GPT_OK."
                }
                $handshake | ConvertTo-Json -Depth 5 | Set-Content -Path $handshakeFile -Encoding utf8
                git add automation/handshake/state.json
                git commit -m "[GPT] automation handshake: phase GPT_OK"
                git push origin client
                Write-Host "Handshake phase GPT_OK committed and pushed to client branch."
                exit 0
            }
        }
        catch {
            Write-Warning "Could not parse handshake state file: $_"
        }
    }

    # 7. Locate Codex / GPT CLI
    $cCmd = Get-Command codex -ErrorAction SilentlyContinue
    $codexCmd = if ($cCmd) { $cCmd.Source } else { $null }
    if (-not $codexCmd) {
        $oCmd = Get-Command openai -ErrorAction SilentlyContinue
        $codexCmd = if ($oCmd) { $oCmd.Source } else { $null }
    }

    # 8. Load Prompt and Execute
    $promptFile = Join-Path $RepoPath "prompts\gpt-worker.md"
    if (-not (Test-Path $promptFile)) {
        Write-Error "Prompt file '$promptFile' not found."
        exit 1
    }

    $promptContent = Get-Content -Raw $promptFile -Encoding utf8
    $diffSummary = git show --stat $TriggerSha

    $instruction = @"
$promptContent

---
### RUNTIME INVOCATION CONTEXT
- Target Branch: client
- Trigger Commit SHA: $TriggerSha
- Trigger Commit Message: $triggerMsg
- Diff Summary:
$diffSummary

Perform the required mobile application/data layer implementation now. Remember:
1. Do not modify contracts/.
2. Run local tests/linters.
3. Commit with [GPT] <description> or [CLIENT_COMPLETE] Client release gate passed.
"@

    Write-Host "Invoking Codex / GPT agent..."
    if ($codexCmd) {
        & $codexCmd exec --prompt "$instruction"
    }
    else {
        # Fallback runner hook if custom script runner is configured on Adam's machine
        $customRunner = Join-Path $RepoPath "automation\scripts\run-codex-local.ps1"
        if (Test-Path $customRunner) {
            & pwsh -File $customRunner -Instruction $instruction
        }
        else {
            Write-Error "Codex CLI not found in PATH on this workstation. Please install codex or create automation/scripts/run-codex-local.ps1."
            exit 1
        }
    }

    # 9. Post-Execution Verification
    $contractsDiff = git diff origin/client -- contracts/
    if ($contractsDiff) {
        Write-Error "CRITICAL VIOLATION: The agent modified contracts/. Reverting changes and aborting."
        git checkout -- contracts/
        exit 1
    }

    $newHeadSha = (git rev-parse HEAD).Trim()
    $originHeadSha = (git rev-parse origin/client).Trim()

    if ($newHeadSha -eq $originHeadSha) {
        Write-Warning "No new commit was created by the GPT worker."
        $statusAfter = git status --porcelain
        if ($statusAfter) {
            Write-Error "Uncommitted changes left in working tree:`n$statusAfter"
            exit 1
        }
        exit 0
    }

    $newCommitMsg = (git log -1 --format=%s HEAD).Trim()
    Write-Host "New Commit Message: $newCommitMsg"

    if (-not ($newCommitMsg.StartsWith("[GPT]") -or $newCommitMsg.StartsWith("[CLIENT_COMPLETE]"))) {
        Write-Error "Produced commit does not have the mandatory [GPT] or [CLIENT_COMPLETE] prefix: '$newCommitMsg'"
        exit 1
    }

    # 10. Push Results
    Write-Host "Pushing client branch to origin..."
    git push origin client
    Write-Host "GPT worker completed successfully."
}
finally {
    if ($lockStream) {
        $lockStream.Close()
        $lockStream.Dispose()
    }
    if (Test-Path $lockFile) {
        Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
    }
}
