import { requireNativeModule } from 'expo';

export type AppInfo = { id: string; label: string; icon?: string };

type Native = {
  getInstalledApps(): Promise<AppInfo[]>;
  needsPicker(): boolean;
  pickApps(): Promise<number | null>;
  start(allowed: string[], dnd: boolean): Promise<{ fullKiosk: boolean; needsAccessibility: boolean }>;
  stop(): Promise<void>;
  launchApp(id: string): Promise<void>;
  isActive(): boolean;
  dndGranted(): boolean;
  openDndSettings(): Promise<void>;
  getDevLog(): Promise<string>;
  clearDevLog(): Promise<void>;
};

export default requireNativeModule<Native>('FocusNative');
