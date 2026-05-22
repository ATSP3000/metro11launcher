import { app, BrowserWindow, ipcMain, nativeImage, dialog } from 'electron';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { IpcChannels } from '../src/shared/ipc';
import type { LauncherConfig, PowerAction, UserInfo } from '../src/shared/ipc';
import { loadConfig, saveConfig } from './store';
import { listApps, addApp, removeApp } from './appRegistry';
import { launchApp, openAppLocation } from './appLauncher';
import { registerHotkey, unregisterAll } from './hotkeyManager';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    center: true,
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    title: 'Metro Launcher',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  const sendVisible = (visible: boolean) =>
    mainWindow?.webContents.send(IpcChannels.onVisibilityChange, visible);

  mainWindow.on('show', () => sendVisible(true));
  mainWindow.on('restore', () => sendVisible(true));
  mainWindow.on('hide', () => sendVisible(false));
  mainWindow.on('minimize', () => sendVisible(false));

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function toggleLauncher(): void {
  if (!mainWindow) return;
  if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    mainWindow.minimize();
  }
}

// ── IPC ─────────────────────────────────────────────────────────────────────

function registerIpc(): void {
  ipcMain.handle(IpcChannels.getApps, () => listApps());

  // Launch the app and leave the launcher window open.
  ipcMain.handle(IpcChannels.launchApp, (_e, appId: string) => launchApp(appId));

  ipcMain.handle(IpcChannels.openAppLocation, (_e, appId: string) => openAppLocation(appId));

  ipcMain.handle(IpcChannels.addCustomApp, async () => {
    const options: Electron.OpenDialogOptions = {
      title: 'Add an app',
      properties: ['openFile'],
      filters: [
        { name: 'Programs', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
        { name: 'All files', extensions: ['*'] }
      ]
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return null;
    return await addApp(result.filePaths[0]);
  });

  ipcMain.handle(IpcChannels.removeCustomApp, (_e, appId: string) => {
    removeApp(appId);
  });

  ipcMain.handle(IpcChannels.loadConfig, () => loadConfig());

  ipcMain.handle(IpcChannels.saveConfig, (_e, config: LauncherConfig) => {
    saveConfig(config);
  });

  ipcMain.handle(IpcChannels.getUserInfo, () => getUserInfo());

  ipcMain.handle(IpcChannels.powerAction, (_e, action: PowerAction) => runPowerAction(action));

  ipcMain.handle(IpcChannels.setLaunchAtStartup, (_e, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath });
    const config = loadConfig();
    saveConfig({ ...config, launchAtStartup: enabled });
  });

  ipcMain.handle(IpcChannels.setHotkey, (_e, accelerator: string) => {
    const result = registerHotkey(accelerator, toggleLauncher);
    if (result.ok) {
      const config = loadConfig();
      saveConfig({ ...config, hotkey: accelerator });
    }
    return result;
  });
}

async function getUserInfo(): Promise<UserInfo> {
  const username = os.userInfo().username || 'User';
  const avatar = await readUserAvatar();
  return { username, avatar };
}

async function readUserAvatar(): Promise<string | undefined> {
  if (process.platform !== 'win32') return undefined;
  // Windows caches account pictures here as a set of sized PNGs.
  const dir = path.join(
    process.env.APPDATA ?? '',
    '..',
    'Local',
    'Microsoft',
    'Windows',
    'AccountPictures'
  );
  try {
    const files = await fs.readdir(dir);
    const png = files.filter((f) => f.toLowerCase().endsWith('.png')).sort();
    if (png.length === 0) return undefined;
    const image = nativeImage.createFromPath(path.join(dir, png[png.length - 1]));
    return image.isEmpty() ? undefined : image.toDataURL();
  } catch {
    return undefined;
  }
}

function runPowerAction(action: PowerAction): Promise<{ ok: boolean; error?: string }> {
  const commands: Record<PowerAction, { cmd: string; args: string[] }> = {
    sleep: { cmd: 'rundll32.exe', args: ['powrprof.dll,SetSuspendState', '0,1,0'] },
    restart: { cmd: 'shutdown', args: ['/r', '/t', '0'] },
    shutdown: { cmd: 'shutdown', args: ['/s', '/t', '0'] },
    lock: { cmd: 'rundll32.exe', args: ['user32.dll,LockWorkStation'] },
    signout: { cmd: 'shutdown', args: ['/l'] }
  };

  const { cmd, args } = commands[action];
  return new Promise((resolve) => {
    execFile(cmd, args, (error) => {
      if (error) resolve({ ok: false, error: error.message });
      else resolve({ ok: true });
    });
  });
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

// Single-instance: a second launch just toggles the existing window.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => toggleLauncher());

  app.whenReady().then(() => {
    registerIpc();
    createWindow();

    const config = loadConfig();
    const result = registerHotkey(config.hotkey, toggleLauncher);
    if (!result.ok) console.warn('[hotkey]', result.error);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('will-quit', () => unregisterAll());

  // Closing the window exits the app (standard desktop behaviour).
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
