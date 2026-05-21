import type { InstalledApp } from '../types/app';
import type { Tile, TileGroup } from '../types/tile';

/** Persisted launcher configuration (electron-store schema). */
export interface LauncherConfig {
  groups: TileGroup[];
  tiles: Tile[];
  accentColor: string;
  backgroundColor: string;
  liveTilesEnabled: boolean;
  launchAtStartup: boolean;
  hotkey: string;
  lastUpdated: number;
}

export interface UserInfo {
  username: string;
  avatar?: string; // base64 PNG data URL
}

export type PowerAction = 'sleep' | 'restart' | 'shutdown' | 'lock' | 'signout';

/** Channel names shared between main and preload. */
export const IpcChannels = {
  getInstalledApps: 'get-installed-apps',
  rescanApps: 'rescan-apps',
  launchApp: 'launch-app',
  openAppLocation: 'open-app-location',
  loadConfig: 'load-config',
  saveConfig: 'save-config',
  getUserInfo: 'get-user-info',
  powerAction: 'power-action',
  setLaunchAtStartup: 'set-launch-at-startup',
  setHotkey: 'set-hotkey',
  hideLauncher: 'hide-launcher',
  toggleLauncher: 'toggle-launcher',
  onVisibilityChange: 'visibility-change'
} as const;

/** The API surface exposed to the renderer via the context bridge. */
export interface ElectronAPI {
  getInstalledApps(): Promise<InstalledApp[]>;
  rescanApps(): Promise<InstalledApp[]>;
  launchApp(appId: string): Promise<{ ok: boolean; error?: string }>;
  openAppLocation(appId: string): Promise<{ ok: boolean; error?: string }>;
  loadConfig(): Promise<LauncherConfig>;
  saveConfig(config: LauncherConfig): Promise<void>;
  getUserInfo(): Promise<UserInfo>;
  powerAction(action: PowerAction): Promise<{ ok: boolean; error?: string }>;
  setLaunchAtStartup(enabled: boolean): Promise<void>;
  setHotkey(accelerator: string): Promise<{ ok: boolean; error?: string }>;
  hideLauncher(): void;
  onVisibilityChange(callback: (visible: boolean) => void): () => void;
}
