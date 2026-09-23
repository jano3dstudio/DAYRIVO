param([string]$OutputPath)
$ErrorActionPreference='Stop'
$appRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
if(-not $OutputPath){$OutputPath=Join-Path $appRoot 'tool/dist/desktop/DAYRIVO.exe'}
$OutputPath=[IO.Path]::GetFullPath($OutputPath)
$chromePin=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'kit/chrome-version.json') -Raw | ConvertFrom-Json
if((Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'kit/JanoWindow.cs')).Hash -ne $chromePin.sha256){throw 'Pinned window source differs: update its revision and run real mouse regression before delivery'}
$buildRoot=Join-Path $PSScriptRoot '.build'
$payload=Join-Path $buildRoot ('payload-'+[Guid]::NewGuid().ToString('N'))
$dependencies=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'dependencies.json') -Raw | ConvertFrom-Json
foreach($dependency in $dependencies.files){
 $dependencyPath=Join-Path $PSScriptRoot ('.deps/'+$dependency.file)
 if((Get-FileHash -LiteralPath $dependencyPath -Algorithm SHA256).Hash -ne $dependency.sha256){throw ('Dependency checksum mismatch: '+$dependency.file)}
}
New-Item -ItemType Directory -Force -Path $payload,(Join-Path $payload 'ui/tool/desktop'),(Join-Path $payload 'clockodo'),(Split-Path $OutputPath) | Out-Null
# Build from the shared, current app sources; never copy machine settings or user exports.
foreach($folder in @('js','css','locales','assets')){Copy-Item -LiteralPath (Join-Path $appRoot ('tool/'+$folder)) -Destination (Join-Path $payload 'ui/tool') -Recurse -Force}
$html=Get-Content -LiteralPath (Join-Path $appRoot 'index.html') -Raw
$html=$html.Replace('<head>','<head><script src="tool/desktop/desktop-bootstrap.js"></script>')
$html=$html.Replace('</body>','<script src="tool/desktop/desktop-texts.js"></script><script src="tool/desktop/desktop-ui.js"></script></body>')
[IO.File]::WriteAllText((Join-Path $payload 'ui/index.html'),$html,[Text.UTF8Encoding]::new($false))
foreach($file in @('desktop-bootstrap.js','desktop-texts.js','desktop-ui.js')){Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $payload 'ui/tool/desktop')}
foreach($file in @('bridge.cjs','client.cjs','billing.cjs')){Copy-Item -LiteralPath (Join-Path $appRoot ('tool/clockodo/'+$file)) -Destination (Join-Path $payload 'clockodo')}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'desktop-service.cjs') -Destination (Join-Path $payload 'clockodo')
foreach($file in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','LICENSE.txt','node.exe','NODE-LICENSE.txt')){Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('.deps/'+$file)) -Destination $payload}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath=Join-Path $buildRoot 'payload.zip'
if(Test-Path -LiteralPath $zipPath){Remove-Item -LiteralPath $zipPath}
[IO.Compression.ZipFile]::CreateFromDirectory($payload,$zipPath,[IO.Compression.CompressionLevel]::Optimal,$false)
# Canonical transparent multi-resolution icon; see jano-app-kit/APP_ICONS.md.
$iconPath=Join-Path $appRoot 'tool/assets/dayrivo.ico'
if(-not (Test-Path -LiteralPath $iconPath)){throw 'Canonical DAYRIVO icon missing.'}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$compileArgs=@('/nologo','/target:winexe','/platform:x64','/optimize+',('/out:'+$OutputPath),'/main:Jano.AppKit.DesktopStart','/reference:System.Drawing.dll','/reference:System.Windows.Forms.dll','/reference:System.Core.dll','/reference:System.Web.Extensions.dll','/reference:System.Net.Http.dll','/reference:System.IO.Compression.dll','/reference:System.IO.Compression.FileSystem.dll',('/win32icon:'+$iconPath),('/resource:'+$zipPath+',dayrivo.payload.zip'))
foreach($file in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll')){$compileArgs+=('/reference:'+(Join-Path $PSScriptRoot ('.deps/'+$file)))}
foreach($file in @('Desktop.cs','AppModule.cs','NativeStore.cs','kit/Tokens.cs','kit/Theme.cs','kit/JanoWindow.cs','tests/MouseWindowCheck.cs')){$compileArgs+=(Join-Path $PSScriptRoot $file)}
& $compiler @compileArgs
if($LASTEXITCODE -ne 0){throw 'DAYRIVO desktop build failed'}
Get-Item -LiteralPath $OutputPath | Select-Object FullName,Length
Get-FileHash -LiteralPath $OutputPath -Algorithm SHA256

$manifest=[ordered]@{contract='jano.workspace.v1';appId='dayrivo';name='DAYRIVO';entryPoint='Jano.Workspace.AppModule';sha256=(Get-FileHash -LiteralPath $OutputPath -Algorithm SHA256).Hash.ToLowerInvariant()}
[IO.File]::WriteAllText(($OutputPath+'.workspace.json'),($manifest|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
