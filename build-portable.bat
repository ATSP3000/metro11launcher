@echo off
REM Metro Launcher - build a portable app (no installer, no symlinks).
REM
REM This uses electron-builder's "--dir" mode, which packages a ready-to-run
REM app folder and never downloads the winCodeSign signing tool. That tool's
REM archive is the only thing that contains symbolic links, so this build can
REM never hit the "Cannot create symbolic link" error and needs no admin.
REM
REM Result: release\win-unpacked\Metro Launcher.exe  (just double-click it)

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

set CSC_IDENTITY_AUTO_DISCOVERY=false

echo Building portable app...
call npm run package:dir
if errorlevel 1 (
  echo.
  echo Build failed. See the messages above.
  pause
  exit /b 1
)

echo.
echo Done. Run:  release\win-unpacked\Metro Launcher.exe
pause
