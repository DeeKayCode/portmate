#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot)
$npm = Get-Command npm.cmd,npm -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source
if (!$npm -and $env:ProgramFiles) {
    $candidate = Join-Path $env:ProgramFiles 'nodejs/npm.cmd'
    if (Test-Path $candidate) { $npm = $candidate }
}
if (!$npm) { throw 'TECHNICAL_FAILURE: Node.js/npm is required.' }
$env:PATH = "$(Split-Path $npm)$([IO.Path]::PathSeparator)$env:PATH"
foreach ($project in @('server','mobile')) {
    $directory = Join-Path $root $project
    if (!(Test-Path "$directory/package.json")) { continue }
    if (!(Test-Path "$directory/package-lock.json")) { throw "TECHNICAL_FAILURE: missing $project/package-lock.json" }
    $identity = @((Get-FileHash "$directory/package.json").Hash, (Get-FileHash "$directory/package-lock.json").Hash, (& node --version), (& $npm --version), [Environment]::OSVersion.Platform) -join ':'
    $stamp = Join-Path $directory 'node_modules/.portmate-dependencies'
    if ((Test-Path $stamp) -and (Get-Content $stamp -Raw).Trim() -eq $identity) {
        & $npm --prefix $directory ls --depth=0 --silent *> $null
        if ($LASTEXITCODE -eq 0) { Write-Host "Dependencies synchronized: $project"; continue }
    }
    & $npm --prefix $directory ci
    if ($LASTEXITCODE -ne 0) { throw "TECHNICAL_FAILURE: deterministic dependency installation failed for $project" }
    New-Item -ItemType Directory -Path (Split-Path $stamp) -Force | Out-Null
    $identity | Set-Content -LiteralPath $stamp
}
$global:LASTEXITCODE = 0
