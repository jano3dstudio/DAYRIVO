$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '../clockodo/credential-dialog.ps1')
$dialog = New-ClockodoCredentialDialog 'test@example.com'
try {
    if (-not $dialog.Key.UseSystemPasswordChar -or -not $dialog.Key.ShortcutsEnabled) { throw 'Masking/paste disabled' }
    if ($dialog.Email.Text -ne 'test@example.com' -or $dialog.Form.ActiveControl -ne $dialog.Key) { throw 'Prefill/focus incorrect' }
    if ($dialog.Form.CancelButton -ne $dialog.Cancel -or $dialog.Form.AcceptButton -ne $dialog.Submit) { throw 'Keyboard actions incorrect' }
    $dialog.Key.Text = 'dummy-test-input'
    $dialog.Form.CreateControl()
    $bitmap = New-Object System.Drawing.Bitmap($dialog.Form.Width, $dialog.Form.Height)
    $dialog.Form.DrawToBitmap($bitmap, (New-Object System.Drawing.Rectangle(0,0,$bitmap.Width,$bitmap.Height)))
    # Hidden forms omit child controls in WM_PRINT; render each child for this offline preview.
    $offset = $dialog.Form.PointToScreen([System.Drawing.Point]::Empty)
    $origin = $dialog.Form.Location
    foreach ($control in $dialog.Form.Controls) {
        $bounds = New-Object System.Drawing.Rectangle(($control.Left + $offset.X - $origin.X), ($control.Top + $offset.Y - $origin.Y), $control.Width, $control.Height)
        $control.DrawToBitmap($bitmap, $bounds)
    }
    $artifacts = Join-Path $PSScriptRoot 'artifacts'
    [System.IO.Directory]::CreateDirectory($artifacts) | Out-Null
    $bitmap.Save((Join-Path $artifacts 'clockodo-credentials.png'))
    $bitmap.Dispose()
} finally { $dialog.Key.Clear(); $dialog.Form.Dispose() }

# Exercise acceptance and cancellation without showing a window or accessing the clipboard.
function New-ClockodoCredentialDialog {
    param([string]$InitialEmail)
    $script:fakeKey = [pscustomobject]@{Text=' dummy-test-input '}
    $script:fakeKey | Add-Member ScriptMethod Clear { $this.Text='' }
    $form = [pscustomobject]@{Result=$script:result; Disposed=$false}
    $form | Add-Member ScriptMethod ShowDialog { return $this.Result }
    $form | Add-Member ScriptMethod Dispose { $this.Disposed=$true }
    return @{Form=$form; Email=[pscustomobject]@{Text=$InitialEmail}; Key=$script:fakeKey}
}
$script:result = [System.Windows.Forms.DialogResult]::OK
$credentials = Get-ClockodoCredentials 'test@example.com'
if ($credentials.Email -ne 'test@example.com' -or $credentials.Secret.Length -ne 16 -or $script:fakeKey.Text -ne '') { throw 'Credential conversion/clearing failed' }
$credentials.Secret.Dispose()
$script:result = [System.Windows.Forms.DialogResult]::Cancel
if ($null -ne (Get-ClockodoCredentials 'test@example.com') -or $script:fakeKey.Text -ne '') { throw 'Cancel failed' }
Write-Output 'PASS: dialog properties, masking, paste shortcuts, focus, accept/cancel and field cleanup. No API requests.'
. (Join-Path $PSScriptRoot '../clockodo/session-dialog.ps1')
$session = New-ClockodoSessionDialog ([pscustomobject]@{HasExited=$false}) '1234.dummy-session' 'file:///dummy/index.html'
try {
    $session.Form.CreateControl()
    $bitmap = New-Object System.Drawing.Bitmap($session.Form.Width, $session.Form.Height)
    $session.Form.DrawToBitmap($bitmap, (New-Object System.Drawing.Rectangle(0,0,$bitmap.Width,$bitmap.Height)))
    $offset=$session.Form.PointToScreen([System.Drawing.Point]::Empty);$origin=$session.Form.Location
    foreach ($control in $session.Form.Controls) { $control.DrawToBitmap($bitmap, (New-Object System.Drawing.Rectangle(($control.Left+$offset.X-$origin.X),($control.Top+$offset.Y-$origin.Y),$control.Width,$control.Height))) }
    $bitmap.Save((Join-Path $artifacts 'clockodo-session.png'));$bitmap.Dispose()
} finally { $session.Timer.Dispose(); $session.Form.Dispose() }
