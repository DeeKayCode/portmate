#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('portmate-deps-' + [guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory "$fixture/automation/scripts","$fixture/server" -Force | Out-Null
    Copy-Item "$PSScriptRoot/sync-dependencies.ps1" "$fixture/automation/scripts/"
    '{"name":"portmate-dependency-fixture","version":"1.0.0"}' | Set-Content "$fixture/server/package.json"
    '{"name":"portmate-dependency-fixture","version":"1.0.0","lockfileVersion":3,"packages":{"":{"name":"portmate-dependency-fixture","version":"1.0.0"}}}' | Set-Content "$fixture/server/package-lock.json"
    & "$fixture/automation/scripts/sync-dependencies.ps1"
    $stamp = "$fixture/server/node_modules/.portmate-dependencies"
    if (!(Test-Path $stamp)) { throw 'Successful install did not save a stamp.' }
    $first = Get-Content $stamp -Raw
    'preserve on reuse' | Set-Content "$fixture/server/node_modules/reuse-proof.txt"
    & "$fixture/automation/scripts/sync-dependencies.ps1"
    if (!(Test-Path "$fixture/server/node_modules/reuse-proof.txt")) { throw 'Unchanged dependencies were unnecessarily reinstalled.' }
    (Get-Content "$fixture/server/package-lock.json" -Raw).Replace('"lockfileVersion":3','"lockfileVersion":3,"requires":true') | Set-Content "$fixture/server/package-lock.json"
    & "$fixture/automation/scripts/sync-dependencies.ps1"
    if ((Get-Content $stamp -Raw) -eq $first) { throw 'Changed lockfile did not update dependency identity.' }
    if (Test-Path "$fixture/server/node_modules/reuse-proof.txt") { throw 'Changed lockfile did not trigger npm ci.' }
    '{"name":"portmate-dependency-fixture","version":"1.0.0","dependencies":{"portmate-unavailable-fixture":"1.0.0"}}' | Set-Content "$fixture/server/package.json"
    $rejected = $false
    $oldOffline = $env:npm_config_offline
    try { $env:npm_config_offline='true'; & "$fixture/automation/scripts/sync-dependencies.ps1" } catch { $rejected = $true } finally { $env:npm_config_offline=$oldOffline }
    if (!$rejected) { throw 'Inconsistent manifest/lockfile was accepted.' }
    Write-Host 'PASS: deterministic installation, unchanged reuse, lockfile invalidation and failed installation rejection.'
} finally {
    $resolved = [IO.Path]::GetFullPath($fixture)
    $temp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($resolved.StartsWith($temp,[StringComparison]::OrdinalIgnoreCase) -and (Split-Path $resolved -Leaf) -match '^portmate-deps-[0-9a-f]{32}$') { Remove-Item -LiteralPath $resolved -Recurse -Force }
}
