#requires -Version 7.0
param([ValidateSet('contracts','client','server','all')][string]$Component = 'all')
$ErrorActionPreference = 'Stop'
try {
    $root = Split-Path (Split-Path $PSScriptRoot)
    Push-Location $root
    $config = Get-Content automation/gates.json -Raw | ConvertFrom-Json
    foreach ($part in @('mobile','server')) {
        $files = @(Get-ChildItem $part -File -Recurse | Where-Object Name -ne '.gitkeep')
        if (!$files.Count) { Write-Host "SKIPPED / NOT CONFIGURED: $part dependency install, lint, typecheck, tests, build and security checks." }
    }
    if (!$config.approved -or (Get-Content SPEC.md -Raw) -match 'BOOTSTRAP_PLACEHOLDER') { throw 'RELEASE BLOCKED: specification/contracts not approved and release gates not configured.' }
    if (Get-ChildItem contracts -File | Select-String 'BOOTSTRAP_PLACEHOLDER') { throw 'RELEASE BLOCKED: placeholder contracts.' }
    $parts = if ($Component -eq 'all') { @('contracts','client','server') } elseif ($Component -eq 'contracts') { @('contracts') } else { @('contracts',$Component) }
    foreach ($part in $parts) {
        $script = $config.$part
        if (!$script -or $script -notmatch '^automation/gates/[a-z0-9-]+\.ps1$' -or !(Test-Path $script)) { throw "Release gate not configured: $part" }
        & pwsh -NoProfile -File $script
        if ($LASTEXITCODE -ne 0) { throw "Release gate failed: $part" }
    }
    exit 0
} catch { Write-Error $_ -ErrorAction Continue; exit 1 }
finally { Pop-Location }
