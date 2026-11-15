$helper = (Resolve-Path (Join-Path $PSScriptRoot '..\..\scripts\publish-private.ps1')).Path
$cases = @('wrong-owner', 'public-repository', 'dirty-tree', 'diverged-history', 'push-race', 'success')
foreach ($caseName in $cases) {
    & {
        param($helperPath, $case)
        $state = @{ Pushes = 0; Calls = @() }
        function gh {
            $global:LASTEXITCODE = 0
            if ($args[0] -eq 'api') {
                if ($case -eq 'wrong-owner') { return 'unapproved-user' }
                return 'hikkki013'
            }
            if ($case -eq 'public-repository') { return '{"nameWithOwner":"hikkki013/coparent-ledger-ctrl-alt-elite","isPrivate":false}' }
            return '{"nameWithOwner":"hikkki013/coparent-ledger-ctrl-alt-elite","isPrivate":true}'
        }
        function git {
            $global:LASTEXITCODE = 0
            $operation = $args[2]
            $state.Calls += $operation
            switch ($operation) {
                'status' { if ($case -eq 'dirty-tree') { return ' M README.md' } }
                'fetch' { }
                'merge-base' { if ($case -eq 'diverged-history') { $global:LASTEXITCODE = 1 } }
                'push' { $state.Pushes++; if ($case -eq 'push-race') { $global:LASTEXITCODE = 1 } }
                'rev-parse' { return ('a' * 40) }
                'ls-remote' { return (('a' * 40) + "`trefs/heads/main") }
                default { throw "Unexpected Git operation: $operation" }
            }
        }
        $failed = $false
        try { & $helperPath | Out-Null } catch { $failed = $true }
        if ($case -eq 'success') {
            if ($failed -or $state.Pushes -ne 1) { throw 'Successful guarded path failed in simulation.' }
        } elseif ($case -eq 'push-race') {
            if (-not $failed -or $state.Pushes -ne 1) { throw 'Push race was not rejected.' }
        } else {
            if (-not $failed -or $state.Pushes -ne 0) { throw "Unsafe case reached push: $case" }
        }
        Write-Output "PASS: $case (simulated commands only)"
    } $helper $caseName
}
