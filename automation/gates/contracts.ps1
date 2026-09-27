#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (!$npm -and (Test-Path (Join-Path $env:ProgramFiles 'nodejs/npm.cmd'))) { $npm = Join-Path $env:ProgramFiles 'nodejs/npm.cmd' }
if (!$npm) { throw 'Node.js/npm is required for contract validation.' }
$nodeDir = Split-Path $npm
if ($nodeDir -and (($env:PATH -split ';') -notcontains $nodeDir)) {
    $env:PATH = "$nodeDir;$env:PATH"
}
& $npm --prefix server run validate:contracts
exit $LASTEXITCODE
