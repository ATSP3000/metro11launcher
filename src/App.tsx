import { useEffect } from 'react';
import { useTilesStore } from './store/tilesStore';
import { useUiStore } from './store/uiStore';
import { useAppsStore } from './store/appsStore';
import { StartScreen } from './components/StartScreen/StartScreen';
import { AllApps } from './components/AllApps/AllApps';
import { SearchOverlay } from './components/SearchOverlay/SearchOverlay';
import { Settings } from './components/Settings/Settings';
import { ContextMenu } from './components/ContextMenu/ContextMenu';

export function App() {
  const hydrate = useTilesStore((s) => s.hydrate);
  const hydrateTheme = useUiStore((s) => s.hydrateTheme);
  const setVisible = useUiStore((s) => s.setVisible);
  const closeAllOverlays = useUiStore((s) => s.closeAllOverlays);
  const setView = useUiStore((s) => s.setView);
  const loadApps = useAppsStore((s) => s.load);

  const accentColor = useUiStore((s) => s.accentColor);
  const backgroundColor = useUiStore((s) => s.backgroundColor);
  const view = useUiStore((s) => s.view);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const contextMenu = useUiStore((s) => s.contextMenu);

  // Initial hydration from disk + app discovery.
  useEffect(() => {
    void loadApps();
    void window.electronAPI.loadConfig().then((config) => {
      hydrate(config.groups, config.tiles);
      hydrateTheme({
        accentColor: config.accentColor,
        backgroundColor: config.backgroundColor,
        liveTilesEnabled: config.liveTilesEnabled,
        launchAtStartup: config.launchAtStartup,
        hotkey: config.hotkey
      });
    });
  }, [hydrate, hydrateTheme, loadApps]);

  // Reflect theme into CSS custom properties.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--metro-bg', backgroundColor);
    root.style.setProperty('--metro-accent', accentColor);
  }, [accentColor, backgroundColor]);

  // React to the launcher being shown/hidden by the main process.
  useEffect(() => {
    return window.electronAPI.onVisibilityChange((visible) => {
      setVisible(visible);
      if (visible) {
        closeAllOverlays();
        setView('start');
      }
    });
  }, [setVisible, closeAllOverlays, setView]);

  return (
    <>
      <StartScreen />
      {view === 'allApps' && <AllApps />}
      {searchOpen && <SearchOverlay />}
      {settingsOpen && <Settings />}
      {contextMenu && <ContextMenu />}
    </>
  );
}
