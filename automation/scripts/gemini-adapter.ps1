#requires -Version 7.0
[CmdletBinding()]
param (
    [switch]$ValidateOnly,
    [string]$Prompt,
    [string]$RepositoryPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Ensure PATH has required tools
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$env:PATH = "$userPath;$machinePath;$env:PATH"

$agyBin = (Get-Command agy.exe -ErrorAction SilentlyContinue)?.Source
if (-not $agyBin) {
    $candidatePaths = @(
        "C:\Users\deeka\AppData\Local\agy\bin\agy.exe",
        "C:\Users\deeka\.gemini\bin\agy.exe"
    )
    foreach ($p in $candidatePaths) {
        if (Test-Path $p) {
            $agyBin = $p
            break
        }
    }
}

if (-not $agyBin) {
    Write-Error "Antigravity CLI (agy.exe) not found."
    exit 1
}

if ($ValidateOnly) {
    try {
        $out = & $agyBin --help
        Write-Host "Antigravity CLI verified at $agyBin"
        cmd.exe /c "exit 0"
        exit 0
    }
    catch {
        cmd.exe /c "exit 1"
        exit 1
    }
}

if (-not $Prompt) {
    Write-Error "Prompt is required when not running with -ValidateOnly."
    exit 1
}

$targetDir = if ($RepositoryPath) { $RepositoryPath } else { Get-Location }
Push-Location $targetDir
try {
    Write-Host "Invoking Antigravity CLI in $targetDir..."
    & $agyBin -p "$Prompt" --dangerously-skip-permissions
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
