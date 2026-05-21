export interface InstalledApp {
  /** Stable identifier derived from the launch target. */
  id: string;
  /** Display name shown to the user. */
  name: string;
  /** Always 'custom' — every app is user-added. */
  source: 'custom';
  /** Absolute path to an .exe / .lnk / .bat / .cmd. */
  target: string;
  /** Working directory for the launch. */
  cwd?: string;
  /** base64 PNG data URL of the extracted icon, when available. */
  icon?: string;
}
