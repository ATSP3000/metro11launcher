@echo off
REM Metro Launcher - build a portable Windows app (no installer, no symlinks).
REM
REM Uses @electron/packager instead of electron-builder. The packager simply
REM copies Electron + this app into a folder and NEVER downloads the
REM "winCodeSign" tool, so it can never hit the "Cannot create symbolic link"
REM error and needs no administrator rights or Developer Mode.
REM
REM Result:  release\Metro Launcher-win32-x64\Metro Launcher.exe  (double-click)

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

REM Always run install so the packager tool is present (it was added recently).
REM --loglevel=error hides harmless deprecation warnings from deep dependencies.
echo Ensuring dependencies are installed...
call npm install --no-fund --no-audit --loglevel=error
if errorlevel 1 (
  echo npm install failed. Re-run without the quiet flags to see details:
  echo   npm install
  pause
  exit /b 1
)

echo Building portable app...
call npm run package:portable
if errorlevel 1 (
  echo.
  echo Build failed. See the messages above.
  pause
  exit /b 1
)

echo.
echo Done. Run:  release\Metro Launcher-win32-x64\Metro Launcher.exe
pause
