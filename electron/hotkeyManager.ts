import { globalShortcut } from 'electron';

export interface HotkeyResult {
  ok: boolean;
  error?: string;
}

let current: string | null = null;
let onTrigger: (() => void) | null = null;

/** Register (or re-register) the global toggle accelerator. */
export function registerHotkey(accelerator: string, trigger: () => void): HotkeyResult {
  onTrigger = trigger;
  unregisterHotkey();

  try {
    const ok = globalShortcut.register(accelerator, () => onTrigger?.());
    if (!ok) return { ok: false, error: `Accelerator "${accelerator}" is unavailable.` };
    current = accelerator;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function unregisterHotkey(): void {
  if (current) {
    globalShortcut.unregister(current);
    current = null;
  }
}

export function unregisterAll(): void {
  globalShortcut.unregisterAll();
  current = null;
}
