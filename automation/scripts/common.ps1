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
    if (Git status --porcelain --untracked-files=all) { throw 'Dirty working tree; preserve and review changes manually.' }
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
