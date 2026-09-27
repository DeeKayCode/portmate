Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Git {
    $result = & git.exe @args
    if ($LASTEXITCODE -ne 0) { throw "Git failed: $($args[0])" }
    return $result
}
function Assert-Remote {
    $remote = Git remote get-url origin
    if ($remote -notmatch '^(https://github\.com/DeeKayCode/portmate(?:\.git)?|git@github\.com:DeeKayCode/portmate(?:\.git)?)$') { throw 'Wrong repository remote.' }
}
function Assert-Clean {
    if (Git status --porcelain --untracked-files=all) { throw 'Incomplete handoff: staged, unstaged or untracked changes remain. Preserve them; only an exact agent checkpoint may be recovered automatically.' }
}
function Get-WorktreeFingerprint {
    # Include the index independently: identical working files with different staging are different states.
    $parts = @((Git rev-parse HEAD), (Git status --porcelain --untracked-files=all), (Git diff --binary HEAD --), (Git diff --cached --binary --))
    foreach ($path in @(Git -c core.quotePath=false ls-files --others --exclude-standard)) {
        if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw 'Cannot safely fingerprint an untracked path.' }
        $parts += $path
        $parts += (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    }
    return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes(($parts -join "`n"))))
}
function Get-AgentCheckpoint([string]$Role, [string]$TriggerSha) {
    $path = Join-Path (Git rev-parse --absolute-git-dir) 'portmate-agent-checkpoint.json'
    if (!(Test-Path -LiteralPath $path)) { return $null }
    $record = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if ($record.role -ne $Role -or $record.trigger -ne $TriggerSha -or $record.fingerprint -ne (Get-WorktreeFingerprint)) {
        throw 'Recovery checkpoint does not match this event and complete worktree. Preserve changes for review.'
    }
    return $record
}
function Assert-NoSecrets([string]$Revision = 'HEAD') {
    $paths = @(Git ls-tree -r --name-only $Revision)
    foreach ($path in $paths) {
        if ($path -match '(^|/)(\.env($|\.(?!example$))|\.credentials|\.runner$)|\.(pem|key|p12|pfx)$') { throw "Potential secret file: $path" }
    }
    # Do not print matching content: logs must never expose secrets.
    & git.exe grep -I -q -E '(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|sk-proj-[A-Za-z0-9_-]{30,})' $Revision -- .
    if ($LASTEXITCODE -eq 0) { throw 'Potential secret content detected; inspect privately.' }
    if ($LASTEXITCODE -gt 1) { throw 'Secret scan failed.' }
}
