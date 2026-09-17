@echo off
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0Register-DirectStart.ps1"
pause
