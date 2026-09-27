#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (!$npm -and (Test-Path (Join-Path $env:ProgramFiles 'nodejs/npm.cmd'))) { $npm = Join-Path $env:ProgramFiles 'nodejs/npm.cmd' }
if (!$npm) { throw 'Node.js/npm is required for backend validation.' }
& $npm --prefix server audit --omit=dev --audit-level=high
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
foreach ($command in @('typecheck', 'lint', 'test', 'build')) {
    & $npm --prefix server run $command
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
exit 0
