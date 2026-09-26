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
Write-Host "PortMate Automation: Gemini Worker Invocation"
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
$lockFile = Join-Path $lockDir "gemini.lock"
$lockStream = $null

try {
    try {
        $lockStream = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    }
    catch {
        Write-Error "Could not acquire lock on '$lockFile'. Another Gemini worker process is likely running."
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
        Write-Host "Release gate passed ([CLIENT_COMPLETE]). No further Gemini action required."
        exit 0
    }

    # 6. Handshake State Machine Handling (Bootstrap Test)
    $handshakeFile = Join-Path $RepoPath "automation\handshake\state.json"
    if (Test-Path $handshakeFile) {
        try {
            $handshake = Get-Content -Raw $handshakeFile | ConvertFrom-Json
            if ($handshake.phase -eq "GPT_OK" -or $triggerMsg -like "*[GPT] automation handshake*") {
                Write-Host "Recognized GPT handshake completion! Finalizing handshake to COMPLETE..."
                $handshake.phase = "COMPLETE"
                $handshake.updatedAt = (Get-Date).ToUniversalTime().ToString("o")
                $handshake.history += [PSCustomObject]@{
                    phase = "COMPLETE"
                    actor = "gemini-worker"
                    timestamp = (Get-Date).ToUniversalTime().ToString("o")
                    message = "Gemini verified GPT handshake. Handshake successfully completed."
                }
                $handshake | ConvertTo-Json -Depth 5 | Set-Content -Path $handshakeFile -Encoding utf8
                git add automation/handshake/state.json
                git commit -m "chore: automation handshake complete"
                git push origin client
                Write-Host "Handshake test successfully concluded and pushed. Stopping loop."
                exit 0
            }
        }
        catch {
            Write-Warning "Could not parse handshake state file: $_"
        }
    }

    # 7. Locate Antigravity CLI
    $agyCmd = Get-Command agy.exe -ErrorAction SilentlyContinue
    $agyBin = if ($agyCmd) { $agyCmd.Source } else { $null }
    if (-not $agyBin) {
        $candidatePaths = @(
            "C:\Users\deeka\AppData\Local\agy\bin\agy.exe",
            "C:\Users\deeka\.gemini\bin\agy.exe"
        )
        foreach ($p in $candidatePaths) {
            if (Test-Path $p) {
                $agyBin = $p
                break
            }
        }
    }

    if (-not $agyBin) {
        Write-Error "Antigravity CLI (agy.exe) not found on this workstation."
        exit 1
    }

    Write-Host "Using Antigravity CLI at: $agyBin"

    # 8. Load Prompt and Execute
    $promptFile = Join-Path $RepoPath "prompts\gemini-worker.md"
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

Perform the required mobile frontend increment now. Remember:
1. Do not modify contracts/.
2. Run local tests/linters.
3. Commit with [GEMINI] <description> or [GEMINI_COMPLETE] Frontend implementation complete.
"@

    Write-Host "Invoking Antigravity agent headlessly..."
    & $agyBin -p "$instruction" --dangerously-skip-permissions

    # 9. Post-Execution Verification
    # Check contracts immutability
    $contractsDiff = git diff origin/client -- contracts/
    if ($contractsDiff) {
        Write-Error "CRITICAL VIOLATION: The agent modified contracts/. Reverting changes and aborting."
        git checkout -- contracts/
        exit 1
    }

    # Check commit produced
    $newHeadSha = (git rev-parse HEAD).Trim()
    $originHeadSha = (git rev-parse origin/client).Trim()

    if ($newHeadSha -eq $originHeadSha) {
        Write-Warning "No new commit was created by the Gemini worker."
        # If there are unstaged changes, fail
        $statusAfter = git status --porcelain
        if ($statusAfter) {
            Write-Error "Uncommitted changes left in working tree:`n$statusAfter"
            exit 1
        }
        exit 0
    }

    $newCommitMsg = (git log -1 --format=%s HEAD).Trim()
    Write-Host "New Commit Message: $newCommitMsg"

    if (-not ($newCommitMsg.StartsWith("[GEMINI]") -or $newCommitMsg.StartsWith("[GEMINI_COMPLETE]"))) {
        Write-Error "Produced commit does not have the mandatory [GEMINI] or [GEMINI_COMPLETE] prefix: '$newCommitMsg'"
        exit 1
    }

    # 10. Push Results
    Write-Host "Pushing client branch to origin..."
    git push origin client
    Write-Host "Gemini worker completed successfully."
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
