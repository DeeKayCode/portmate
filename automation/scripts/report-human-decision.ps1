#requires -Version 7.0
param([Parameter(Mandatory)][string]$TriggerSha,
      [Parameter(Mandatory)][string]$ConflictingRequirements,
      [Parameter(Mandatory)][string]$AffectedComponents,
      [Parameter(Mandatory)][string]$Decision)
. "$PSScriptRoot/common.ps1"
if ($TriggerSha -notmatch '^[0-9a-f]{40}$') { throw 'Full trigger SHA required.' }
$record = @{ trigger=$TriggerSha; requirements=$ConflictingRequirements; components=$AffectedComponents; decision=$Decision }
$record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path (Git rev-parse --absolute-git-dir) 'portmate-human-decision.json')
Write-Host 'HUMAN_DECISION_REQUIRED: conflicting authoritative product requirements recorded; work preserved.'
