import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Tile as TileModel } from '../../types/tile';
import type { InstalledApp } from '../../types/app';
import { positionPx, sizePx } from '../../utils/tileGrid';
import { iconForApp } from '../../utils/iconExtractor';
import styles from './Tile.module.css';

const LONG_PRESS_MS = 450;

interface TileProps {
  tile: TileModel;
  app?: InstalledApp;
  focused: boolean;
  onLaunch: () => void;
  onContextMenu: (x: number, y: number) => void;
}

export function Tile({ tile, app, focused, onLaunch, onContextMenu }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tile.id });
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { left, top } = positionPx(tile.position);
  const { width, height } = sizePx(tile.size);
  const name = tile.label ?? app?.name ?? '';
  const icon = iconForApp({ name: name || '?', icon: app?.icon });

  const dragOffset = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined;

  const clearLongPress = () => {
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  const handlePointerDown = (e: ReactPointerEvent) => {
    const { clientX, clientY } = e;
    clearLongPress();
    longPress.current = setTimeout(() => onContextMenu(clientX, clientY), LONG_PRESS_MS);
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={[styles.tile, styles[tile.size], isDragging ? styles.dragging : '', focused ? styles.focused : '']
        .filter(Boolean)
        .join(' ')}
      style={{
        left,
        top,
        width,
        height,
        background: tile.color,
        transform: dragOffset
      }}
      aria-label={name || 'App'}
      onClick={() => !isDragging && onLaunch()}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={clearLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      {...attributes}
      {...listeners}
    >
      <span className={styles.face}>
        <img className={styles.icon} src={icon} alt="" draggable={false} />
      </span>
      <span className={styles.label}>{name}</span>
    </button>
  );
}

/** Static visual used inside the dnd-kit DragOverlay (no draggable registration). */
export function TileGhost({ tile, app }: { tile: TileModel; app?: InstalledApp }) {
  const { width, height } = sizePx(tile.size);
  const name = tile.label ?? app?.name ?? '';
  const icon = iconForApp({ name: name || '?', icon: app?.icon });
  return (
    <div
      className={`${styles.tile} ${styles[tile.size]} ${styles.dragging}`}
      style={{ position: 'relative', width, height, background: tile.color }}
    >
      <span className={styles.face}>
        <img className={styles.icon} src={icon} alt="" draggable={false} />
      </span>
      <span className={styles.label}>{name}</span>
    </div>
  );
}
