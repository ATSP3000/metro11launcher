import type { LauncherConfig } from '../shared/ipc';
import { useTilesStore } from './tilesStore';
import { useUiStore } from './uiStore';

export function buildConfig(): LauncherConfig {
  const tiles = useTilesStore.getState();
  const ui = useUiStore.getState();
  return {
    groups: tiles.groups,
    tiles: tiles.tiles,
    accentColor: ui.accentColor,
    backgroundColor: ui.backgroundColor,
    liveTilesEnabled: ui.liveTilesEnabled,
    launchAtStartup: ui.launchAtStartup,
    hotkey: ui.hotkey,
    lastUpdated: Date.now()
  };
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced write of the full config to disk. */
export function schedulePersist(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void window.electronAPI.saveConfig(buildConfig());
  }, 400);
}
