@echo off
REM Metro Launcher - one-click start (development).
REM Installs dependencies on first run, then launches the app with the
REM window shown immediately (dev mode). Use Win+Z to toggle it once running.

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js / npm was not found on your PATH.
  echo Install Node.js 18 or newer from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, this only happens once...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. See the messages above.
    pause
    exit /b 1
  )
)

echo Starting Metro Launcher...
call npm run dev
