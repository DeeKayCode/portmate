[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [ValidateSet("gemini-worker", "gpt-worker", "auto")]
    [string]$Role = "gemini-worker",

    [Parameter(Mandatory = $false)]
    [string]$RepoPath = (Resolve-Path "$PSScriptRoot\..\..").Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# Refresh PATH from registry
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$env:PATH = "$userPath;$machinePath;$env:PATH"

$allPassed = $true

function Report-Check {
    param(
        [string]$Name,
        [bool]$Success,
        [string]$Details = ""
    )
    if ($Success) {
        Write-Host " [PASS] $Name" -ForegroundColor Green
        if ($Details) { Write-Host "        $Details" -ForegroundColor DarkGray }
    }
    else {
        Write-Host " [FAIL] $Name" -ForegroundColor Red
        if ($Details) { Write-Host "        $Details" -ForegroundColor Yellow }
        $script:allPassed = $false
    }
}

Write-Host "=========================================="
Write-Host "PortMate Worker Environment Validation"
Write-Host "Target Role: $Role"
Write-Host "Repository : $RepoPath"
Write-Host "Date/Time  : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
Write-Host "=========================================="

Set-Location -Path $RepoPath

# 1. PowerShell Version
$psVersion = $PSVersionTable.PSVersion
$isPwsh7 = $psVersion.Major -ge 7
Report-Check -Name "PowerShell Version" -Success $isPwsh7 -Details "Found v$psVersion (Required: 7+)"

# 2. Git Available
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
$gitInstalled = $null -ne $gitCmd
$gitVersion = if ($gitInstalled) { (git --version) } else { "None" }
$gitCmdPath = if ($gitCmd) { $gitCmd.Source } else { "" }
Report-Check -Name "Git Executable" -Success $gitInstalled -Details "$gitVersion ($gitCmdPath)"

# 3. Correct Repository Remote
$remoteUrl = if ($gitInstalled) { (git remote get-url origin 2>$null) } else { "" }
$expectedRemote = "DeeKayCode/portmate"
$remoteValid = $remoteUrl -like "*$expectedRemote*"
Report-Check -Name "Repository Remote" -Success $remoteValid -Details "origin = $remoteUrl"

# 4. GitHub Connectivity
$connected = $false
$connDetails = ""
if ($gitInstalled -and $remoteValid) {
    try {
        $lsRemote = git ls-remote origin HEAD 2>&1
        if ($LASTEXITCODE -eq 0) {
            $connected = $true
            $connDetails = "Connected to GitHub origin successfully."
        }
        else {
            $connDetails = "git ls-remote failed: $lsRemote"
        }
    }
    catch {
        $connDetails = $_.Exception.Message
    }
}
Report-Check -Name "GitHub Connectivity" -Success $connected -Details $connDetails

# 5. Current Branch
$currentBranch = if ($gitInstalled) { (git rev-parse --abbrev-ref HEAD 2>$null) } else { "unknown" }
Report-Check -Name "Current Git Branch" -Success ($currentBranch -in @('main', 'client', 'server')) -Details "Branch: $currentBranch"

# 6. Working Tree Cleanliness
$isClean = $false
$dirtyDetails = ""
if ($gitInstalled) {
    $status = git status --porcelain 2>$null
    if (-not $status) {
        $isClean = $true
        $dirtyDetails = "Working directory is clean."
    }
    else {
        $dirtyDetails = "Uncommitted changes present:`n$status"
    }
}
Report-Check -Name "Working Tree Cleanliness" -Success $isClean -Details $dirtyDetails

# 7. No Obvious Secrets Tracked
$trackedSecrets = @()
if ($gitInstalled) {
    $trackedFiles = git ls-files 2>$null
    $suspiciousPatterns = @('\.env$', '\.pem$', '\.key$', 'id_rsa', 'runner.*token')
    foreach ($file in $trackedFiles) {
        foreach ($pattern in $suspiciousPatterns) {
            if ($file -match $pattern -and $file -notmatch '\.env\.example') {
                $trackedSecrets += $file
            }
        }
    }
}
$noSecrets = ($trackedSecrets.Count -eq 0)
Report-Check -Name "Secret Scanning (Tracked Files)" -Success $noSecrets -Details $(if ($noSecrets) { "No suspicious secrets tracked." } else { "Suspicious files tracked: $($trackedSecrets -join ', ')" })

# 8. Contracts Directory
$contractsDir = Join-Path $RepoPath "contracts"
$contractsExist = (Test-Path (Join-Path $contractsDir "README.md")) -and
                  (Test-Path (Join-Path $contractsDir "openapi.yaml")) -and
                  (Test-Path (Join-Path $contractsDir "models.schema.json")) -and
                  (Test-Path (Join-Path $contractsDir "events.schema.json"))
Report-Check -Name "Contracts Directory & Schemas" -Success $contractsExist -Details "Directory: $contractsDir"

# 9. Role-Specific AI CLI and Prompts
if ($Role -eq "gemini-worker" -or $Role -eq "auto") {
    $promptGemini = Join-Path $RepoPath "prompts\gemini-worker.md"
    Report-Check -Name "Gemini Prompt File" -Success (Test-Path $promptGemini) -Details $promptGemini

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
    $hasAgy = $null -ne $agyBin
    Report-Check -Name "Antigravity CLI (agy.exe)" -Success $hasAgy -Details "Path: $agyBin"
}

if ($Role -eq "gpt-worker") {
    $promptGpt = Join-Path $RepoPath "prompts\gpt-worker.md"
    Report-Check -Name "GPT Prompt File" -Success (Test-Path $promptGpt) -Details $promptGpt

    $codexCmd = Get-Command codex -ErrorAction SilentlyContinue
    $codexBin = if ($codexCmd) { $codexCmd.Source } else { $null }
    $hasCodex = $null -ne $codexBin
    Report-Check -Name "Codex CLI" -Success $hasCodex -Details "Path: $codexBin"
}

# 10. Self-Hosted Runner Status
$runnerDirs = @(
    "C:\actions-runner-gemini",
    "C:\actions-runner-gpt",
    "C:\Users\deeka\actions-runner-gemini",
    "C:\Users\deeka\actions-runner-gpt",
    "C:\actions-runner"
)
$runnerFound = $false
$runnerStatusText = ""
foreach ($rd in $runnerDirs) {
    if (Test-Path (Join-Path $rd "run.cmd")) {
        $runnerFound = $true
        $runnerStatusText = "Found runner in $rd"
        break
    }
}
# Also check GitHub API for online runners if gh is authenticated
$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd) {
    try {
        $ghRunnersJson = gh api "repos/$expectedRemote/actions/runners" 2>$null
        if ($ghRunnersJson) {
            $ghRunners = ($ghRunnersJson | ConvertFrom-Json).runners
            $matched = $ghRunners | Where-Object { $_.labels.name -contains $Role -and $_.status -eq "online" }
            if ($matched) {
                $runnerStatusText += " | GitHub reports $Role is ONLINE (ID: $($matched.id))"
            }
            else {
                $runnerStatusText += " | GitHub reports $Role is NOT online yet."
            }
        }
    }
    catch {}
}

Report-Check -Name "Self-Hosted Runner Status" -Success $runnerFound -Details $runnerStatusText

Write-Host "=========================================="
if ($allPassed) {
    Write-Host "Environment validation PASSED for role: $Role" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "Environment validation FAILED for role: $Role" -ForegroundColor Red
    exit 1
}
