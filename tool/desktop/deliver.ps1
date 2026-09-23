param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference='Stop'
$appRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$Destination=[IO.Path]::GetFullPath($Destination)
if(-not (Test-Path -LiteralPath (Join-Path $Destination '.git'))){throw 'Expected the existing DAYRIVO repository'}
$sourceModule=$PSScriptRoot
$targetModule=Join-Path $Destination 'tool/desktop'
foreach($file in Get-ChildItem -LiteralPath $sourceModule -Recurse -File){
 $relative=[IO.Path]::GetRelativePath($sourceModule,$file.FullName)
 if($relative -match '^\.build[\\/]|^tests[\\/]output[\\/]'){continue}
 $target=Join-Path $targetModule $relative
 New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
 Copy-Item -LiteralPath $file.FullName -Destination $target -Force
 if((Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath $target).Hash){throw ('Copy mismatch: '+$relative)}
}
$exeSource=Join-Path $appRoot 'tool/dist/desktop/DAYRIVO.exe'
$exeTarget=Join-Path $Destination 'DAYRIVO.exe'
if(Test-Path -LiteralPath $exeTarget){
 if((Get-FileHash -LiteralPath $exeSource).Hash -ne (Get-FileHash -LiteralPath $exeTarget).Hash){throw 'Existing executable requires a preserved prior version'}
}else{Copy-Item -LiteralPath $exeSource -Destination $exeTarget}
if((Get-FileHash -LiteralPath $exeSource).Hash -ne (Get-FileHash -LiteralPath $exeTarget).Hash){throw 'EXE checksum mismatch'}
$ignorePath=Join-Path $Destination '.gitignore'
$ignore=[IO.File]::ReadAllText($ignorePath)
if(-not $ignore.Contains('# Native desktop build and isolated test profiles')){
 $ignore+="`n# Native desktop build and isolated test profiles`n/DAYRIVO.exe`n/tool/desktop/.deps/`n/tool/desktop/.build/`n/tool/desktop/tests/output/`n"
 # FileMode.Open preserves hidden attributes; Create fails for hidden Git files on Windows.
 $stream=[IO.File]::Open($ignorePath,[IO.FileMode]::Open,[IO.FileAccess]::Write,[IO.FileShare]::Read)
 try{$bytes=[Text.UTF8Encoding]::new($false).GetBytes($ignore);$stream.SetLength(0);$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
}
$readmePath=Join-Path $Destination 'tool/README.md'
$readme=[IO.File]::ReadAllText($readmePath)
if(-not $readme.Contains('## Windows desktop app')){
 $readme+="`n## Windows desktop app`n`nStart DAYRIVO.exe in the project root. The existing UI now also runs in its own Windows window, with native file storage, backups and integrated Clockodo sign-in. Import your browser JSON backup on first start; browser and desktop storage do not sync automatically. See [desktop setup and build notes](desktop/README.md). This local desktop build does not publish or update the web edition.`n"
 [IO.File]::WriteAllText($readmePath,$readme,[Text.UTF8Encoding]::new($false))
}
$release=Join-Path $Destination 'tool/release/desktop'
New-Item -ItemType Directory -Path $release -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceModule 'START-DE.txt') -Destination (Join-Path $release 'START-DE.txt')
$manifestSource=$exeSource+'.workspace.json'
$manifestTarget=$exeTarget+'.workspace.json'
$manifest=Get-Content -LiteralPath $manifestSource -Raw | ConvertFrom-Json
if($manifest.sha256 -ne (Get-FileHash -LiteralPath $exeTarget -Algorithm SHA256).Hash){throw 'Workspace sidecar does not match EXE'}
Copy-Item -LiteralPath $manifestSource -Destination $manifestTarget -Force
Compress-Archive -LiteralPath $exeTarget,$manifestTarget,(Join-Path $release 'START-DE.txt'),(Join-Path $targetModule 'WORKSPACE.md') -DestinationPath (Join-Path $release 'DAYRIVO-Windows-x64.zip') -Force
[pscustomobject]@{exe=$exeTarget;sha256=(Get-FileHash $exeTarget).Hash;zip=(Join-Path $release 'DAYRIVO-Windows-x64.zip')} | ConvertTo-Json
