#requires -Version 7.0
# Offline fixtures only: no GitHub calls, models, services or real handoff commits.
$ErrorActionPreference = 'Stop'
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('portmate-test-' + [guid]::NewGuid().ToString('N'))
$source = Split-Path (Split-Path $PSScriptRoot)
function Run-Git { & git.exe @args | Out-Null; if ($LASTEXITCODE) { throw "Fixture git failed: $($args[0])" } }
function Worker([string]$Role, [string]$Sha, [bool]$Success) {
    & pwsh -NoProfile -File "automation/scripts/invoke-$Role-worker.ps1" -TriggerSha $Sha -RepositoryPath (Get-Location).Path 2>$null | Out-Null
    if (($LASTEXITCODE -eq 0) -ne $Success) { throw "Unexpected $Role result for $Sha" }
}
New-Item -ItemType Directory $fixture | Out-Null
Push-Location $fixture
try {
    Run-Git init --bare remote.git
    Run-Git clone remote.git worker
    Set-Location worker
    Run-Git config user.name 'PortMate fixture'
    Run-Git config user.email 'fixture@example.invalid'
    Run-Git switch -c client
    Copy-Item (Join-Path $source automation) . -Recurse
    # Isolated fixture deliberately accepts only this local bare remote. Production guard stays intact.
    $commonPath = Join-Path (Get-Location) 'automation/scripts/common.ps1'
    $common = Get-Content $commonPath -Raw
    $start = $common.IndexOf('function Assert-Remote {')
    $end = $common.IndexOf('function Assert-Clean {')
    $common = $common.Substring(0,$start) + "function Assert-Remote { if ((Git remote get-url origin) -notlike '*remote.git') { throw 'Wrong fixture remote' } }`n" + $common.Substring($end)
    Set-Content $commonPath $common
    Run-Git add .
    Run-Git commit -m 'fixture baseline'
    Run-Git push -u origin client
    $baseline = & git.exe rev-parse HEAD
    '{"state":"GEMINI_OK"}' | Set-Content automation/handshake/state.json
    Run-Git add automation/handshake/state.json
    Run-Git commit -m '[GEMINI] automation handshake'
    Run-Git push origin client
    $trigger = & git.exe rev-parse HEAD
    # A dirty checkout must fail and preserve the human file.
    'human work' | Set-Content human.txt
    Worker gpt $trigger $false
    if (!(Test-Path human.txt)) { throw 'Human file was lost.' }
    Remove-Item -LiteralPath (Join-Path (Get-Location) human.txt)
    Worker gpt $baseline $false
    Worker gpt $trigger $true
    if ((Get-Content automation/handshake/state.json -Raw | ConvertFrom-Json).state -ne 'GPT_OK') { throw 'GPT transition failed.' }
    Worker gpt $trigger $false
    $gptCommit = & git.exe rev-parse HEAD
    Worker gemini $gptCommit $true
    if ((Get-Content automation/handshake/state.json -Raw | ConvertFrom-Json).state -ne 'COMPLETE') { throw 'Gemini stop transition failed.' }
    if ((& git.exe log -1 --format=%s) -ne 'chore: automation handshake complete') { throw 'Final marker can retrigger.' }
    Worker gemini $gptCommit $false
    if (& git.exe status --porcelain) { throw 'Fixture left dirty.' }
    Write-Host 'PASS: offline handshake round trip, stop condition, dirty preservation, stale event and duplicate rejection.'
} finally {
    Pop-Location
    $resolved = [IO.Path]::GetFullPath($fixture)
    $temp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($resolved.StartsWith($temp, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $resolved -Leaf) -match '^portmate-test-[0-9a-f]{32}$') {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
