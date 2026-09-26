#requires -Version 7.0
param([string]$TriggerSha = $env:PORTMATE_TRIGGER_SHA, [string]$RepositoryPath = $env:PORTMATE_REPO, [string]$TriggerMessage = $env:PORTMATE_TRIGGER_MESSAGE, [ValidateSet('client')][string]$TargetBranch = 'client')
& "$PSScriptRoot/invoke-worker.ps1" -Role gpt -TriggerSha $TriggerSha -RepositoryPath $RepositoryPath -TriggerMessage $TriggerMessage
exit $LASTEXITCODE
