import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useAppsStore } from '../store/appsStore';
import type { InstalledApp } from '../types/app';

const MAX_RESULTS = 20;

/** Fuzzy search over installed app names. */
export function useAppSearch(query: string): InstalledApp[] {
  const apps = useAppsStore((s) => s.apps);

  const fuse = useMemo(
    () => new Fuse(apps, { keys: ['name'], threshold: 0.4, ignoreLocation: true }),
    [apps]
  );

  return useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return fuse.search(q, { limit: MAX_RESULTS }).map((r) => r.item);
  }, [fuse, query]);
}
