# Local Windows dialog; never put credentials in the planner or a browser.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

function New-ClockodoCredentialDialog([string]$InitialEmail = '') {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'DAYRIVO | Clockodo verbinden'
    $form.ClientSize = New-Object System.Drawing.Size(540, 355)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.AutoScaleMode = 'Dpi'
    $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
    $form.BackColor = [System.Drawing.ColorTranslator]::FromHtml('#151b1d')
    $form.ForeColor = [System.Drawing.ColorTranslator]::FromHtml('#e7ebee')

    $heading = New-Object System.Windows.Forms.Label
    $heading.Text = 'Clockodo verbinden'
    $heading.Font = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
    $heading.SetBounds(24, 18, 492, 38)
    $note = New-Object System.Windows.Forms.Label
    $note.Text = 'Lokaler Lesetest fuer Kunden und deren Projekte.'
    $note.SetBounds(24, 60, 492, 25)
    $emailLabel = New-Object System.Windows.Forms.Label
    $emailLabel.Text = 'Clockodo Benutzer-E-Mail'
    $emailLabel.SetBounds(24, 99, 492, 24)
    $email = New-Object System.Windows.Forms.TextBox
    $email.Text = $InitialEmail
    $email.SetBounds(24, 124, 492, 30)
    $email.TabIndex = 0
    $keyLabel = New-Object System.Windows.Forms.Label
    $keyLabel.Text = 'API-Key  |  Mit Strg+V einfuegen'
    $keyLabel.SetBounds(24, 170, 492, 24)
    $key = New-Object System.Windows.Forms.TextBox
    $key.UseSystemPasswordChar = $true
    $key.ShortcutsEnabled = $true
    $key.MaxLength = 512
    $key.SetBounds(24, 195, 492, 30)
    $key.TabIndex = 1
    foreach ($field in @($email, $key)) {
        $field.BackColor = [System.Drawing.ColorTranslator]::FromHtml('#0d1113')
        $field.ForeColor = $form.ForeColor
        $field.BorderStyle = 'FixedSingle'
    }
    $privacy = New-Object System.Windows.Forms.Label
    $privacy.Text = 'Der Key wird nicht gespeichert. Uebertragung nur an Clockodo.'
    $privacy.SetBounds(24, 238, 492, 38)
    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = 'Abbrechen'
    $cancel.SetBounds(224, 292, 130, 38)
    $cancel.DialogResult = 'Cancel'
    $cancel.TabIndex = 2
    $submit = New-Object System.Windows.Forms.Button
    $submit.Text = 'Kunden lesen'
    $submit.SetBounds(366, 292, 150, 38)
    $submit.BackColor = [System.Drawing.ColorTranslator]::FromHtml('#3cff91')
    $submit.ForeColor = [System.Drawing.Color]::Black
    $submit.FlatStyle = 'Flat'
    $submit.DialogResult = 'OK'
    $submit.TabIndex = 3
    $form.AcceptButton = $submit
    $form.CancelButton = $cancel
    $form.Controls.AddRange(@($heading,$note,$emailLabel,$email,$keyLabel,$key,$privacy,$cancel,$submit))
    $form.ActiveControl = if ($InitialEmail) { $key } else { $email }
    return @{Form=$form; Email=$email; Key=$key; Submit=$submit; Cancel=$cancel}
}

function Get-ClockodoCredentials([string]$InitialEmail = '') {
    $dialog = New-ClockodoCredentialDialog $InitialEmail
    try {
        if ($dialog.Form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { return $null }
        $emailValue = $dialog.Email.Text.Trim()
        $keyValue = $dialog.Key.Text.Trim()
        if (-not $emailValue -or -not $keyValue) { throw 'Bitte E-Mail und API-Key eingeben.' }
        return @{Email=$emailValue; Secret=(ConvertTo-SecureString $keyValue -AsPlainText -Force)}
    } finally {
        $keyValue = $null
        $dialog.Key.Clear()
        $dialog.Form.Dispose()
    }
}
