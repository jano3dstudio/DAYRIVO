$ErrorActionPreference = 'Stop'
$clockodoDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../clockodo'))
. (Join-Path $clockodoDir 'protocol.ps1')
$testToken='c'*64
if ((Get-ClockodoLaunchToken ('dayrivo-clockodo://connect/'+$testToken)) -ne $testToken) { throw 'Valid protocol URI rejected' }
foreach ($invalid in @('https://example.com','dayrivo-clockodo://connect/abc',('dayrivo-clockodo://connect/'+$testToken+'?command=bad'),('dayrivo-clockodo://connect/'+$testToken+'" -File bad.ps1'),("dayrivo-clockodo://connect/"+$testToken+"`n"))) {
    $rejected=$false
    try { Get-ClockodoLaunchToken $invalid | Out-Null } catch { $rejected=$true }
    if (-not $rejected) { throw 'Unsafe protocol URI accepted' }
}
$source = Get-Content -LiteralPath (Join-Path $clockodoDir 'Start-Clockodo.ps1') -Raw
$source = $source -replace '(?m)^\. \(Join-Path \$PSScriptRoot .+\)\r?\n', ''
$source = $source.Replace('$PSScriptRoot', "'"+$clockodoDir.Replace("'","''")+"'")
$script:sessionSeen = $false
function Get-ClockodoCredentials {
    return @{Email='tester@example.com'; Secret=(ConvertTo-SecureString 'FAKE-TEST-ONLY' -AsPlainText -Force)}
}
function Show-ClockodoSession($Child,[string]$Code,[string]$PlannerUrl) {
    if ($Child.HasExited -or $Code -notmatch '^\d+\.[a-f0-9]{64}$') { throw 'Local service did not start' }
    if ($PlannerUrl -notmatch '^file:///.*index.html#clockodo=') { throw 'Wrong planner URI' }
    $parts=$Code.Split('.')
    $status=Invoke-RestMethod -Uri ('http://127.0.0.1:'+$parts[0]+'/status') -Headers @{Origin='null';Authorization=('Bearer '+$parts[1])}
    if (-not $status.readOnly) { throw 'Unexpected service' }
    $script:sessionSeen=$true
}
function Test-DirectSession($Child,[string]$Token) {
    $headers=@{Origin='null';Authorization=('Bearer '+$Token)}
    $status=Invoke-RestMethod -Uri 'http://127.0.0.1:18744/status' -Headers $headers
    if (-not $status.readOnly) { throw 'Direct service unavailable' }
    Invoke-RestMethod -Uri 'http://127.0.0.1:18744/disconnect' -Method Post -Headers $headers | Out-Null
    if (-not $Child.WaitForExit(5000)) { throw 'Direct service did not stop' }
    $script:directSeen=$true
}
$previousOptions=$env:NODE_OPTIONS
try {
    $fixture=[System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'fixtures/clockodo-upstream.cjs'))
    $env:NODE_OPTIONS='--require="'+$fixture.Replace('\','/')+'"'
    & ([ScriptBlock]::Create($source))
    if (-not $script:sessionSeen) { throw 'Launcher did not reach paired session' }
    $script:directSeen=$false
    $directSource=$source.Replace('$child.WaitForExit()', 'Test-DirectSession $child $launchToken')
    $directSource=$directSource -replace '(?m)^    if \(\$launchToken\) \{ \[System.Windows.Forms.MessageBox\].+\r?$', '    throw'
    & ([ScriptBlock]::Create($directSource)) -LaunchUri ('dayrivo-clockodo://connect/'+$testToken)
    if (-not $script:directSeen) { throw 'Launcher did not reach direct session' }
    Write-Output 'PASS: Windows PowerShell launcher, UTF-8 stdin, child startup, file URI, local authentication and cleanup. Fake upstream only.'
    Write-Output 'PASS: strict launch URI, direct fixed-port session, matching token and app disconnect. No API credentials or registry changes.'
} finally { $env:NODE_OPTIONS=$previousOptions }
