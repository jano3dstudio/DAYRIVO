@echo off
setlocal
powershell.exe -STA -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0Test-Clockodo.ps1"
echo.
pause
