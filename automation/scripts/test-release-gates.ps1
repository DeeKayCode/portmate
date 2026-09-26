#requires -Version 7.0
param(
    [ValidateSet('contracts','client','server','all')][string]$Component = 'all',
    [switch]$RequireComplete
)
$ErrorActionPreference = 'Stop'
try {
    $root = Split-Path (Split-Path $PSScriptRoot)
    Push-Location $root
    $config = Get-Content automation/gates.json -Raw | ConvertFrom-Json
    if (!$config.approved) { throw 'RELEASE BLOCKED: gates are not approved.' }
    if ((Get-Content SPEC.md -Raw) -match 'BOOTSTRAP[_ ]PLACEHOLDER') { throw 'RELEASE BLOCKED: specification placeholder.' }
    if (Get-ChildItem contracts -File | Select-String 'BOOTSTRAP[_ ]PLACEHOLDER') { throw 'RELEASE BLOCKED: contract placeholder.' }
    $parts = if ($Component -eq 'all') { @('contracts','server','client') } elseif ($Component -eq 'contracts') { @('contracts') } else { @('contracts',$Component) }
    foreach ($part in $parts | Select-Object -Unique) {
        $script = $config.$part
        if (!$script -or $script -notmatch '^automation/gates/[a-z0-9-]+\.ps1$' -or !(Test-Path $script)) { throw "Release gate not configured: $part" }
        $arguments = @()
        if ($part -eq 'client' -and $RequireComplete) { $arguments += '-RequireComplete' }
        & pwsh -NoProfile -File $script @arguments
        if ($LASTEXITCODE -ne 0) { throw "Release gate failed: $part" }
    }
    exit 0
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
} finally {
    Pop-Location
}
