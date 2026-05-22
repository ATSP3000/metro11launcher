import { useMemo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useTilesStore } from '../../store/tilesStore';
import { useAppsStore } from '../../store/appsStore';
import { useUiStore } from '../../store/uiStore';
import { useTileDrag } from '../../hooks/useTileDrag';
import { useSemanticZoom } from '../../hooks/useSemanticZoom';
import { useKeyboardNav, type NavItem } from '../../hooks/useKeyboardNav';
import { launchTile } from '../../utils/launch';
import { TileGroup } from './TileGroup';
import { TileGhost } from './Tile';
import { SemanticZoom } from './SemanticZoom';
import { UserPanel } from '../UserPanel/UserPanel';
import { PowerMenu } from '../PowerMenu/PowerMenu';
import styles from './StartScreen.module.css';

const GROUP_STRIDE = 100;

export function StartScreen() {
  const groups = useTilesStore((s) => s.groups);
  const tiles = useTilesStore((s) => s.tiles);
  const getApp = useAppsStore((s) => s.getApp);

  const visible = useUiStore((s) => s.visible);
  const semanticZoom = useUiStore((s) => s.semanticZoom);
  const view = useUiStore((s) => s.view);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const contextMenu = useUiStore((s) => s.contextMenu);
  const openSearch = useUiStore((s) => s.openSearch);
  const openContextMenu = useUiStore((s) => s.openContextMenu);
  const setView = useUiStore((s) => s.setView);
  const toggleSettings = useUiStore((s) => s.toggleSettings);

  const { sensors, activeTileId, handleDragStart, handleDragEnd } = useTileDrag();

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.order - b.order),
    [groups]
  );

  const navItems: NavItem[] = useMemo(() => {
    const orderById = new Map(sortedGroups.map((g, i) => [g.id, i]));
    return tiles.map((t) => ({
      id: t.id,
      x: (orderById.get(t.groupId) ?? 0) * GROUP_STRIDE + t.position.col,
      y: t.position.row
    }));
  }, [tiles, sortedGroups]);

  const overlayOpen = searchOpen || settingsOpen || !!contextMenu || semanticZoom;
  const navEnabled = visible && view === 'start' && !overlayOpen;

  useSemanticZoom(view === 'start' && !overlayOpen);

  const focusedTileId = useKeyboardNav({
    items: navItems,
    enabled: navEnabled,
    onLaunch: (tileId) => void launchTile(tileId),
    onType: (char) => openSearch(char),
    onEscape: () => {}
  });

  const activeTile = tiles.find((t) => t.id === activeTileId) ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <button
          className={styles.iconButton}
          aria-label="Search"
          onClick={() => openSearch()}
        >
          {'\u{1F50D}'}
        </button>
        <button
          className={styles.iconButton}
          aria-label="Settings"
          onClick={() => toggleSettings(true)}
        >
          {'⚙'}
        </button>
        <UserPanel />
      </div>

      {semanticZoom ? (
        <SemanticZoom groups={sortedGroups} tiles={tiles} />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.scroller}>
            <div className={`${styles.canvas} ${visible ? styles.entering : ''}`}>
              {sortedGroups.map((group) => (
                <TileGroup
                  key={group.id}
                  group={group}
                  tiles={tiles
                    .filter((t) => t.groupId === group.id)
                    .sort((a, b) => a.position.row - b.position.row || a.position.col - b.position.col)}
                  getApp={getApp}
                  focusedTileId={focusedTileId}
                  onLaunch={(tileId) => void launchTile(tileId)}
                  onContextMenu={(tileId, x, y) => openContextMenu({ tileId, x, y })}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTile ? (
              <TileGhost tile={activeTile} app={getApp(activeTile.appId)} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {tiles.length === 0 && !semanticZoom && (
        <button className={styles.emptyState} onClick={() => setView('allApps')}>
          <span className={styles.emptyTitle}>Your Start screen is empty</span>
          <span className={styles.emptyHint}>Go to All apps to add and pin your apps</span>
        </button>
      )}

      <div className={styles.allAppsHint}>
        <button aria-label="All apps" onClick={() => setView('allApps')}>
          {'↓'}
        </button>
        <span>All apps</span>
      </div>

      <div className={styles.bottomBar}>
        <PowerMenu />
      </div>
    </div>
  );
}
