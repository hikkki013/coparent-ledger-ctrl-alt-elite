$ErrorActionPreference = 'Stop'
$repository = 'hikkki013/coparent-ledger'
$sourceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
function Invoke-CheckedGit {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArguments)
    & git @GitArguments
    if ($LASTEXITCODE -ne 0) { throw 'Git failed; no force push or automatic cleanup was attempted.' }
}
$login = & gh api user --jq '.login'
if ($LASTEXITCODE -ne 0 -or $login.Trim() -ne 'hikkki013') { throw 'Sign GitHub CLI into hikkki013 first.' }
$private = & gh repo view $repository --json isPrivate --jq '.isPrivate'
if ($LASTEXITCODE -ne 0 -or $private.Trim() -ne 'true') { throw 'Destination must already exist and be private.' }
$changes = & git -C $sourceRoot status --porcelain
if ($LASTEXITCODE -ne 0 -or $changes) { throw 'Commit intended changes locally first; this script publishes exactly HEAD.' }
# Preserve remote history by copying committed source into a fresh clone. No force push.
$publishRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('coparent-publish-' + [Guid]::NewGuid().ToString('N'))
$archive = $publishRoot + '.zip'
Invoke-CheckedGit -C $sourceRoot archive --format=zip ('--output=' + $archive) HEAD
Invoke-CheckedGit clone ('https://github.com/' + $repository + '.git') $publishRoot
Expand-Archive -LiteralPath $archive -DestinationPath $publishRoot -Force
Invoke-CheckedGit -C $publishRoot config user.name hikkki013
Invoke-CheckedGit -C $publishRoot config user.email hikkki013@users.noreply.github.com
Invoke-CheckedGit -C $publishRoot add --all
$pending = & git -C $publishRoot status --porcelain
if (-not $pending) { Write-Output 'The private repository already contains this snapshot.'; exit 0 }
Invoke-CheckedGit -C $publishRoot commit -m 'Sync CoParent Ledger MVP source and verification status'
Invoke-CheckedGit -C $publishRoot push origin HEAD:main
Write-Output ('Published to https://github.com/' + $repository)
Write-Output ('Checkout retained at ' + $publishRoot)
