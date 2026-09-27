#requires -Version 7.0
param([Parameter(Mandatory)][ValidateSet('gpt','gemini')][string]$Role,
      [Parameter(Mandatory)][string]$TriggerSha,
      [Parameter(Mandatory)][switch]$ConfirmAgentOwned)
. "$PSScriptRoot/common.ps1"
# This explicit attestation must follow inspection by the agent. The wrapper never
# labels arbitrary startup dirt as its own, including after a crash without a checkpoint.
if (!$ConfirmAgentOwned -or $TriggerSha -notmatch '^[0-9a-f]{40}$') { throw 'Explicit ownership attestation and full trigger SHA required.' }
if ((Git branch --show-current) -ne 'client') { throw 'Checkpoint requires client branch.' }
& git.exe merge-base --is-ancestor $TriggerSha HEAD
if ($LASTEXITCODE -ne 0) { throw 'Checkpoint must descend from its trigger.' }
$record = @{ role=$Role; trigger=$TriggerSha; fingerprint=(Get-WorktreeFingerprint) }
$path = Join-Path (Git rev-parse --absolute-git-dir) 'portmate-agent-checkpoint.json'
$temporary = "$path.tmp"
$record | ConvertTo-Json | Set-Content -LiteralPath $temporary
Move-Item -LiteralPath $temporary -Destination $path -Force
