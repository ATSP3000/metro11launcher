import type { InstalledApp } from '../types/app';

/**
 * Renderer-side icon helper. Real extraction happens in the main process via
 * Electron's app.getFileIcon (see electron/appRegistry.ts); this fills the gap
 * for apps with no extracted icon by drawing a Metro-style letter glyph.
 */
export function iconForApp(app: Pick<InstalledApp, 'name' | 'icon'>): string {
  return app.icon ?? letterTile(app.name);
}

const cache = new Map<string, string>();

/** A flat colored square with the app's first initial — a data-URL SVG. */
export function letterTile(name: string): string {
  const letter = (name.trim()[0] ?? '?').toUpperCase();
  const cached = cache.get(letter);
  if (cached) return cached;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<rect width="96" height="96" fill="rgba(255,255,255,0.12)"/>` +
    `<text x="50%" y="50%" dy=".1em" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Segoe UI, sans-serif" font-size="48" fill="#ffffff">${escapeXml(letter)}</text>` +
    `</svg>`;
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(letter, url);
  return url;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      default: return '&quot;';
    }
  });
}
