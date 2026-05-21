import { useEffect, useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import type { UserInfo } from '../../shared/ipc';
import styles from './UserPanel.module.css';

export function UserPanel() {
  const [info, setInfo] = useState<UserInfo>({ username: 'User' });
  const open = useUiStore((s) => s.userPanelOpen);
  const toggle = useUiStore((s) => s.toggleUserPanel);

  useEffect(() => {
    let active = true;
    window.electronAPI.getUserInfo().then((u) => active && setInfo(u));
    return () => {
      active = false;
    };
  }, []);

  const initial = info.username.trim()[0]?.toUpperCase() ?? 'U';

  return (
    <div className={styles.root}>
      <button className={styles.trigger} onClick={() => toggle()} aria-label="User account">
        <span className={styles.name}>{info.username}</span>
        {info.avatar ? (
          <img className={styles.avatar} src={info.avatar} alt="" />
        ) : (
          <span className={styles.avatar}>{initial}</span>
        )}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <button
            className={styles.item}
            onClick={() => {
              toggle(false);
              void window.electronAPI.powerAction('lock');
            }}
          >
            Lock
          </button>
          <button
            className={styles.item}
            onClick={() => {
              toggle(false);
              void window.electronAPI.powerAction('signout');
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
