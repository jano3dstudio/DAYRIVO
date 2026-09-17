param([ValidateSet('Install','Uninstall','Check')][string]$Action = 'Install')
$ErrorActionPreference = 'Stop'
$keyPath = 'Software\Classes\dayrivo-clockodo'
$scriptPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'Start-Clockodo.ps1'))
$powershellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$command = '"'+$powershellPath+'" -STA -NoProfile -WindowStyle Hidden -ExecutionPolicy RemoteSigned -File "'+$scriptPath+'" -LaunchUri "%1"'
if (-not (Test-Path -LiteralPath $scriptPath)) { throw 'Startdatei fehlt.' }
$existing = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($keyPath)
try {
    if ($existing -and $existing.GetValue('DAYRIVO.Owner') -ne $scriptPath) { throw 'Dieser Protokollname ist bereits anderweitig registriert; keine Aenderung.' }
} finally { if ($existing) { $existing.Dispose() } }
if ($Action -eq 'Check') {
    $registered = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($keyPath+'\shell\open\command')
    try { @{installed=($null -ne $registered); matches=($null -ne $registered -and $registered.GetValue('') -eq $command); expectedCommand=$command} | ConvertTo-Json -Compress }
    finally { if ($registered) { $registered.Dispose() } }
    return
}
if ($Action -eq 'Uninstall') {
    [Microsoft.Win32.Registry]::CurrentUser.DeleteSubKeyTree($keyPath,$false)
    Write-Output 'DAYRIVO-Direktstart entfernt.'
    return
}
$root = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($keyPath)
try {
    $root.SetValue('','URL:DAYRIVO Clockodo')
    $root.SetValue('URL Protocol','')
    $root.SetValue('DAYRIVO.Owner',$scriptPath)
    $open = $root.CreateSubKey('shell\open\command')
    try { $open.SetValue('',$command) } finally { $open.Dispose() }
} finally { $root.Dispose() }
$verify = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($keyPath+'\shell\open\command')
try { if ($verify.GetValue('') -ne $command) { throw 'Registrierung nicht bestaetigt.' } }
finally { $verify.Dispose() }
Write-Output 'DAYRIVO-Direktstart fuer diesen Windows-Benutzer eingerichtet und zurueckgelesen.'
