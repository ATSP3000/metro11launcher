import { useDroppable } from '@dnd-kit/core';
import type { Tile as TileModel, TileGroup as TileGroupModel } from '../../types/tile';
import type { InstalledApp } from '../../types/app';
import { GROUP_DROPPABLE_PREFIX } from '../../hooks/useTileDrag';
import { GRID_ROWS, groupColumns, unitsToPx } from '../../utils/tileGrid';
import { Tile } from './Tile';
import styles from './TileGroup.module.css';

interface TileGroupProps {
  group: TileGroupModel;
  tiles: TileModel[];
  getApp: (appId: string) => InstalledApp | undefined;
  focusedTileId: string | null;
  onLaunch: (tileId: string) => void;
  onContextMenu: (tileId: string, x: number, y: number) => void;
}

export function TileGroup({
  group,
  tiles,
  getApp,
  focusedTileId,
  onLaunch,
  onContextMenu
}: TileGroupProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `${GROUP_DROPPABLE_PREFIX}${group.id}` });

  // Reserve at least 4 columns so an empty group is still a drop target.
  const cols = Math.max(groupColumns(tiles), 4);
  const width = unitsToPx(cols);
  const height = unitsToPx(GRID_ROWS);

  return (
    <section className={styles.group} style={{ width }}>
      <h2 className={styles.label}>{group.label}</h2>
      <div
        ref={setNodeRef}
        className={`${styles.canvas} ${isOver ? styles.over : ''}`}
        style={{ width, height }}
      >
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            app={getApp(tile.appId)}
            focused={focusedTileId === tile.id}
            onLaunch={() => onLaunch(tile.id)}
            onContextMenu={(x, y) => onContextMenu(tile.id, x, y)}
          />
        ))}
      </div>
    </section>
  );
}
