@echo off
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 or newer from https://nodejs.org before starting the office.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<24) process.exit(1)"
if errorlevel 1 (
  echo This application needs Node.js 24 or newer.
  pause
  exit /b 1
)
echo Starting Outlaw Movers office on this computer, port 3000.
echo Keep this window open. Your private password will be in data\office-password.txt.
node server.js
pause
