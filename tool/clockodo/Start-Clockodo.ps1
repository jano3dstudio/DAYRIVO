param([string]$LaunchUri = '')
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'protocol.ps1')
$launchToken = if ($LaunchUri) { Get-ClockodoLaunchToken $LaunchUri } else { '' }
. (Join-Path $PSScriptRoot 'credential-dialog.ps1')
. (Join-Path $PSScriptRoot 'session-dialog.ps1')
$child = $null
$credentials = $null
$plainKey = $null
try {
    $node = Get-Command node -ErrorAction Stop
    if ([int](& $node.Source -p 'parseInt(process.versions.node)') -lt 22) { throw 'Node.js 22 oder neuer wird benoetigt.' }
    $initialEmail = ''
    $settingsPath = Join-Path $PSScriptRoot 'local-settings.json'
    if (Test-Path -LiteralPath $settingsPath) { $initialEmail = (Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json).email }
    $credentials = Get-ClockodoCredentials $initialEmail
    if (-not $credentials) { return }
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credentials.Secret)
    try { $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = $node.Source
    $start.Arguments = '"' + (Join-Path $PSScriptRoot 'bridge.cjs') + '"'
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $child = [System.Diagnostics.Process]::Start($start)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{email=$credentials.Email;key=$plainKey;launchToken=$launchToken} | ConvertTo-Json -Compress))
    $child.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    $child.StandardInput.BaseStream.Flush()
    [Array]::Clear($bytes, 0, $bytes.Length)
    $bytes = $null
    $child.StandardInput.Close()
    $plainKey = $null
    $credentials.Secret.Dispose()
    $credentials = $null
    Write-Host 'Clockodo wird verbunden ...'
    $startup = $child.StandardOutput.ReadLine() | ConvertFrom-Json
    if (-not $startup.ok) { throw 'Clockodo-Anmeldung fehlgeschlagen. E-Mail, Key und Verbindung pruefen.' }
    $planner = [Uri](Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../index.html')).Path
    $url = $planner.AbsoluteUri + '#clockodo=' + $startup.port + '.' + $startup.token
    # Prefer pairing the existing browser profile; opening the default browser is optional.
    Write-Host 'Clockodo bereit. Verbindung im DAYRIVO-Fenster kopieren.' -ForegroundColor Green
    if ($launchToken) { $child.WaitForExit() }
    else { Show-ClockodoSession $child ($startup.port.ToString()+'.'+$startup.token) $url }
    $url = $null
    $startup = $null
} catch {
    Write-Host 'Verbindung nicht gestartet. Bitte Eingaben, Node.js und Internetverbindung pruefen.' -ForegroundColor Yellow
    if ($launchToken) { [System.Windows.Forms.MessageBox]::Show('Clockodo konnte nicht starten. Bitte Zugangsdaten und Internetverbindung pruefen. Falls bereits eine andere DAYRIVO-Sitzung verbunden ist, diese zuerst trennen.', 'DAYRIVO - Clockodo') | Out-Null }
} finally {
    $plainKey = $null
    if ($credentials) { $credentials.Secret.Dispose() }
    if ($child) { if (-not $child.HasExited) { $child.Kill() }; $child.Dispose() }
}
