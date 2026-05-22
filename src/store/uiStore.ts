import { create } from 'zustand';
import { schedulePersist } from './persist';

export type View = 'start' | 'allApps';

export interface ContextMenuState {
  tileId: string;
  x: number;
  y: number;
}

interface UiState {
  // View / navigation
  view: View;
  semanticZoom: boolean;
  visible: boolean;

  // Overlays
  searchOpen: boolean;
  searchQuery: string;
  settingsOpen: boolean;
  userPanelOpen: boolean;
  powerMenuOpen: boolean;
  contextMenu: ContextMenuState | null;

  // Theme / settings (persisted)
  accentColor: string;
  backgroundColor: string;
  launchAtStartup: boolean;
  hotkey: string;

  // Actions
  setView: (view: View) => void;
  setSemanticZoom: (on: boolean) => void;
  setVisible: (visible: boolean) => void;
  openSearch: (initial?: string) => void;
  setSearchQuery: (q: string) => void;
  closeSearch: () => void;
  toggleSettings: (open?: boolean) => void;
  toggleUserPanel: (open?: boolean) => void;
  togglePowerMenu: (open?: boolean) => void;
  openContextMenu: (menu: ContextMenuState) => void;
  closeContextMenu: () => void;
  closeAllOverlays: () => void;

  hydrateTheme: (theme: {
    accentColor: string;
    backgroundColor: string;
    launchAtStartup: boolean;
    hotkey: string;
  }) => void;
  setAccentColor: (hex: string) => void;
  setBackgroundColor: (hex: string) => void;
  setLaunchAtStartup: (on: boolean) => void;
  setHotkey: (accelerator: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  view: 'start',
  semanticZoom: false,
  visible: true,

  searchOpen: false,
  searchQuery: '',
  settingsOpen: false,
  userPanelOpen: false,
  powerMenuOpen: false,
  contextMenu: null,

  accentColor: '#0078d4',
  backgroundColor: '#1d1d1d',
  launchAtStartup: false,
  hotkey: 'Super+Z',

  setView: (view) => set({ view, semanticZoom: false }),
  setSemanticZoom: (semanticZoom) => set({ semanticZoom }),
  setVisible: (visible) => set({ visible }),

  openSearch: (initial = '') => set({ searchOpen: true, searchQuery: initial }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  closeSearch: () => set({ searchOpen: false, searchQuery: '' }),

  toggleSettings: (open) =>
    set((s) => ({ settingsOpen: open ?? !s.settingsOpen })),
  toggleUserPanel: (open) =>
    set((s) => ({ userPanelOpen: open ?? !s.userPanelOpen })),
  togglePowerMenu: (open) =>
    set((s) => ({ powerMenuOpen: open ?? !s.powerMenuOpen })),

  openContextMenu: (contextMenu) => set({ contextMenu }),
  closeContextMenu: () => set({ contextMenu: null }),

  closeAllOverlays: () =>
    set({
      searchOpen: false,
      searchQuery: '',
      settingsOpen: false,
      userPanelOpen: false,
      powerMenuOpen: false,
      contextMenu: null,
      semanticZoom: false
    }),

  hydrateTheme: (theme) => set({ ...theme }),

  setAccentColor: (accentColor) => {
    set({ accentColor });
    schedulePersist();
  },
  setBackgroundColor: (backgroundColor) => {
    set({ backgroundColor });
    schedulePersist();
  },
  setLaunchAtStartup: (launchAtStartup) => {
    set({ launchAtStartup });
    void window.electronAPI.setLaunchAtStartup(launchAtStartup);
  },
  setHotkey: (hotkey) => {
    set({ hotkey });
    void window.electronAPI.setHotkey(hotkey);
  }
}));
