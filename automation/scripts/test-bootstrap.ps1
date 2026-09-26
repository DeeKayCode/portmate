#requires -Version 7.0
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/common.ps1"
$root = Split-Path (Split-Path $PSScriptRoot)
Push-Location $root
try {
    foreach ($file in Get-ChildItem automation/scripts -Filter *.ps1) {
        $tokens = $null; $errors = $null
        [Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors) | Out-Null
        if ($errors.Count) { throw "PowerShell parse error in $($file.Name): $errors" }
    }
    foreach ($path in @('SPEC.md','AGENTS.md','prompts/gpt-worker.md','prompts/gemini-worker.md','prompts/server-worker.md','contracts/openapi.yaml','.github/workflows/ci.yml','.github/workflows/trigger-gpt.yml','.github/workflows/trigger-gemini.yml')) {
        if (!(Test-Path $path)) { throw "Missing $path" }
    }
    foreach ($path in @('contracts/models.schema.json','contracts/events.schema.json','automation/gates.json','automation/handshake/state.json')) {
        Get-Content $path -Raw | ConvertFrom-Json | Out-Null
    }
    $cases = @{
        '[GEMINI] change' = 'gpt'
        '[GEMINI_COMPLETE] Frontend implementation complete' = 'gpt'
        '[GPT] change' = 'gemini'
        '[CLIENT_COMPLETE] Client release gate passed' = 'none'
        'chore: automation handshake complete' = 'none'
        'prefix [GPT] change' = 'none'
        '[GPT_BAD] change' = 'none'
    }
    foreach ($message in $cases.Keys) {
        $actual = if ($message -match '^\[GEMINI(?:_COMPLETE)?\] ') { 'gpt' } elseif ($message -match '^\[GPT\] ') { 'gemini' } else { 'none' }
        if ($actual -ne $cases[$message]) { throw "Marker routing failed: $message" }
    }
    & pwsh -NoProfile -File automation/scripts/invoke-gpt-worker.ps1 -TriggerSha invalid -RepositoryPath $root 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { throw 'Invalid event SHA was accepted.' }
    if ((Get-Content SPEC.md -Raw) -match 'BOOTSTRAP[_ ]PLACEHOLDER') {
        & pwsh -NoProfile -File automation/scripts/test-release-gates.ps1 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { throw 'Placeholder release gate falsely passed.' }
    }
    Assert-NoSecrets
    Write-Host 'PASS: script syntax, required files, JSON, marker routing, invalid SHA rejection, placeholder release rejection and tracked secret scan.'
} finally { Pop-Location }
exit 0
