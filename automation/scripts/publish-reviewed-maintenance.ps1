#requires -Version 7.0
param(
    [Parameter(Mandatory)][string]$ExpectedRemoteSha,
    [string]$AuditTriggerSha
)
# Explicit human-requested maintenance only. Normal workers use invoke-worker.ps1.
. "$PSScriptRoot/common.ps1"
$lock = $null
try {
    if ($ExpectedRemoteSha -notmatch '^[0-9a-f]{40}$') { throw 'Full expected remote SHA required.' }
    Assert-Remote
    Assert-Clean
    $lock = [IO.File]::Open((Join-Path (Git rev-parse --absolute-git-dir) 'portmate-worker.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    if ((Git branch --show-current) -ne 'client') { throw 'Maintenance publication requires client branch.' }
    Git fetch origin client
    if ((Git rev-parse origin/client) -ne $ExpectedRemoteSha) { throw 'Remote advanced; preserve local work.' }
    & git.exe merge-base --is-ancestor $ExpectedRemoteSha HEAD
    if ($LASTEXITCODE) { throw 'Publication must fast-forward the shared branch.' }
    $commits = @(Git rev-list "$ExpectedRemoteSha..HEAD")
    if (!$commits.Count) { throw 'No reviewed changes to publish.' }
    if ($AuditTriggerSha) {
        if ($AuditTriggerSha -notmatch '^[0-9a-f]{40}$') { throw 'Full audited trigger SHA required.' }
        if ((Git show -s --format=%s $AuditTriggerSha) -notmatch '^\[GEMINI(?:_COMPLETE)?\] ') { throw 'Audit must originate from a Gemini handoff.' }
        & git.exe merge-base --is-ancestor $AuditTriggerSha $ExpectedRemoteSha
        if ($LASTEXITCODE) { throw 'Audited trigger is not incorporated.' }
        $intervening = @(Git log --format=%s "$AuditTriggerSha..$ExpectedRemoteSha")
        if ($intervening | Where-Object { $_ -match '^\[(GPT|GEMINI|GEMINI_COMPLETE|CLIENT_COMPLETE)\] ' }) { throw 'A newer worker handoff supersedes this audit.' }
        if ($commits.Count -ne 1 -or (Git show -s --format=%P HEAD) -ne $ExpectedRemoteSha) { throw 'Audit repair handoff must be one child of reviewed maintenance.' }
        if ((Git show -s --format=%s HEAD) -notmatch '^\[GPT\] ') { throw 'Only a repair handoff is allowed here; completion requires normal release workflow.' }
        if (((Git show -s --format=%B HEAD) -join "`n") -notmatch "(?m)^PortMate-Trigger: $AuditTriggerSha$") { throw 'Missing audited trigger trailer.' }
        foreach ($file in @(Git diff-tree --no-commit-id --name-only -r HEAD)) {
            if ($file -notmatch '^docs/') { throw 'Post-maintenance audit dispatch may only record reviewed findings in docs/.' }
        }
    } else {
        foreach ($commit in $commits) {
            if ((Git show -s --format=%s $commit) -notmatch '^chore: ') { throw 'Maintenance commits must not trigger workers.' }
        }
    }
    foreach ($commit in $commits) { Assert-NoSecrets $commit }
    & "$PSScriptRoot/test-release-gates.ps1" -Component all
    if ($LASTEXITCODE) { throw 'Maintenance release gates failed.' }
    Assert-Clean
    Git fetch origin client
    if ((Git rev-parse origin/client) -ne $ExpectedRemoteSha) { throw 'Remote advanced during validation; preserve local work.' }
    Assert-Clean
    Git push origin HEAD:refs/heads/client
    Assert-Clean
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
} finally { if ($lock) { $lock.Dispose() } }
exit 0
