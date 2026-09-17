function New-ClockodoSessionDialog($Child, [string]$Code, [string]$PlannerUrl) {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'DAYRIVO | Clockodo verbunden'
    $form.ClientSize = New-Object System.Drawing.Size(560, 290)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.AutoScaleMode = 'Dpi'
    $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
    $form.BackColor = [System.Drawing.ColorTranslator]::FromHtml('#151b1d')
    $form.ForeColor = [System.Drawing.ColorTranslator]::FromHtml('#e7ebee')
    $heading = New-Object System.Windows.Forms.Label
    $heading.Text = 'Clockodo ist bereit'
    $heading.Font = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
    $heading.SetBounds(24, 22, 512, 38)
    $help = New-Object System.Windows.Forms.Label
    $help.Text = 'Im bisherigen Planer: Settings > Clockodo > Verbindungscode einfuegen. So bleiben dein Browserprofil und deine Wochen erhalten.'
    $help.SetBounds(24, 72, 512, 55)
    $copy = New-Object System.Windows.Forms.Button
    $copy.Text = 'Verbindung kopieren'
    $copy.SetBounds(24, 139, 245, 42)
    $copy.BackColor = [System.Drawing.ColorTranslator]::FromHtml('#3cff91')
    $copy.ForeColor = [System.Drawing.Color]::Black
    $copy.FlatStyle = 'Flat'
    $copy.Add_Click({ [System.Windows.Forms.Clipboard]::SetText($Code); $copy.Text='Kopiert' }.GetNewClosure())
    $open = New-Object System.Windows.Forms.Button
    $open.Text = 'Im Standardbrowser oeffnen'
    $open.SetBounds(281, 139, 255, 42)
    $open.Add_Click({ Start-Process -FilePath $PlannerUrl }.GetNewClosure())
    $note = New-Object System.Windows.Forms.Label
    $note.Text = 'Dieses Fenster offen lassen. Schliessen trennt Clockodo. Die Sitzung endet nach maximal 4 Stunden.'
    $note.SetBounds(24, 201, 512, 58)
    $form.Controls.AddRange(@($heading,$help,$copy,$open,$note))
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 1000
    $timer.Add_Tick({ if ($Child.HasExited) { $form.Close() } }.GetNewClosure())
    return @{Form=$form; Timer=$timer}
}
function Show-ClockodoSession($Child, [string]$Code, [string]$PlannerUrl) {
    $dialog = New-ClockodoSessionDialog $Child $Code $PlannerUrl
    try { $dialog.Timer.Start(); $dialog.Form.ShowDialog() | Out-Null }
    finally { $dialog.Timer.Stop(); $dialog.Timer.Dispose(); $dialog.Form.Dispose() }
}
