@echo off
REM Metro Launcher - build a Windows installer (.exe).
REM
REM No administrator rights needed. We disable code-signing certificate
REM auto-discovery, so electron-builder never downloads its "winCodeSign"
REM tool. That download is the only thing that contained symbolic links and
REM caused: "Cannot create symbolic link : A required privilege is not held".

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

REM Do not sign, and do not look for a certificate (this is what avoids the
REM winCodeSign download and its symbolic links).
set CSC_IDENTITY_AUTO_DISCOVERY=false

REM Remove any partially-extracted signing tool from an earlier failed run.
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
  echo Clearing leftover code-signing cache...
  rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
)

echo Building installer (unsigned)...
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
