export type AppSource = 'start-menu' | 'registry' | 'uwp';

export interface InstalledApp {
  /** Stable identifier derived from the launch target. */
  id: string;
  /** Display name shown to the user. */
  name: string;
  /** Where this app was discovered. */
  source: AppSource;
  /**
   * Launch target.
   * - start-menu / registry: absolute path to an .exe or .lnk
   * - uwp: the AppsFolder shell identifier (PackageFamilyName!AppId)
   */
  target: string;
  /** Optional explicit working directory for Win32 launches. */
  cwd?: string;
  /** base64 PNG data URL of the extracted icon, when available. */
  icon?: string;
}
