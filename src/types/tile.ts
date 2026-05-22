export type TileSize = 'small' | 'medium' | 'wide' | 'large';
// Grid units (1 unit = 1 small tile):
//   small  1×1
//   medium 2×2
//   wide   4×2
//   large  4×4

export interface TilePosition {
  col: number;
  row: number;
}

export interface Tile {
  id: string;
  appId: string; // References InstalledApp.id
  size: TileSize;
  color: string; // Metro accent color hex
  groupId: string;
  position: TilePosition;
  label?: string; // Override app name on tile
}

export interface TileGroup {
  id: string;
  label: string;
  order: number; // Left-to-right group order
}

/** Width/height of each tile size in grid units. */
export const TILE_UNITS: Record<TileSize, { cols: number; rows: number }> = {
  small: { cols: 1, rows: 1 },
  medium: { cols: 2, rows: 2 },
  wide: { cols: 4, rows: 2 },
  large: { cols: 4, rows: 4 }
};
