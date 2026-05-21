import { create } from 'zustand';
import type { Tile, TileGroup, TilePosition, TileSize } from '../types/tile';
import { collides, findFreeSlot, tileRect } from '../utils/tileGrid';
import { colorForKey } from '../utils/tileColors';
import { schedulePersist } from './persist';

interface TilesState {
  groups: TileGroup[];
  tiles: Tile[];

  hydrate: (groups: TileGroup[], tiles: Tile[]) => void;
  tilesByGroup: (groupId: string) => Tile[];
  isPinned: (appId: string) => boolean;

  moveTile: (tileId: string, groupId: string, position: TilePosition) => void;
  resizeTile: (tileId: string, size: TileSize) => void;
  removeTile: (tileId: string) => void;
  pinApp: (appId: string, groupId?: string) => void;
  unpinApp: (appId: string) => void;
  setTileColor: (tileId: string, color: string) => void;
  toggleLive: (tileId: string) => void;

  addGroup: (label: string) => string;
  renameGroup: (groupId: string, label: string) => void;
}

const sortedTiles = (tiles: Tile[], groupId: string): Tile[] =>
  tiles
    .filter((t) => t.groupId === groupId)
    .sort((a, b) => a.position.row - b.position.row || a.position.col - b.position.col);

function commit(
  set: (partial: Partial<TilesState>) => void,
  tiles: Tile[],
  groups?: TileGroup[]
): void {
  set(groups ? { tiles, groups } : { tiles });
  schedulePersist();
}

export const useTilesStore = create<TilesState>((set, get) => ({
  groups: [],
  tiles: [],

  hydrate: (groups, tiles) => set({ groups, tiles }),

  tilesByGroup: (groupId) => sortedTiles(get().tiles, groupId),

  isPinned: (appId) => get().tiles.some((t) => t.appId === appId),

  moveTile: (tileId, groupId, position) => {
    const tiles = get().tiles;
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return;

    const groupTiles = tiles.filter((t) => t.groupId === groupId && t.id !== tileId);
    const candidate = { ...tileRect({ ...tile, position }), col: position.col, row: position.row };
    const resolved = collides(candidate, groupTiles)
      ? findFreeSlot([...groupTiles], tile.size, tileId)
      : position;

    commit(
      set,
      tiles.map((t) => (t.id === tileId ? { ...t, groupId, position: resolved } : t))
    );
  },

  resizeTile: (tileId, size) => {
    const tiles = get().tiles;
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return;

    const others = tiles.filter((t) => t.groupId === tile.groupId && t.id !== tileId);
    const candidate = { col: tile.position.col, row: tile.position.row, ...sizeUnits(size) };
    const position = collides(candidate, others, tileId)
      ? findFreeSlot(others, size, tileId)
      : tile.position;

    commit(
      set,
      tiles.map((t) => (t.id === tileId ? { ...t, size, position } : t))
    );
  },

  removeTile: (tileId) => {
    commit(set, get().tiles.filter((t) => t.id !== tileId));
  },

  pinApp: (appId, groupId) => {
    const state = get();
    if (state.isPinned(appId)) return;

    const targetGroup =
      groupId ?? [...state.groups].sort((a, b) => a.order - b.order)[0]?.id ?? 'group-start';
    const groupTiles = state.tiles.filter((t) => t.groupId === targetGroup);
    const position = findFreeSlot(groupTiles, 'medium');

    const tile: Tile = {
      id: `tile-${appId}-${Date.now()}`,
      appId,
      size: 'medium',
      color: colorForKey(appId),
      groupId: targetGroup,
      position,
      liveEnabled: false
    };
    commit(set, [...state.tiles, tile]);
  },

  unpinApp: (appId) => {
    commit(set, get().tiles.filter((t) => t.appId !== appId));
  },

  setTileColor: (tileId, color) => {
    commit(set, get().tiles.map((t) => (t.id === tileId ? { ...t, color } : t)));
  },

  toggleLive: (tileId) => {
    commit(
      set,
      get().tiles.map((t) => (t.id === tileId ? { ...t, liveEnabled: !t.liveEnabled } : t))
    );
  },

  addGroup: (label) => {
    const groups = get().groups;
    const id = `group-${Date.now()}`;
    const order = groups.reduce((max, g) => Math.max(max, g.order), -1) + 1;
    set({ groups: [...groups, { id, label, order }] });
    schedulePersist();
    return id;
  },

  renameGroup: (groupId, label) => {
    set({ groups: get().groups.map((g) => (g.id === groupId ? { ...g, label } : g)) });
    schedulePersist();
  }
}));

function sizeUnits(size: TileSize): { cols: number; rows: number } {
  const { cols, rows } = tileRect({ size, position: { col: 0, row: 0 } });
  return { cols, rows };
}
