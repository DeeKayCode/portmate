#requires -Version 7.0
param([switch]$RequireComplete)
$ErrorActionPreference = 'Stop'
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (!$npm -and (Test-Path (Join-Path $env:ProgramFiles 'nodejs/npm.cmd'))) { $npm = Join-Path $env:ProgramFiles 'nodejs/npm.cmd' }
if (!$npm) { throw 'Node.js/npm is required for mobile validation.' }
$nodeDir = Split-Path $npm
if ($nodeDir -and (($env:PATH -split ';') -notcontains $nodeDir)) {
    $env:PATH = "$nodeDir;$env:PATH"
}
if (!(Test-Path 'mobile/package.json')) {
    if ($RequireComplete) { throw 'Mobile PWA has not been initialized.' }
    Write-Host 'SKIPPED / NOT CONFIGURED: mobile PWA is not present yet.'
    exit 0
}
& $npm --prefix mobile ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $npm --prefix mobile audit --omit=dev --audit-level=high
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
foreach ($command in @('lint', 'typecheck', 'test', 'build')) {
    & $npm --prefix mobile run $command
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
exit 0
