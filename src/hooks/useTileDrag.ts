import { useState } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { useTilesStore } from '../store/tilesStore';
import { positionPx, pxToCell } from '../utils/tileGrid';

export const GROUP_DROPPABLE_PREFIX = 'group:';

/**
 * Wires dnd-kit sensors and drop resolution to the tiles store. A distance
 * activation constraint distinguishes a tap (launch) from a drag for both
 * touch and mouse, leaving press-and-hold free for the long-press menu.
 */
export function useTileDrag() {
  const [activeTileId, setActiveTileId] = useState<string | null>(null);
  const moveTile = useTilesStore((s) => s.moveTile);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveTileId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTileId(null);
    const { active, over, delta } = event;
    if (!over) return;

    const tileId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith(GROUP_DROPPABLE_PREFIX)) return;
    const targetGroupId = overId.slice(GROUP_DROPPABLE_PREFIX.length);

    const tile = useTilesStore.getState().tiles.find((t) => t.id === tileId);
    if (!tile) return;

    if (targetGroupId === tile.groupId) {
      // Same group: snap original pixel position + drag delta to the grid.
      const origin = positionPx(tile.position);
      const next = pxToCell(origin.left + delta.x, origin.top + delta.y);
      moveTile(tileId, targetGroupId, next);
    } else {
      // Cross-group: let the store find a free slot in the destination.
      moveTile(tileId, targetGroupId, { col: 0, row: 0 });
    }
  }

  return { sensors, activeTileId, handleDragStart, handleDragEnd };
}
