import { create } from 'zustand';
import type { InstalledApp } from '../types/app';

/**
 * Canonical ids used by the seeded default layout map to real apps by name
 * keyword, since the scanner derives ids from install paths at runtime.
 */
const KNOWN_APP_MATCHERS: Record<string, string[]> = {
  'app:edge': ['microsoft edge', 'edge'],
  'app:settings': ['settings'],
  'app:explorer': ['file explorer', 'explorer'],
  'app:store': ['microsoft store', 'store'],
  'app:photos': ['photos'],
  'app:mail': ['mail'],
  'app:calendar': ['calendar'],
  'app:calculator': ['calculator'],
  'app:notepad': ['notepad'],
  'app:paint': ['paint']
};

interface AppsState {
  apps: InstalledApp[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  rescan: () => Promise<void>;
  getApp: (appId: string) => InstalledApp | undefined;
}

function resolve(apps: InstalledApp[], appId: string): InstalledApp | undefined {
  const direct = apps.find((a) => a.id === appId);
  if (direct) return direct;

  const matchers = KNOWN_APP_MATCHERS[appId];
  if (!matchers) return undefined;
  return apps.find((a) => {
    const name = a.name.toLowerCase();
    return matchers.some((m) => name === m || name.includes(m));
  });
}

export const useAppsStore = create<AppsState>((set, get) => ({
  apps: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const apps = await window.electronAPI.getInstalledApps();
      set({ apps, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  rescan: async () => {
    set({ loading: true, error: null });
    try {
      const apps = await window.electronAPI.rescanApps();
      set({ apps, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  getApp: (appId) => resolve(get().apps, appId)
}));
