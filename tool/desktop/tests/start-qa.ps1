param([string]$ExePath,[string]$OutputPath)
$ErrorActionPreference='Stop'
if(-not $ExePath){$ExePath=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../dist/desktop/DAYRIVO.exe'))}
if(-not $OutputPath){$OutputPath=Join-Path $PSScriptRoot ('output/'+(Get-Date -Format yyyyMMdd-HHmmss))}
$OutputPath=[IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
$process=Start-Process -FilePath $ExePath -ArgumentList @('--self-test',('"'+$OutputPath+'"')) -WindowStyle Hidden -PassThru
[pscustomobject]@{pid=$process.Id;output=$OutputPath;exe=$ExePath} | ConvertTo-Json
