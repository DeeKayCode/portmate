#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot)
Push-Location $root
try {
    Write-Host "Validating contracts..."
    foreach ($file in @('contracts/models.schema.json', 'contracts/events.schema.json')) {
        if (!(Test-Path $file)) { throw "Missing $file" }
        Get-Content $file -Raw | ConvertFrom-Json | Out-Null
    }
    if (!(Test-Path 'contracts/openapi.yaml')) { throw "Missing contracts/openapi.yaml" }
    $content = Get-Content 'contracts/openapi.yaml' -Raw
    if ($content -match 'BOOTSTRAP[_ ]PLACEHOLDER') { throw "Placeholder found in openapi.yaml" }
    Write-Host "PASS: Contracts schema validation."
    exit 0
} finally {
    Pop-Location
}
