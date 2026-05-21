import { useUiStore } from '../../store/uiStore';
import type { Tile, TileGroup } from '../../types/tile';
import styles from './SemanticZoom.module.css';

interface SemanticZoomProps {
  groups: TileGroup[];
  tiles: Tile[];
}

export function SemanticZoom({ groups, tiles }: SemanticZoomProps) {
  const setSemanticZoom = useUiStore((s) => s.setSemanticZoom);

  return (
    <div className={styles.root}>
      {groups.map((group) => {
        const groupTiles = tiles.filter((t) => t.groupId === group.id);
        return (
          <button
            key={group.id}
            className={styles.block}
            onClick={() => setSemanticZoom(false)}
          >
            <div className={styles.mini}>
              {groupTiles.slice(0, 24).map((t) => (
                <span key={t.id} className={styles.miniTile} style={{ background: t.color }} />
              ))}
            </div>
            <div>
              <div className={styles.label}>{group.label}</div>
              <div className={styles.count}>
                {groupTiles.length} {groupTiles.length === 1 ? 'tile' : 'tiles'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
