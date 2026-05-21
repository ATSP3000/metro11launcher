@echo off
REM Metro Launcher - build a Windows NSIS installer (.exe), no admin needed.
REM
REM electron-builder downloads a "winCodeSign" archive that contains macOS
REM symbolic links. Extracting those normally fails with:
REM   "Cannot create symbolic link : A required privilege is not held".
REM
REM Workaround: we extract that archive ourselves with the bundled 7-Zip,
REM SKIPPING the macOS files (we are on Windows and never need them). Once the
REM cache folder exists, electron-builder reuses it instead of re-extracting.
REM
REM If you just want a runnable app without an installer, use build-portable.bat
REM instead - it never downloads winCodeSign at all.

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
set "WCS=%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
set "SEVENZIP=%CD%\node_modules\7zip-bin\win\x64\7za.exe"

REM First attempt: prepare the cache if the archive is already downloaded.
call :prepare_wincodesign
echo Building installer...
call npm run package
if not errorlevel 1 goto success

REM The archive may have only just been downloaded on this run; prepare it
REM (now that it exists) and try once more.
echo.
echo Preparing signing-tool cache and retrying...
call :prepare_wincodesign
call npm run package
if not errorlevel 1 goto success

echo.
echo Build still failed. See the messages above.
echo Tip: build-portable.bat avoids this path entirely.
pause
exit /b 1

:success
echo.
echo Done. Look in the "release" folder for "Metro Launcher Setup *.exe".
pause
exit /b 0

REM ---------------------------------------------------------------------------
REM Extract any cached winCodeSign archive without the macOS symlink files.
:prepare_wincodesign
if not exist "%WCS%" goto :eof
if not exist "%SEVENZIP%" goto :eof
for %%F in ("%WCS%\*.7z") do (
  if not exist "%%~dpnF\windows-10" (
    echo   Extracting %%~nxF without macOS symlinks...
    "%SEVENZIP%" x "%%F" -o"%%~dpnF" -aoa -xr!darwin -xr!*.dylib >nul 2>&1
  )
)
goto :eof
