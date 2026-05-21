@echo off
REM Metro Launcher - build a Windows installer (.exe).
REM
REM This self-elevates to Administrator. electron-builder downloads a
REM code-signing tool (winCodeSign) whose archive contains symbolic links,
REM and Windows only allows creating symlinks from an elevated process (or
REM with Developer Mode enabled). Without that you get:
REM   "Cannot create symbolic link : A required privilege is not held..."

REM --- Self-elevate if we are not already running as administrator ---
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting administrator privileges...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

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

REM We are not code-signing, so stop electron-builder from auto-discovering certs.
set CSC_IDENTITY_AUTO_DISCOVERY=false

REM Remove any partially-extracted signing tool left by a previous failed run
REM so it re-extracts cleanly under the elevated process.
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
  echo Clearing cached code-signing tool...
  rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
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
