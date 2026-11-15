param(
    [ValidateSet('hikkki013/coparent-ledger', 'hikkki013/coparent-ledger-ctrl-alt-elite')]
    [string]$Repository = 'hikkki013/coparent-ledger-ctrl-alt-elite'
)
$ErrorActionPreference = 'Stop'
$sourceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
function Invoke-CheckedGit {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArguments)
    & git -C $sourceRoot @GitArguments
    if ($LASTEXITCODE -ne 0) { throw 'Git failed. No reset, snapshot overwrite or force push was attempted.' }
}
$login = & gh api user --jq '.login'
if ($LASTEXITCODE -ne 0 -or $login.Trim() -ne 'hikkki013') { throw 'Sign GitHub CLI into hikkki013 first.' }
$metadata = & gh repo view $Repository --json nameWithOwner,isPrivate
if ($LASTEXITCODE -ne 0) { throw 'The intended repository could not be verified.' }
$destination = ($metadata -join "`n") | ConvertFrom-Json
if ($destination.isPrivate -ne $true -or $destination.nameWithOwner -ne $Repository) {
    throw 'Destination must be the exact intended hikkki013 repository and Private. Verify the current name first.'
}
$changes = Invoke-CheckedGit status --porcelain
if ($changes) { throw 'Review and commit intended changes first. This script does not stage files or replace remote files.' }
$remoteUrl = 'https://github.com/' + $Repository + '.git'
Invoke-CheckedGit fetch --no-tags $remoteUrl refs/heads/main
& git -C $sourceRoot merge-base --is-ancestor FETCH_HEAD HEAD
if ($LASTEXITCODE -ne 0) {
    throw 'Remote main is not an ancestor of local HEAD. Compare and reconcile histories manually before publishing.'
}
# Normal Git push rejects a remote race; never use force or replace files in a fresh clone.
Invoke-CheckedGit push $remoteUrl HEAD:refs/heads/main
$localHead = Invoke-CheckedGit rev-parse HEAD
$remoteLine = Invoke-CheckedGit ls-remote $remoteUrl refs/heads/main
if (($remoteLine -split '\s+')[0] -ne $localHead.Trim()) { throw 'Remote HEAD did not match after push; inspect before retrying.' }
Write-Output ('Verified push to private https://github.com/' + $Repository)
