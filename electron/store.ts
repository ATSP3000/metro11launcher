import Store from 'electron-store';
import type { LauncherConfig } from '../src/shared/ipc';
import type { TileGroup } from '../src/types/tile';
import type { InstalledApp } from '../src/types/app';

// Start empty: the user adds their own apps from the All Apps view.
const DEFAULT_GROUPS: TileGroup[] = [
  { id: 'group-start', label: 'Start', order: 0 },
  { id: 'group-apps', label: 'Apps', order: 1 }
];

const defaults: LauncherConfig = {
  groups: DEFAULT_GROUPS,
  tiles: [],
  accentColor: '#0078d4',
  backgroundColor: '#1d1d1d',
  launchAtStartup: false,
  hotkey: 'Super+Z',
  lastUpdated: 0
};

const configStore = new Store<{ config: LauncherConfig }>({
  name: 'metro-launcher',
  defaults: { config: defaults }
});

export function loadConfig(): LauncherConfig {
  const config = configStore.get('config');
  // Drop any tile whose app no longer exists (e.g. legacy seeded defaults from
  // before the auto-discovery scanner was removed). Keeps the layout honest:
  // a tile only exists if you can actually launch it.
  const appIds = new Set(getApps().map((a) => a.id));
  const tiles = config.tiles.filter((t) => appIds.has(t.appId));
  if (tiles.length !== config.tiles.length) {
    const cleaned = { ...config, tiles };
    configStore.set('config', cleaned);
    return cleaned;
  }
  return config;
}

export function saveConfig(config: LauncherConfig): void {
  configStore.set('config', { ...config, lastUpdated: Date.now() });
}

// User-added apps and their extracted icons live here.
const appStore = new Store<{ apps: InstalledApp[] }>({
  name: 'metro-launcher-apps',
  defaults: { apps: [] }
});

export function getApps(): InstalledApp[] {
  return appStore.get('apps');
}

export function addAppRecord(app: InstalledApp): void {
  const apps = appStore.get('apps').filter((a) => a.id !== app.id);
  apps.push(app);
  appStore.set('apps', apps);
}

export function removeAppRecord(appId: string): void {
  appStore.set(
    'apps',
    appStore.get('apps').filter((a) => a.id !== appId)
  );
}
