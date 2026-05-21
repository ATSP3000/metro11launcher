import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { app, shell } from 'electron';
import Winreg from 'winreg';
import type { InstalledApp, AppSource } from '../src/types/app';
import { getCachedIcon, setCachedIcon } from './store';

const execAsync = promisify(exec);

const isWindows = process.platform === 'win32';

/** Last scan result, kept so the launcher can resolve apps by id. */
let lastScan: InstalledApp[] = [];

export function getAppById(id: string): InstalledApp | undefined {
  return lastScan.find((a) => a.id === id);
}

/** Public entry: discover every launchable app on the system. */
export async function scan(): Promise<InstalledApp[]> {
  if (!isWindows) {
    lastScan = mockApps();
    return lastScan;
  }

  const results = await Promise.allSettled([scanStartMenu(), scanRegistry(), scanUwp()]);

  const apps: InstalledApp[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') apps.push(...r.value);
  }

  const deduped = dedupe(apps);
  await attachIcons(deduped);
  deduped.sort((a, b) => a.name.localeCompare(b.name));
  lastScan = deduped;
  return deduped;
}

// ── Start Menu ────────────────────────────────────────────────────────────

function startMenuRoots(): string[] {
  const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
  const programData = process.env.PROGRAMDATA ?? 'C:\\ProgramData';
  return [
    path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    path.join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs')
  ];
}

async function scanStartMenu(): Promise<InstalledApp[]> {
  const apps: InstalledApp[] = [];
  for (const root of startMenuRoots()) {
    try {
      const lnks = await walkForLnk(root);
      for (const lnk of lnks) {
        try {
          const { target } = shell.readShortcutLink(lnk);
          if (!target || !/\.exe$/i.test(target)) continue;
          const name = path.basename(lnk, '.lnk');
          apps.push(makeApp(name, target, 'start-menu', path.dirname(target)));
        } catch {
          // Unreadable shortcut — skip.
        }
      }
    } catch {
      // Root not present on this machine — skip.
    }
  }
  return apps;
}

async function walkForLnk(dir: string, depth = 0): Promise<string[]> {
  if (depth > 5) return [];
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkForLnk(full, depth + 1)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.lnk')) {
      out.push(full);
    }
  }
  return out;
}

// ── Registry (Uninstall keys) ───────────────────────────────────────────────

const UNINSTALL_KEYS: Array<{ hive: string; key: string }> = [
  { hive: Winreg.HKCU, key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },
  { hive: Winreg.HKLM, key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },
  { hive: Winreg.HKLM, key: '\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall' }
];

async function scanRegistry(): Promise<InstalledApp[]> {
  const apps: InstalledApp[] = [];
  for (const { hive, key } of UNINSTALL_KEYS) {
    try {
      const subkeys = await regKeys(hive, key);
      for (const sub of subkeys) {
        try {
          const values = await regValues(sub);
          const name = values.DisplayName;
          const icon = values.DisplayIcon;
          const install = values.InstallLocation;
          if (!name || values.SystemComponent === '1') continue;
          const target = resolveRegistryTarget(icon, install);
          if (!target) continue;
          apps.push(makeApp(name, target, 'registry', install || undefined));
        } catch {
          // Skip unreadable subkey.
        }
      }
    } catch {
      // Hive/key unavailable — skip.
    }
  }
  return apps;
}

function resolveRegistryTarget(displayIcon?: string, installLocation?: string): string | null {
  if (displayIcon) {
    // DisplayIcon is often "C:\path\app.exe,0" — strip the icon index.
    const cleaned = displayIcon.replace(/,\s*-?\d+\s*$/, '').replace(/^"|"$/g, '');
    if (/\.exe$/i.test(cleaned)) return cleaned;
  }
  if (installLocation) return installLocation;
  return null;
}

function regKeys(hive: string, key: string): Promise<Winreg.Registry[]> {
  return new Promise((resolve, reject) => {
    const reg = new Winreg({ hive, key });
    reg.keys((err, items) => (err ? reject(err) : resolve(items)));
  });
}

