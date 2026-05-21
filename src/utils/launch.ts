import { useTilesStore } from '../store/tilesStore';
import { useAppsStore } from '../store/appsStore';

export interface LaunchOutcome {
  ok: boolean;
  error?: string;
}

/** Resolve a tile to its installed app and launch it. */
export async function launchTile(tileId: string): Promise<LaunchOutcome> {
  const tile = useTilesStore.getState().tiles.find((t) => t.id === tileId);
  if (!tile) return { ok: false, error: 'Tile not found' };
  return launchApp(tile.appId);
}

/** Launch by app id (canonical or scanned). */
export async function launchApp(appId: string): Promise<LaunchOutcome> {
  const app = useAppsStore.getState().getApp(appId);
  if (!app) return { ok: false, error: 'App not installed' };
  return window.electronAPI.launchApp(app.id);
}
