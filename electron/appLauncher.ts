import path from 'path';
import { execFile } from 'child_process';
import { shell } from 'electron';
import type { InstalledApp } from '../src/types/app';
import { getAppById } from './appRegistry';

export interface LaunchResult {
  ok: boolean;
  error?: string;
}

export async function launchApp(appId: string): Promise<LaunchResult> {
  const app = getAppById(appId);
  if (!app) return { ok: false, error: `Unknown app: ${appId}` };

  try {
    // Preferred path for executables and shortcuts.
    const err = await shell.openPath(app.target);
    if (!err) return { ok: true };

    // Fallback for edge cases shell.openPath rejects (e.g. needs explicit cwd).
    return launchExecFile(app);
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
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
