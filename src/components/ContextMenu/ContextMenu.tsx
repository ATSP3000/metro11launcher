import { useUiStore } from '../../store/uiStore';
import { useTilesStore } from '../../store/tilesStore';
import { useAppsStore } from '../../store/appsStore';
import type { TileSize } from '../../types/tile';
import styles from './ContextMenu.module.css';

const SIZES: { size: TileSize; label: string }[] = [
  { size: 'small', label: 'Small' },
  { size: 'medium', label: 'Medium' },
  { size: 'wide', label: 'Wide' },
  { size: 'large', label: 'Large' }
];

export function ContextMenu() {
  const menu = useUiStore((s) => s.contextMenu);
  const close = useUiStore((s) => s.closeContextMenu);
  const tiles = useTilesStore((s) => s.tiles);
  const resizeTile = useTilesStore((s) => s.resizeTile);
  const removeTile = useTilesStore((s) => s.removeTile);
  const toggleLive = useTilesStore((s) => s.toggleLive);
  const getApp = useAppsStore((s) => s.getApp);

  if (!menu) return null;
  const tile = tiles.find((t) => t.id === menu.tileId);
  if (!tile) return null;

  const app = getApp(tile.appId);
  const isUwp = app?.source === 'uwp';

  // Keep the menu on-screen near the click point.
  const left = Math.min(menu.x, window.innerWidth - 220);
  const top = Math.min(menu.y, window.innerHeight - 280);

  const act = (fn: () => void) => () => {
    fn();
    close();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={close} onContextMenu={(e) => { e.preventDefault(); close(); }} />
      <div className={styles.menu} style={{ left, top }} role="menu">
        <div className={styles.sectionLabel}>Resize</div>
        <div className={styles.sizeRow}>
          {SIZES.map(({ size, label }) => (
            <button
              key={size}
              className={`${styles.sizeButton} ${tile.size === size ? styles.active : ''}`}
              onClick={act(() => resizeTile(tile.id, size))}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.separator} />

        <button className={styles.item} onClick={act(() => toggleLive(tile.id))}>
          {tile.liveEnabled ? 'Turn live tile off' : 'Turn live tile on'}
        </button>
        <button
          className={styles.item}
          disabled={!app || isUwp}
          onClick={act(() => app && void window.electronAPI.openAppLocation(app.id))}
        >
          Open file location
        </button>

        <div className={styles.separator} />

        <button className={styles.item} onClick={act(() => removeTile(tile.id))}>
          Unpin from Start
        </button>
      </div>
    </>
  );
}
