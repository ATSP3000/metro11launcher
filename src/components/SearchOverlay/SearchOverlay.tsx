import { useEffect, useRef } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useAppSearch } from '../../hooks/useAppSearch';
import { iconForApp } from '../../utils/iconExtractor';
import { colorForKey } from '../../utils/tileColors';
import { launchApp } from '../../utils/launch';

import styles from './SearchOverlay.module.css';

export function SearchOverlay() {
  const query = useUiStore((s) => s.searchQuery);
  const setQuery = useUiStore((s) => s.setSearchQuery);
  const close = useUiStore((s) => s.closeSearch);
  const results = useAppSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const launchAndClose = (appId: string) => {
    void launchApp(appId);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Enter' && results[0]) {
      e.preventDefault();
      launchAndClose(results[0].id);
    }
  };

  return (
    <div className={styles.root}>
      <input
        ref={inputRef}
        className={styles.input}
        value={query}
        placeholder="Search"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Search apps"
      />

      {query.trim() === '' ? null : results.length === 0 ? (
        <div className={styles.empty}>No apps match &ldquo;{query}&rdquo;</div>
      ) : (
        <div className={styles.results}>
          {results.map((app, i) => (
            <button
              key={app.id}
              className={`${styles.resultTile} ${i === 0 ? styles.active : ''}`}
              style={{ background: colorForKey(app.id) }}
              onClick={() => launchAndClose(app.id)}
            >
              <img src={iconForApp(app)} alt="" />
              <span className={styles.resultLabel}>{app.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
