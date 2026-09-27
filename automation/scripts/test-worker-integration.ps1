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
    . ./automation/scripts/common.ps1
    # Recovery requires explicit ownership, including staged, unstaged and untracked content.
    'agent draft' | Set-Content agent-draft.txt
    & ./automation/scripts/checkpoint-agent-work.ps1 -Role gpt -TriggerSha $trigger -ConfirmAgentOwned
    if (!(Get-AgentCheckpoint gpt $trigger)) { throw 'Exact agent checkpoint was not accepted.' }
    $rejected = $false
    try { Assert-Clean } catch { $rejected = $true }
    if (!$rejected) { throw 'Dirty handoff was accepted.' }
    'later human edit' | Set-Content agent-draft.txt
    $rejected = $false
    try { Get-AgentCheckpoint gpt $trigger } catch { $rejected = $true }
    if (!$rejected) { throw 'Changed untracked content was accepted for recovery.' }
    'agent draft' | Set-Content agent-draft.txt
    Run-Git add agent-draft.txt
    $rejected = $false
    try { Get-AgentCheckpoint gpt $trigger } catch { $rejected = $true }
    if (!$rejected) { throw 'Changed staging was accepted for recovery.' }
    # Remove only known fixture data, then restore the fixture's initial clean state.
    Run-Git rm -f -- agent-draft.txt
    Remove-Item -LiteralPath (Join-Path (& git.exe rev-parse --absolute-git-dir) 'portmate-agent-checkpoint.json')
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
    # Product recovery exercises the real wrapper with an isolated fake agent and gates.
    New-Item -ItemType Directory prompts,mobile -Force | Out-Null
    'Fixture agent' | Set-Content prompts/gemini-worker.md
    @'
param([string]$Component)
if ($Component -eq 'contracts' -and $env:PORTMATE_FIXTURE_PREFLIGHT -eq '1') {
    $global:LASTEXITCODE = 1
    return
}
if ($Component -eq 'client' -and $env:PORTMATE_FIXTURE_DIRTY_GATE -eq '1') {
    'gate output' | Set-Content mobile/gate-output.txt
}
$global:LASTEXITCODE = 0
'@ | Set-Content automation/scripts/test-release-gates.ps1
    $adapterPath = Join-Path $fixture 'adapter.ps1'
    @'
