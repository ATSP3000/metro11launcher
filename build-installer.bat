@echo off
REM Metro Launcher - build a Windows installer (.exe).
REM Produces an NSIS setup executable in the "release" folder via
REM electron-builder. Run this once to create something you can install.

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
    echo npm install failed. See the messages above.
    pause
    exit /b 1
  )
)

echo Building installer...
call npm run package
if errorlevel 1 (
  echo.
  echo Build failed. See the messages above.
  pause
  exit /b 1
)

echo.
echo Done. Look in the "release" folder for "Metro Launcher Setup *.exe".
pause
