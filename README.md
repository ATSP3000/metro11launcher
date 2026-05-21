# Metro Launcher

A faithful Windows 8 Metro Start Screen recreation for Windows 11, built with
**Electron + React + TypeScript + Vite**.

> Target platform is Windows. The app builds and the Electron main process boots
> cross-platform; on non-Windows systems the app scanner returns a placeholder
> app set so the UI is still explorable during development.

## Features

- Full-screen, frameless, always-on-top launcher window (hidden until toggled)
- Global hotkey toggle (`Super+Z` by default, rebindable in Settings)
- App discovery from Start Menu shortcuts, the registry Uninstall keys, and UWP
  packages, with cached icon extraction
- Metro tile grid: four tile sizes, authentic palette, sharp corners, flat
  colors, live-tile flip animation, horizontal scrolling groups
- Drag-and-drop tile reorder with grid snapping (dnd-kit) and cross-group moves
- Long-press / right-click tile context menu (resize, live toggle, open
  location, unpin)
- Semantic zoom (ctrl+wheel / pinch) group overview
- All Apps view with alphabetical sections and a letter jump index
- Type-anywhere fuzzy search (fuse.js)
- User panel (lock / sign out) and power menu (sleep / restart / shut down)
- Settings: background & accent color, live-tile toggle, launch-at-startup,
  hotkey rebind, app rescan
- Layout and preferences persisted to disk via electron-store

## Project layout

```
electron/   Main process: window, IPC, app scanner, launcher, hotkeys, store
src/        React renderer: components, hooks, zustand stores, utils, styles
src/shared/ IPC contract shared between main and renderer
```

## Quick start (Windows)

- Double-click **`start.bat`** to install dependencies (first run only) and
  launch the app. The window shows immediately in dev mode; press `Super+Z`
  (Win+Z) to toggle it.
- Double-click **`build-portable.bat`** to produce a runnable
  `release\Metro Launcher-win32-x64\Metro Launcher.exe`. This uses
  `@electron/packager`, which copies Electron + the app into a folder. It never
  downloads a code-signing tool, so it cannot hit the "cannot create symbolic
  link" error and needs no administrator rights or Developer Mode. Output is
  unsigned.

## Scripts

```bash
npm install            # install dependencies
npm run dev            # start electron-vite dev (HMR)
npm run build          # production build to out/
npm run typecheck      # tsc for both main and renderer projects
npm run package:portable  # build + package a runnable Windows app folder
```

## Notes

- `electron-store` is pinned to the v8 (CommonJS) line because Electron 31's
  bundled Node cannot `require()` the pure-ESM v10 line.
- App launching prefers `shell.openPath`, falls back to `execFile`, and uses
  `explorer.exe shell:AppsFolder\…` for UWP apps.
- All `winreg` access is wrapped in try/catch since registry paths vary by
  machine.
