import path from 'path';
import { execFile } from 'child_process';
import { shell } from 'electron';
import type { InstalledApp } from '../src/types/app';
import { getAppById } from './appScanner';

export interface LaunchResult {
  ok: boolean;
  error?: string;
}

export async function launchApp(appId: string): Promise<LaunchResult> {
  const app = getAppById(appId);
  if (!app) return { ok: false, error: `Unknown app: ${appId}` };

  try {
    if (app.source === 'uwp') {
      return launchUwp(app);
    }
    // Preferred path for Win32 apps and shortcuts.
    const err = await shell.openPath(app.target);
    if (!err) return { ok: true };

    // Fallback for edge cases shell.openPath rejects (e.g. needs explicit cwd).
    return launchExecFile(app);
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
}

function launchUwp(app: InstalledApp): LaunchResult {
  // UWP apps launch through explorer.exe with the AppsFolder shell verb.
  execFile('explorer.exe', [app.target], (error) => {
    if (error) console.error('[launcher] UWP launch failed', app.target, error);
  });
  return { ok: true };
}

function launchExecFile(app: InstalledApp): Promise<LaunchResult> {
  return new Promise((resolve) => {
    execFile(
      app.target,
      [],
      { cwd: app.cwd ?? path.dirname(app.target) },
      (error) => {
        if (error) resolve({ ok: false, error: errMessage(error) });
        else resolve({ ok: true });
      }
    );
  });
}

export async function openAppLocation(appId: string): Promise<LaunchResult> {
  const app = getAppById(appId);
  if (!app) return { ok: false, error: `Unknown app: ${appId}` };
  if (app.source === 'uwp') {
    return { ok: false, error: 'UWP apps have no file location.' };
  }
  try {
    shell.showItemInFolder(app.target);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