param($Prompt, $RepositoryPath)
$sha = [regex]::Match($Prompt, 'Trigger SHA: ([0-9a-f]{40})').Groups[1].Value
if ($env:PORTMATE_FIXTURE_DECISION -eq '1') {
    & ./automation/scripts/report-human-decision.ps1 -TriggerSha $sha -ConflictingRequirements 'Fixture contradiction A versus B' -AffectedComponents 'fixture' -Decision 'Choose A or B'
    $global:LASTEXITCODE = 0
    return
}
if ($env:PORTMATE_FIXTURE_PREFLIGHT -eq '1' -and $Prompt -notmatch 'TECHNICAL_REPAIR_REQUIRED:') { throw 'Missing autonomous repair context.' }
if (!(Test-Path mobile/recovered.txt)) {
    'agent-owned content' | Set-Content mobile/recovered.txt
    & ./automation/scripts/checkpoint-agent-work.ps1 -Role gemini -TriggerSha $sha -ConfirmAgentOwned
    $global:LASTEXITCODE = 1
    return
}
if ($Prompt -notmatch 'RECOVERY:') { throw 'Expected verified recovery context.' }
git add -- mobile
if ((git rev-parse HEAD) -eq $sha) {
    git commit -m '[GEMINI] recovered fixture' -m "PortMate-Trigger: $sha"
}
& ./automation/scripts/checkpoint-agent-work.ps1 -Role gemini -TriggerSha $sha -ConfirmAgentOwned
$global:LASTEXITCODE = 0
'@ | Set-Content $adapterPath
    $previousAdapter = $env:PORTMATE_GEMINI_ADAPTER
    $env:PORTMATE_GEMINI_ADAPTER = $adapterPath
    try {
        Run-Git add .
        Run-Git commit -m '[GPT] fixture product handoff'
        Run-Git push origin client
        $productTrigger = & git.exe rev-parse HEAD
        $env:PORTMATE_FIXTURE_DECISION = '1'
        Worker gemini $productTrigger $false
        if ($LASTEXITCODE -ne 78) { throw 'Human decision is not distinguishable from technical failure.' }
        if ((& git.exe rev-parse origin/client) -ne $productTrigger) { throw 'Human decision unexpectedly pushed.' }
        if (!(Test-Path .git/portmate-human-decision.json)) { throw 'Decision record was not preserved.' }
        Remove-Item -LiteralPath (Join-Path (Get-Location) '.git/portmate-human-decision.json')
        $env:PORTMATE_FIXTURE_DECISION = $null
        $env:PORTMATE_FIXTURE_PREFLIGHT = '1'
        Worker gemini $productTrigger $false
        if ((& git.exe rev-parse origin/client) -ne $productTrigger) { throw 'Failed agent pushed.' }
        'unattributed' | Set-Content unknown.txt
        Worker gemini $productTrigger $false
        if ((Get-Content unknown.txt) -ne 'unattributed') { throw 'Unknown change was altered.' }
        Remove-Item -LiteralPath (Join-Path (Get-Location) unknown.txt)
        $env:PORTMATE_FIXTURE_DIRTY_GATE = '1'
        Worker gemini $productTrigger $false
        if ((& git.exe rev-parse origin/client) -ne $productTrigger) { throw 'Gate-created dirt was pushed.' }
        if (!(Test-Path mobile/gate-output.txt)) { throw 'Gate output was discarded.' }
        Remove-Item -LiteralPath (Join-Path (Get-Location) mobile/gate-output.txt)
        $env:PORTMATE_FIXTURE_DIRTY_GATE = $null
        Worker gemini $productTrigger $true
        if (& git.exe status --porcelain --untracked-files=all) { throw 'Recovered handoff left changes.' }
        if ((& git.exe rev-parse HEAD) -ne (& git.exe rev-parse origin/client)) { throw 'Recovery did not push.' }
        if (Test-Path .git/portmate-agent-checkpoint.json) { throw 'Successful checkpoint was not cleared.' }
        # Human-requested maintenance stays separate from normal worker handoffs.
        $auditTrigger = & git.exe rev-parse HEAD
        New-Item -ItemType Directory docs -Force | Out-Null
        'reviewed maintenance' | Set-Content docs/maintenance.txt
        Run-Git add docs/maintenance.txt
        Run-Git commit -m 'chore: reviewed fixture maintenance'
        'unknown human content' | Set-Content unknown.txt
        & pwsh -NoProfile -File automation/scripts/publish-reviewed-maintenance.ps1 -ExpectedRemoteSha $auditTrigger 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0 -or !(Test-Path unknown.txt)) { throw 'Maintenance did not preserve unknown dirty work.' }
        Remove-Item -LiteralPath (Join-Path (Get-Location) unknown.txt)
        & pwsh -NoProfile -File automation/scripts/publish-reviewed-maintenance.ps1 -ExpectedRemoteSha $auditTrigger
        if ($LASTEXITCODE) { throw 'Reviewed maintenance publication failed.' }
        $maintenanceHead = & git.exe rev-parse HEAD
        'concrete frontend repair' | Set-Content docs/repair.txt
        Run-Git add docs/repair.txt
        Run-Git commit -m '[GPT] fixture audit repairs' -m "PortMate-Trigger: $auditTrigger"
        & pwsh -NoProfile -File automation/scripts/publish-reviewed-maintenance.ps1 -ExpectedRemoteSha $maintenanceHead -AuditTriggerSha $auditTrigger
        if ($LASTEXITCODE) { throw 'Post-maintenance repair dispatch failed.' }
        $repairHead = & git.exe rev-parse HEAD
        'must not publish arbitrary code as audit dispatch' | Set-Content mobile/disallowed.txt
        Run-Git add mobile/disallowed.txt
        Run-Git commit -m '[GPT] invalid audit dispatch' -m "PortMate-Trigger: $auditTrigger"
        & pwsh -NoProfile -File automation/scripts/publish-reviewed-maintenance.ps1 -ExpectedRemoteSha $repairHead -AuditTriggerSha $auditTrigger 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0 -or (& git.exe rev-parse origin/client) -ne $repairHead) { throw 'Superseded/arbitrary audit dispatch was published.' }
    } finally { $env:PORTMATE_GEMINI_ADAPTER = $previousAdapter; $env:PORTMATE_FIXTURE_DIRTY_GATE = $null; $env:PORTMATE_FIXTURE_DECISION = $null; $env:PORTMATE_FIXTURE_PREFLIGHT = $null }
    Write-Host 'PASS: handshake, replay/stale protection, dirty handoff rejection, checkpoint attribution, unknown preservation, human decision status, technical preflight repair and product recovery through push.'
} finally {
    Pop-Location
    $resolved = [IO.Path]::GetFullPath($fixture)
    $temp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($resolved.StartsWith($temp, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $resolved -Leaf) -match '^portmate-test-[0-9a-f]{32}$') {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
exit 0
