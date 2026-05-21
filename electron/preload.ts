import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../src/shared/ipc';
import type { ElectronAPI } from '../src/shared/ipc';

const api: ElectronAPI = {
  getInstalledApps: () => ipcRenderer.invoke(IpcChannels.getInstalledApps),
  rescanApps: () => ipcRenderer.invoke(IpcChannels.rescanApps),
  launchApp: (appId) => ipcRenderer.invoke(IpcChannels.launchApp, appId),
  openAppLocation: (appId) => ipcRenderer.invoke(IpcChannels.openAppLocation, appId),
  addCustomApp: () => ipcRenderer.invoke(IpcChannels.addCustomApp),
  removeCustomApp: (appId) => ipcRenderer.invoke(IpcChannels.removeCustomApp, appId),
  loadConfig: () => ipcRenderer.invoke(IpcChannels.loadConfig),
  saveConfig: (config) => ipcRenderer.invoke(IpcChannels.saveConfig, config),
  getUserInfo: () => ipcRenderer.invoke(IpcChannels.getUserInfo),
  powerAction: (action) => ipcRenderer.invoke(IpcChannels.powerAction, action),
  setLaunchAtStartup: (enabled) => ipcRenderer.invoke(IpcChannels.setLaunchAtStartup, enabled),
  setHotkey: (accelerator) => ipcRenderer.invoke(IpcChannels.setHotkey, accelerator),
  hideLauncher: () => ipcRenderer.send(IpcChannels.hideLauncher),
  onVisibilityChange: (callback) => {
    const listener = (_e: Electron.IpcRendererEvent, visible: boolean) => callback(visible);
    ipcRenderer.on(IpcChannels.onVisibilityChange, listener);
    return () => ipcRenderer.removeListener(IpcChannels.onVisibilityChange, listener);
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
