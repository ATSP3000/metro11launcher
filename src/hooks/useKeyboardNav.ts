import { useCallback, useEffect, useState } from 'react';

export interface NavItem {
  id: string;
  /** Global x ordinate (group order * stride + column). */
  x: number;
  /** Row ordinate. */
  y: number;
}

type Direction = 'left' | 'right' | 'up' | 'down';

interface Options {
  items: NavItem[];
  enabled: boolean;
  onLaunch: (id: string) => void;
  onType: (char: string) => void;
  onEscape: () => void;
}

/** Arrow-key focus movement + Enter to launch + type-to-search. */
export function useKeyboardNav({ items, enabled, onLaunch, onType, onEscape }: Options): string | null {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const move = useCallback(
    (dir: Direction) => {
      if (items.length === 0) return;
      const current = items.find((i) => i.id === focusedId) ?? items[0];
      if (!focusedId) {
        setFocusedId(current.id);
        return;
      }
      const next = nearestInDirection(current, items, dir);
      if (next) setFocusedId(next.id);
    },
    [items, focusedId]
  );

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); move('left'); return;
        case 'ArrowRight': e.preventDefault(); move('right'); return;
        case 'ArrowUp': e.preventDefault(); move('up'); return;
        case 'ArrowDown': e.preventDefault(); move('down'); return;
        case 'Enter':
          if (focusedId) { e.preventDefault(); onLaunch(focusedId); }
          return;
        case 'Escape':
          onEscape();
          return;
        default:
          // Single printable character with no modifiers → start searching.
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            onType(e.key);
          }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, focusedId, move, onLaunch, onType, onEscape]);

  return focusedId;
}

function nearestInDirection(from: NavItem, items: NavItem[], dir: Direction): NavItem | null {
  const candidates = items.filter((i) => {
    if (i.id === from.id) return false;
    switch (dir) {
      case 'left': return i.x < from.x;
      case 'right': return i.x > from.x;
      case 'up': return i.y < from.y;
      case 'down': return i.y > from.y;
    }
  });
  if (candidates.length === 0) return null;

  // Prefer the closest along the travel axis, then the closest off-axis.
  return candidates.reduce((best, i) => {
    const score = distanceScore(from, i, dir);
    const bestScore = distanceScore(from, best, dir);
    return score < bestScore ? i : best;
  });
}

function distanceScore(from: NavItem, to: NavItem, dir: Direction): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  // Weight the cross-axis so movement stays roughly in-line.
  return dir === 'left' || dir === 'right' ? dx + dy * 3 : dy + dx * 3;
}
