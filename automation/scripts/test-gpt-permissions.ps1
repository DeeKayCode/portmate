#requires -Version 7.0
param([Parameter(Mandatory)][string]$RepositoryPath)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/gpt-permissions.ps1"
$permissionArguments = @(Get-GptPermissionArguments)
$pwshPath = (Get-Process -Id $PID).Path
# Runs without a model call, using the same bounded permission profile as GPT.
& codex sandbox @permissionArguments -P portmate-worker -C $RepositoryPath $pwshPath -NoProfile -Command '
$ErrorActionPreference="Stop"
$probe=Join-Path (Get-Location) (".git/portmate-permission-probe-"+[guid]::NewGuid().ToString("N"))
try {
    [IO.File]::WriteAllText($probe,"permission probe")
    if ([IO.File]::ReadAllText($probe) -ne "permission probe") { throw "Probe mismatch" }
    Write-Host "PASS: sandboxed Git metadata write"
} finally { if(Test-Path -LiteralPath $probe) {Remove-Item -LiteralPath $probe} }
'
if ($LASTEXITCODE) { throw 'GPT sandbox cannot write Git metadata. Review the custom profile and stale Windows sandbox deny ACLs on this checkout; do not disable the sandbox.' }
