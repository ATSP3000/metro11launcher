import { useEffect, useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useAppsStore } from '../../store/appsStore';
import { useTilesStore } from '../../store/tilesStore';
import { METRO_PALETTE } from '../../utils/tileColors';
import styles from './Settings.module.css';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      <span className={styles.knob} />
    </button>
  );
}

export function Settings() {
  const accentColor = useUiStore((s) => s.accentColor);
  const backgroundColor = useUiStore((s) => s.backgroundColor);
  const liveTilesEnabled = useUiStore((s) => s.liveTilesEnabled);
  const launchAtStartup = useUiStore((s) => s.launchAtStartup);
  const hotkey = useUiStore((s) => s.hotkey);

  const setAccentColor = useUiStore((s) => s.setAccentColor);
  const setBackgroundColor = useUiStore((s) => s.setBackgroundColor);
  const setLiveTilesEnabled = useUiStore((s) => s.setLiveTilesEnabled);
  const setLaunchAtStartup = useUiStore((s) => s.setLaunchAtStartup);
  const setHotkey = useUiStore((s) => s.setHotkey);
  const close = useUiStore((s) => s.toggleSettings);

  const addCustom = useAppsStore((s) => s.addCustom);
  const pinApp = useTilesStore((s) => s.pinApp);

  const [hotkeyDraft, setHotkeyDraft] = useState(hotkey);
  useEffect(() => setHotkeyDraft(hotkey), [hotkey]);

  const handleAddApp = async () => {
    const app = await addCustom();
    if (app) pinApp(app.id);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Settings</span>
        <button className={styles.close} aria-label="Close settings" onClick={() => close(false)}>
          {'✕'}
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Background color</div>
        <div className={styles.row}>
          <span>Start screen background</span>
          <input
            className={styles.colorInput}
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Accent color</div>
        <div className={styles.swatches}>
          {METRO_PALETTE.map((c) => (
            <button
              key={c.hex}
              className={`${styles.swatch} ${accentColor === c.hex ? styles.active : ''}`}
              style={{ background: c.hex }}
              title={c.name}
              aria-label={c.name}
              onClick={() => setAccentColor(c.hex)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Tiles</div>
        <div className={styles.row}>
          <span>Animate live tiles</span>
          <Toggle on={liveTilesEnabled} onChange={setLiveTilesEnabled} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Startup</div>
        <div className={styles.row}>
          <span>Launch at Windows startup</span>
          <Toggle on={launchAtStartup} onChange={setLaunchAtStartup} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Hotkey</div>
        <div className={styles.row}>
          <span>Global trigger</span>
          <input
            className={styles.text}
            value={hotkeyDraft}
            onChange={(e) => setHotkeyDraft(e.target.value)}
            onBlur={() => hotkeyDraft.trim() && setHotkey(hotkeyDraft.trim())}
            aria-label="Hotkey accelerator"
          />
        </div>
        <div className={styles.hint}>Electron accelerator, e.g. Super+Z or Ctrl+Shift+Space</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Apps</div>
        <button className={styles.button} onClick={() => void handleAddApp()}>
          Add an app…
        </button>
        <div className={styles.hint}>Pick an .exe/.lnk to pin it to Start.</div>
      </div>
    </div>
  );
}
