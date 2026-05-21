import { useEffect, useMemo, useState } from 'react';
import { useAppsStore } from '../../store/appsStore';
import { useTilesStore } from '../../store/tilesStore';
import { useUiStore } from '../../store/uiStore';
import { iconForApp } from '../../utils/iconExtractor';
import { launchApp } from '../../utils/launch';
import type { InstalledApp } from '../../types/app';
import styles from './AllApps.module.css';

function sectionKey(name: string): string {
  const c = name.trim()[0]?.toUpperCase() ?? '#';
  return /[A-Z]/.test(c) ? c : '#';
}

export function AllApps() {
  const apps = useAppsStore((s) => s.apps);
  const isPinned = useTilesStore((s) => s.isPinned);
  const pinApp = useTilesStore((s) => s.pinApp);
  const unpinApp = useTilesStore((s) => s.unpinApp);
  const tiles = useTilesStore((s) => s.tiles); // re-render on pin changes
  const setView = useUiStore((s) => s.setView);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView('start');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setView]);

  const sections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = q ? apps.filter((a) => a.name.toLowerCase().includes(q)) : apps;
    const map = new Map<string, InstalledApp[]>();
    for (const app of [...filtered].sort((a, b) => a.name.localeCompare(b.name))) {
      const key = sectionKey(app.name);
      (map.get(key) ?? map.set(key, []).get(key)!).push(app);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [apps, filter]);

  const launchAndExit = (appId: string) => {
    void launchApp(appId);
    setView('start');
  };

  const jumpTo = (letter: string) => {
    document.getElementById(`section-${letter}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  // `tiles` referenced so pin-state buttons re-render after pin/unpin.
  void tiles;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.back} aria-label="Back" onClick={() => setView('start')}>
          {'←'}
        </button>
        <span className={styles.title}>All apps</span>
        <input
          className={styles.filter}
          placeholder="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter apps"
        />
      </div>

      <div className={styles.body}>
        <div className={styles.list}>
          {sections.map(([letter, group]) => (
            <div key={letter} id={`section-${letter}`} className={styles.section}>
              <div className={styles.sectionLetter}>{letter}</div>
              {group.map((app) => {
                const pinned = isPinned(app.id);
                return (
                  <button
                    key={app.id}
                    className={styles.row}
                    onClick={() => launchAndExit(app.id)}
                  >
                    <img className={styles.rowIcon} src={iconForApp(app)} alt="" />
                    <span className={styles.rowName}>{app.name}</span>
                    <span
                      className={`${styles.pin} ${pinned ? styles.pinned : ''}`}
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pinned ? unpinApp(app.id) : pinApp(app.id);
                      }}
                    >
                      {pinned ? 'Unpin' : 'Pin to Start'}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.index}>
          {sections.map(([letter]) => (
            <button key={letter} className={styles.indexLetter} onClick={() => jumpTo(letter)}>
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
