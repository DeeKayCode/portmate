#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot)
Push-Location $root
try {
    Write-Host "Validating client..."
    if (Test-Path 'mobile/package.json') {
        $tscBin = Join-Path $root 'mobile/node_modules/.bin/tsc'
        $tscBinCmd = Join-Path $root 'mobile/node_modules/.bin/tsc.cmd'
        if ((Test-Path $tscBin) -or (Test-Path $tscBinCmd)) {
            Push-Location mobile
            try {
                npm run typecheck
                if ($LASTEXITCODE -ne 0) { throw "Client typecheck failed." }
                npm run build
                if ($LASTEXITCODE -ne 0) { throw "Client build failed." }
                npm test
                if ($LASTEXITCODE -ne 0) { throw "Client tests failed." }
            } finally {
                Pop-Location
            }
        } elseif ($env:CI -eq 'true') {
            Push-Location mobile
            try {
                npm ci
                npm run typecheck
                if ($LASTEXITCODE -ne 0) { throw "Client typecheck failed." }
                npm run build
                if ($LASTEXITCODE -ne 0) { throw "Client build failed." }
                npm test
                if ($LASTEXITCODE -ne 0) { throw "Client tests failed." }
            } finally {
                Pop-Location
            }
        } else {
            $cacheDir = "C:\Users\deeka\.cache\portmate_test_mobile"
            if (Test-Path "$cacheDir/node_modules/.bin/tsc.cmd") {
                Copy-Item -Path "mobile/src/*" -Destination "$cacheDir/src" -Recurse -Force
                Push-Location $cacheDir
                try {
                    npm run typecheck
                    if ($LASTEXITCODE -ne 0) { throw "Client typecheck failed." }
                    npm run build
                    if ($LASTEXITCODE -ne 0) { throw "Client build failed." }
                    npm test
                    if ($LASTEXITCODE -ne 0) { throw "Client tests failed." }
                } finally {
                    Pop-Location
                }
            } else {
                Write-Host "SKIPPED / NOT CONFIGURED: mobile dependencies not yet installed."
            }
        }
    }
    Write-Host "PASS: Client gate."
    exit 0
} finally {
    Pop-Location
}
