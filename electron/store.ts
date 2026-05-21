import Store from 'electron-store';
import type { LauncherConfig } from '../src/shared/ipc';
import type { Tile, TileGroup } from '../src/types/tile';

const DEFAULT_GROUPS: TileGroup[] = [
  { id: 'group-start', label: 'Start', order: 0 },
  { id: 'group-productivity', label: 'Productivity', order: 1 }
];

/**
 * Seed tiles reference well-known apps by id. The renderer resolves these
 * against the scanned app list; tiles whose appId is missing fall back to a
 * generic appearance rather than disappearing.
 */
const DEFAULT_TILES: Tile[] = [
  mkTile('tile-edge', 'app:edge', 'wide', '#1ba1e2', 'group-start', 0, 0, true),
  mkTile('tile-settings', 'app:settings', 'medium', '#647687', 'group-start', 4, 0),
  mkTile('tile-explorer', 'app:explorer', 'medium', '#fa6800', 'group-start', 0, 2),
  mkTile('tile-store', 'app:store', 'medium', '#008746', 'group-start', 2, 2),
  mkTile('tile-photos', 'app:photos', 'wide', '#aa00ff', 'group-start', 4, 2, true),
  mkTile('tile-mail', 'app:mail', 'medium', '#0050ef', 'group-productivity', 0, 0, true),
  mkTile('tile-calendar', 'app:calendar', 'medium', '#d80073', 'group-productivity', 2, 0, true),
  mkTile('tile-calc', 'app:calculator', 'small', '#6da400', 'group-productivity', 0, 2),
  mkTile('tile-notepad', 'app:notepad', 'small', '#e3c800', 'group-productivity', 1, 2),
  mkTile('tile-paint', 'app:paint', 'small', '#e51400', 'group-productivity', 0, 3),
  mkTile('tile-calculator2', 'app:calculator', 'small', '#00aba9', 'group-productivity', 1, 3)
];

function mkTile(
  id: string,
  appId: string,
  size: Tile['size'],
  color: string,
  groupId: string,
  col: number,
  row: number,
  liveEnabled = false
): Tile {
  return { id, appId, size, color, groupId, position: { col, row }, liveEnabled };
}

const defaults: LauncherConfig = {
  groups: DEFAULT_GROUPS,
  tiles: DEFAULT_TILES,
  accentColor: '#0078d4',
  backgroundColor: '#1d1d1d',
  liveTilesEnabled: true,
  launchAtStartup: false,
  hotkey: 'Super+Z',
  lastUpdated: 0
};

const configStore = new Store<{ config: LauncherConfig }>({
  name: 'metro-launcher',
  defaults: { config: defaults }
});

// Separate store for the icon cache so the (large) base64 payloads never bloat
// the config that gets read/written on every layout change.
const iconStore = new Store<{ icons: Record<string, string> }>({
  name: 'metro-launcher-icons',
  defaults: { icons: {} }
});

export function loadConfig(): LauncherConfig {
  return configStore.get('config');
}

export function saveConfig(config: LauncherConfig): void {
  configStore.set('config', { ...config, lastUpdated: Date.now() });
}

export function getCachedIcon(appId: string): string | undefined {
  return iconStore.get('icons')[appId];
}

export function setCachedIcon(appId: string, dataUrl: string): void {
  const icons = iconStore.get('icons');
  icons[appId] = dataUrl;
  iconStore.set('icons', icons);
}

export function clearIconCache(): void {
  iconStore.set('icons', {});
}
