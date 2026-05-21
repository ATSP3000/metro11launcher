import { create } from 'zustand';
import type { InstalledApp } from '../types/app';

interface AppsState {
  apps: InstalledApp[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addCustom: () => Promise<InstalledApp | null>;
  removeCustom: (appId: string) => Promise<void>;
  getApp: (appId: string) => InstalledApp | undefined;
}

export const useAppsStore = create<AppsState>((set, get) => ({
  apps: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const apps = await window.electronAPI.getApps();
      set({ apps, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  addCustom: async () => {
    const app = await window.electronAPI.addCustomApp();
    if (!app) return null;
    set((state) => ({
      apps: [...state.apps.filter((a) => a.id !== app.id), app].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    }));
    return app;
  },

  removeCustom: async (appId) => {
    await window.electronAPI.removeCustomApp(appId);
    set((state) => ({ apps: state.apps.filter((a) => a.id !== appId) }));
  },

  getApp: (appId) => get().apps.find((a) => a.id === appId)
}));
