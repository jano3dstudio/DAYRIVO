function Get-ClockodoLaunchToken([string]$LaunchUri) {
    if ($LaunchUri -cmatch '\Adayrivo-clockodo://connect/([a-f0-9]{64})/?\z') { return $Matches[1] }
    throw 'Ungueltiger DAYRIVO-Startlink.'
}
