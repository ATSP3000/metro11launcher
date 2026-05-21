import { TILE_UNITS } from '../types/tile';
import type { Tile, TilePosition, TileSize } from '../types/tile';

/** Vertical extent of a group, measured in small-tile rows. */
export const GRID_ROWS = 6;

const UNIT = 80;
const GAP = 8;
const CELL = UNIT + GAP; // pitch between cell origins

export interface GridRect {
  col: number;
  row: number;
  cols: number;
  rows: number;
}

export function tileRect(tile: Pick<Tile, 'size' | 'position'>): GridRect {
  const { cols, rows } = TILE_UNITS[tile.size];
  return { col: tile.position.col, row: tile.position.row, cols, rows };
}

/** Pixel size of a tile of the given size. */
export function sizePx(size: TileSize): { width: number; height: number } {
  const { cols, rows } = TILE_UNITS[size];
  return { width: unitsToPx(cols), height: unitsToPx(rows) };
}

/** n grid units → pixels (n units + (n-1) gaps). */
export function unitsToPx(n: number): number {
  return n * UNIT + (n - 1) * GAP;
}

/** Top-left pixel offset of a cell position within its group. */
export function positionPx(position: TilePosition): { left: number; top: number } {
  return { left: position.col * CELL, top: position.row * CELL };
}

/** Snap an arbitrary pixel offset back to the nearest grid cell. */
export function pxToCell(left: number, top: number): TilePosition {
  return {
    col: Math.max(0, Math.round(left / CELL)),
    row: Math.max(0, Math.round(top / CELL))
  };
}

function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return (
    a.col < b.col + b.cols &&
    a.col + a.cols > b.col &&
    a.row < b.row + b.rows &&
    a.row + a.rows > b.row
  );
}

/** Does `candidate` collide with any tile in `tiles` (excluding `ignoreId`)? */
export function collides(candidate: GridRect, tiles: Tile[], ignoreId?: string): boolean {
  return tiles.some((t) => t.id !== ignoreId && rectsOverlap(candidate, tileRect(t)));
}

/** Width of a group in columns (max right edge of its tiles). */
export function groupColumns(tiles: Tile[]): number {
  return tiles.reduce((max, t) => {
    const r = tileRect(t);
    return Math.max(max, r.col + r.cols);
  }, 0);
}

/**
 * Find the first free top-to-bottom, left-to-right slot for a tile of `size`
 * within a group constrained to GRID_ROWS rows.
 */
export function findFreeSlot(tiles: Tile[], size: TileSize, ignoreId?: string): TilePosition {
  const { cols, rows } = TILE_UNITS[size];
  const maxCol = Math.max(groupColumns(tiles) + cols, cols);
  for (let col = 0; col <= maxCol; col++) {
    for (let row = 0; row + rows <= GRID_ROWS; row++) {
      const candidate: GridRect = { col, row, cols, rows };
      if (!collides(candidate, tiles, ignoreId)) return { col, row };
    }
  }
  return { col: maxCol, row: 0 };
}
