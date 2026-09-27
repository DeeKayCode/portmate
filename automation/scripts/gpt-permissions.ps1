# Codex custom profile: repository/Git writes without unrestricted host access.
function Get-GptPermissionArguments {
    @(
        '-c', 'default_permissions="portmate-worker"',
        '-c', 'permissions.portmate-worker={extends=":read-only",filesystem={":tmpdir"="write",":slash_tmp"="write",":workspace_roots"={"."="write",".git"="write",".codex"="read",".agents"="read"}},network={enabled=true}}'
    )
}
