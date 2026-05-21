import path from 'path';
import { app, shell } from 'electron';
import type { InstalledApp } from '../src/types/app';
import { getApps, addAppRecord, removeAppRecord } from './store';

/** All apps the user has added. */
export function listApps(): InstalledApp[] {
  return [...getApps()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getAppById(id: string): InstalledApp | undefined {
  return getApps().find((a) => a.id === id);
}

/**
 * Create an app from a user-selected file, extract its icon, and persist it.
 * Resolves .lnk shortcuts to their real target so launching works directly.
 */
export async function addApp(filePath: string): Promise<InstalledApp> {
  let target = filePath;
  let cwd = path.dirname(filePath);

  if (/\.lnk$/i.test(filePath)) {
    try {
      const link = shell.readShortcutLink(filePath);
      if (link.target) {
        target = link.target;
        cwd = path.dirname(link.target);
      }
    } catch {
      // Unreadable shortcut — fall back to launching the .lnk directly.
    }
  }

  const name = path.basename(filePath).replace(/\.(exe|lnk|bat|cmd)$/i, '');
  const appItem: InstalledApp = { id: slugId(target), name: name.trim(), source: 'custom', target, cwd };

  const icon = await extractIcon(target);
  if (icon) appItem.icon = icon;

  addAppRecord(appItem);
  return appItem;
}

export function removeApp(appId: string): void {
  removeAppRecord(appId);
}

async function extractIcon(target: string): Promise<string | undefined> {
  if (!/\.exe$/i.test(target)) return undefined;
  try {
    const image = await app.getFileIcon(target, { size: 'large' });
    return image.isEmpty() ? undefined : image.toDataURL();
  } catch {
    return undefined;
  }
}

function slugId(input: string): string {
  return (
    'app:' +
    input
      .toLowerCase()
      .replace(/[\\/]/g, '-')
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}