function regValues(reg: Winreg.Registry): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    reg.values((err, items) => {
      if (err) return reject(err);
      const out: Record<string, string> = {};
      for (const item of items) out[item.name] = item.value;
      resolve(out);
    });
  });
}

// ── UWP / Store apps ─────────────────────────────────────────────────────────

interface PowerShellAppx {
  Name: string;
  PackageFamilyName: string;
  InstallLocation: string;
}

async function scanUwp(): Promise<InstalledApp[]> {
  try {
    const cmd =
      'powershell -NoProfile -Command "Get-AppxPackage | Where-Object { -not $_.IsFramework } | ' +
      'Select-Object Name,PackageFamilyName,InstallLocation | ConvertTo-Json -Compress"';
    const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 16 });
    const parsed = JSON.parse(stdout) as PowerShellAppx | PowerShellAppx[];
    const list = Array.isArray(parsed) ? parsed : [parsed];

    const apps: InstalledApp[] = [];
    for (const pkg of list) {
      if (!pkg.PackageFamilyName) continue;
      const display = await readUwpManifestName(pkg.InstallLocation, pkg.Name);
      apps.push({
        id: slugId(pkg.Name),
        name: display,
        source: 'uwp',
        target: `shell:AppsFolder\\${pkg.PackageFamilyName}!App`
      });
    }
    return apps;
  } catch {
    return [];
  }
}

async function readUwpManifestName(installLocation: string, fallback: string): Promise<string> {
  try {
    const manifest = await fs.readFile(path.join(installLocation, 'AppxManifest.xml'), 'utf8');
    const match = manifest.match(/<DisplayName>([^<]+)<\/DisplayName>/);
    if (match && !match[1].startsWith('ms-resource')) return match[1];
  } catch {
    // No manifest / unreadable — fall back to package name.
  }
  return prettifyPackageName(fallback);
}

function prettifyPackageName(name: string): string {
  const tail = name.includes('.') ? name.split('.').pop()! : name;
  return tail.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// ── Icons ─────────────────────────────────────────────────────────────────────

async function attachIcons(apps: InstalledApp[]): Promise<void> {
  await Promise.all(
    apps.map(async (app) => {
      const cached = getCachedIcon(app.id);
      if (cached) {
        app.icon = cached;
        return;
      }
      const icon = await extractIcon(app);
      if (icon) {
        app.icon = icon;
        setCachedIcon(app.id, icon);
      }
    })
  );
}

async function extractIcon(installed: InstalledApp): Promise<string | undefined> {
  // UWP targets are shell identifiers, not file paths — icon comes from the
  // manifest assets, which is out of scope here.
  if (installed.source === 'uwp' || !/\.exe$/i.test(installed.target)) return undefined;
  try {
    const image = await app.getFileIcon(installed.target, { size: 'large' });
    if (image.isEmpty()) return undefined;
    return image.toDataURL();
  } catch {
    return undefined;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeApp(name: string, target: string, source: AppSource, cwd?: string): InstalledApp {
  return { id: slugId(target), name: name.trim(), source, target, cwd };
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

function dedupe(apps: InstalledApp[]): InstalledApp[] {
  const seen = new Map<string, InstalledApp>();
  for (const app of apps) {
    if (!app.name) continue;
    const existing = seen.get(app.id);
    // Prefer entries that carry an explicit .exe target.
    if (!existing || (!/\.exe$/i.test(existing.target) && /\.exe$/i.test(app.target))) {
      seen.set(app.id, app);
    }
  }
  return [...seen.values()];
}

/** Cross-platform placeholder set so the UI renders during development. */
function mockApps(): InstalledApp[] {
  const names = [
    'Microsoft Edge', 'Settings', 'File Explorer', 'Calculator', 'Mail',
    'Calendar', 'Photos', 'Notepad', 'Paint', 'Microsoft Store', 'Terminal',
    'Visual Studio Code', 'Spotify', 'Steam', 'Discord', 'Maps', 'Weather',
    'Camera', 'Clock', 'Music'
  ];
  return names.map((name) => ({
    id: slugId(name),
    name,
    source: 'start-menu' as AppSource,
    target: `C:\\Mock\\${name.replace(/\s+/g, '')}.exe`
  }));
}
