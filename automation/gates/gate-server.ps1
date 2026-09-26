#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot)
Push-Location $root
try {
    Write-Host "Validating server..."
    $serverFiles = @(Get-ChildItem server -File -Recurse | Where-Object Name -ne '.gitkeep')
    if ($serverFiles.Count -eq 0) {
        Write-Host "Server implementation pending from GPT backend worker."
        exit 0
    }
    # When server package.json exists, run test
    if (Test-Path 'server/package.json') {
        Push-Location server
        try {
            npm test
            if ($LASTEXITCODE -ne 0) { throw "Server tests failed." }
        } finally {
            Pop-Location
        }
    }
    Write-Host "PASS: Server gate."
    exit 0
} finally {
    Pop-Location
}
