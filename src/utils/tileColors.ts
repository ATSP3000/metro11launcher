export interface MetroColor {
  name: string;
  hex: string;
}

/** The authentic Windows 8 Metro accent palette, in tile-picker order. */
export const METRO_PALETTE: MetroColor[] = [
  { name: 'Lime', hex: '#6da400' },
  { name: 'Green', hex: '#008a00' },
  { name: 'Emerald', hex: '#008746' },
  { name: 'Teal', hex: '#00aba9' },
  { name: 'Cyan', hex: '#1ba1e2' },
  { name: 'Cobalt', hex: '#0050ef' },
  { name: 'Indigo', hex: '#6a00ff' },
  { name: 'Violet', hex: '#aa00ff' },
  { name: 'Pink', hex: '#f472d0' },
  { name: 'Magenta', hex: '#d80073' },
  { name: 'Crimson', hex: '#a20025' },
  { name: 'Red', hex: '#e51400' },
  { name: 'Orange', hex: '#fa6800' },
  { name: 'Amber', hex: '#f0a30a' },
  { name: 'Yellow', hex: '#e3c800' },
  { name: 'Brown', hex: '#825a2c' },
  { name: 'Olive', hex: '#6d8764' },
  { name: 'Steel', hex: '#647687' },
  { name: 'Mauve', hex: '#76608a' },
  { name: 'Taupe', hex: '#87794e' }
];

const HEXES = METRO_PALETTE.map((c) => c.hex);

/** Deterministic color from a string so unconfigured tiles stay stable. */
export function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return HEXES[Math.abs(hash) % HEXES.length];
}
