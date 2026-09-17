# Local credential entry. Nothing is saved or passed as a command-line argument.
$ErrorActionPreference = 'Stop'
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $OutputEncoding
$clockSecret = $null
$clockPlain = $null
$clockPointer = [IntPtr]::Zero
. (Join-Path $PSScriptRoot 'credential-dialog.ps1')

function Read-ClockodoPage([string]$kind, [int]$page, [long]$customerId = 0) {
    $payload = @{email=$clockEmail; key=$clockPlain; kind=$kind; page=$page; customerId=$customerId}
    try {
        $reply = $payload | ConvertTo-Json -Compress | & $clockNode.Source (Join-Path $PSScriptRoot 'client.cjs')
        $result = $reply | ConvertFrom-Json
        if (-not $result.ok) { throw $result.error }
        return $result
    } finally { $payload.key = $null; $payload = $null }
}

try {
    $clockNode = Get-Command node -ErrorAction SilentlyContinue
    if (-not $clockNode) { throw 'Node.js 22 oder neuer wird fuer diesen lokalen Test benoetigt.' }
    $version = & $clockNode.Source -p 'parseInt(process.versions.node)'
    if ([int]$version -lt 22) { throw 'Bitte Node.js 22 oder neuer verwenden.' }
    Write-Host "`nDAYRIVO - Clockodo Lesetest" -ForegroundColor Green
    Write-Host 'Liest Kunden und Projekte eines ausgewaehlten Kunden. Keine Zeiteintraege, kein Sync.'
    Write-Host 'E-Mail und Key gehen nur an https://my.clockodo.com und werden nicht gespeichert.'
    Write-Host 'Abbrechen: Strg+C. Den API-Key findest du in Clockodo unter Persoenliche Daten.'
    $initialEmail = ''
    $settingsPath = Join-Path $PSScriptRoot 'local-settings.json'
    if (Test-Path -LiteralPath $settingsPath) {
        $initialEmail = (Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json).email
    }
    $credentials = Get-ClockodoCredentials $initialEmail
    if (-not $credentials) { Write-Host 'Abgebrochen.'; return }
    $clockEmail = $credentials.Email
    $clockSecret = $credentials.Secret
    $credentials = $null
    $clockPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clockSecret)
    $clockPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($clockPointer)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($clockPointer)
    $clockPointer = [IntPtr]::Zero
    $page = 1
    $selected = $null
    do {
        $customers = Read-ClockodoPage 'customers' $page
        Write-Host "`nVerbindung erfolgreich. Kunden: Seite $page / $($customers.pages), insgesamt $($customers.total)." -ForegroundColor Green
        $customers.rows | Format-Table @{Label='ID';Expression={$_.id}}, @{Label='Kunde';Expression={$_.name}}, @{Label='Aktiv';Expression={$_.active}} -AutoSize
        if ($customers.total -eq 0) { break }
        $choice = Read-Host 'Kunden-ID dieser Seite fuer Projekte; N = weitere Seite; Enter = fertig'
        if ([string]::IsNullOrWhiteSpace($choice)) { break }
        if ($choice -eq 'N') {
            if ($page -lt $customers.pages) { $page++ } else { Write-Host 'Keine weitere Seite.' }
            continue
        }
        $selected = $customers.rows | Where-Object { [string]$_.id -eq $choice.Trim() } | Select-Object -First 1
        if (-not $selected) { Write-Host 'Bitte eine ID aus der angezeigten Liste waehlen.'; continue }
        $projectPage = 1
        do {
            $projects = Read-ClockodoPage 'projects' $projectPage $selected.id
            Write-Host "`nProjekte: $($selected.name), Seite $projectPage / $($projects.pages), insgesamt $($projects.total)." -ForegroundColor Green
            $projects.rows | Format-Table @{Label='ID';Expression={$_.id}}, @{Label='Projekt';Expression={$_.name}}, @{Label='Aktiv';Expression={$_.active}} -AutoSize
            if ($projectPage -ge $projects.pages) { break }
            $more = Read-Host 'N = weitere Projektseite; Enter = fertig'
            if ($more -ne 'N') { break }
            $projectPage++
        } while ($true)
    } while (-not $selected)
    Write-Host "`nLesetest beendet. Es wurden keine Daten veraendert oder lokal gespeichert." -ForegroundColor Green
} catch {
    # Our client returns only sanitised errors; do not print exception stacks or request objects.
    Write-Host ('Test nicht abgeschlossen: ' + $_.Exception.Message) -ForegroundColor Yellow
} finally {
    if ($clockPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($clockPointer) }
    $clockPlain = $null
    if ($clockSecret) { $clockSecret.Dispose() }
    $clockEmail = $null
}
