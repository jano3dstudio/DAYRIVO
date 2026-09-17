@echo off
setlocal
powershell.exe -STA -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0Start-Clockodo.ps1"
echo.
pause
