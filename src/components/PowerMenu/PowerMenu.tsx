import { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import type { PowerAction } from '../../shared/ipc';
import styles from './PowerMenu.module.css';

const ACTIONS: { action: PowerAction; label: string; confirm: boolean }[] = [
  { action: 'sleep', label: 'Sleep', confirm: false },
  { action: 'restart', label: 'Restart', confirm: true },
  { action: 'shutdown', label: 'Shut Down', confirm: true }
];

export function PowerMenu() {
  const open = useUiStore((s) => s.powerMenuOpen);
  const toggle = useUiStore((s) => s.togglePowerMenu);
  const [pending, setPending] = useState<{ action: PowerAction; label: string } | null>(null);

  const run = (action: PowerAction) => {
    toggle(false);
    setPending(null);
    void window.electronAPI.powerAction(action);
  };

  const choose = (action: PowerAction, label: string, confirm: boolean) => {
    if (confirm) setPending({ action, label });
    else run(action);
  };

  return (
    <div className={styles.root}>
      <button
        className={styles.trigger}
        aria-label="Power"
        onClick={() => {
          setPending(null);
          toggle();
        }}
      >
        {'⏻'}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {pending ? (
            <div className={styles.confirm}>
              {pending.label} now?
              <div className={styles.confirmRow}>
                <button onClick={() => setPending(null)}>Cancel</button>
                <button className={styles.primary} onClick={() => run(pending.action)}>
                  {pending.label}
                </button>
              </div>
            </div>
          ) : (
            ACTIONS.map(({ action, label, confirm }) => (
              <button
                key={action}
                className={styles.item}
                onClick={() => choose(action, label, confirm)}
              >
                {label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
