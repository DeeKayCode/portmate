#requires -Version 7.0
param([ValidateSet('gpt','gemini')][string]$Role = 'gpt', [string]$RepositoryPath = (Split-Path (Split-Path $PSScriptRoot)), [string]$RunnerDirectory = $env:PORTMATE_RUNNER_DIRECTORY)
. "$PSScriptRoot/common.ps1"
$failed = $false
function Check([string]$Name, [scriptblock]$Body) {
    try { & $Body; Write-Host "OK: $Name" } catch { Write-Host "NOT READY: $Name - $_"; $script:failed = $true }
}
Push-Location $RepositoryPath
try {
    Check 'PowerShell 7+' { if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'Install PowerShell 7.' } }
    Check 'Git' { Get-Command git.exe -CommandType Application -ErrorAction Stop | Out-Null }
    Check 'Repository' { Assert-Remote }
    Check 'GitHub connectivity/access' { Git ls-remote origin HEAD | Out-Null }
    Check 'client branch' { if ((Git branch --show-current) -ne 'client') { throw 'Use a dedicated client checkout.' } }
    Check 'AI CLI and authentication' {
        if ($Role -eq 'gpt') {
            & codex login status
            if ($LASTEXITCODE -ne 0) { throw 'Run codex login as the runner service account.' }
            & codex exec --help | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Noninteractive CLI unavailable.' }
        } else {
            if (!$env:PORTMATE_GEMINI_ADAPTER -or !(Test-Path $env:PORTMATE_GEMINI_ADAPTER)) { throw 'Configure a verified local Gemini adapter.' }
            & $env:PORTMATE_GEMINI_ADAPTER -ValidateOnly
            if ($LASTEXITCODE -ne 0) { throw 'Gemini adapter/authentication validation failed.' }
        }
    }
    Check 'Prompt and contracts' { if (!(Test-Path "prompts/$Role-worker.md") -or !(Test-Path contracts)) { throw 'Required files missing.' } }
    Check 'Tracked secret scan' { Assert-NoSecrets }
    Check 'Clean checkout' { Assert-Clean }
    Check 'Runner registration and service' {
        if (!$RunnerDirectory -or !(Test-Path (Join-Path $RunnerDirectory '.runner'))) { throw 'Set PORTMATE_RUNNER_DIRECTORY to a registered runner installation.' }
        $registration = Get-Content (Join-Path $RunnerDirectory '.runner') -Raw | ConvertFrom-Json
        if ($registration.gitHubUrl -ne 'https://github.com/DeeKayCode/portmate') { throw 'Runner belongs to another repository.' }
        $serviceFile = Join-Path $RunnerDirectory '.service'
        if (!(Test-Path $serviceFile)) { throw 'Runner service not configured.' }
        $service = Get-Service -Name (Get-Content $serviceFile -Raw).Trim() -ErrorAction Stop
        if ($service.Status -ne 'Running') { throw 'Runner service is stopped.' }
        Write-Host 'Local service is running; confirm online status and role label in GitHub.'
    }
} finally { Pop-Location }
if ($failed) { exit 1 }
exit 0
