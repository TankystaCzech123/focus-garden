import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearBackup, ensureBackup, loadBackup } from './devBackup';
import { Game, Stats, emptyGame, emptyStats, dayKey } from './rules';

export const MAX_APPS = 5;

export function toggle(ids: string[], id: string, max = MAX_APPS): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return ids.length >= max ? ids : [...ids, id];
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback;
}
const setJson = <T>(key: string, v: T) => AsyncStorage.setItem(key, JSON.stringify(v)).then(() => v);

// allowed apps
export const loadAllowed = async (): Promise<string[] | null> => {
  const raw = await AsyncStorage.getItem('focus.allowed');
  return raw ? (JSON.parse(raw) as string[]) : null;
};
export const saveAllowed = (ids: string[]) => setJson('focus.allowed', ids);

// Do Not Disturb permission prompt shown once
export const dndAsked = async () => (await AsyncStorage.getItem('focus.dndAsked')) === '1';
export const setDndAsked = () => AsyncStorage.setItem('focus.dndAsked', '1');

// settings
export type Settings = {
  mode: 'system' | 'light' | 'dark';
  dnd: boolean;
  autoUpdate: boolean; // check GitHub for a new version on start
  notified: string; // last update version the user was told about
  nickname: string;
};
export const loadSettings = () => getJson<Settings>('focus.settings', { mode: 'system', dnd: true, autoUpdate: true, notified: '', nickname: 'Zahradník' });
export const saveSettings = (s: Settings) => setJson('focus.settings', s);

// stats (focus minutes per day, frozen days, running session)
export const loadStats = () => getJson<Stats>('focus.stats', emptyStats());
export const saveStats = (s: Stats) => setJson('focus.stats', s);

export async function startSession(now: number): Promise<Stats> {
  return saveStats({ ...(await loadStats()), startedAt: now });
}

/** Adds the finished session (rounded to minutes) to the day it ended. credit=false just clears it. */
export async function endSession(now: number, credit = true): Promise<Stats> {
  const s = await loadStats();
  const days = { ...s.days };
  let { sessions, bestSession } = s;
  if (credit && s.startedAt) {
    const k = dayKey(now);
    const mins = Math.round((now - s.startedAt) / 60_000);
    days[k] = (days[k] ?? 0) + mins;
    sessions += 1;
    bestSession = Math.max(bestSession, mins);
  }
  return saveStats({ ...s, days, sessions, bestSession, startedAt: null });
}

// developer mode (unlocked with the secret code, clock shifted by whole days)
export type Dev = { unlocked: boolean; offsetDays: number };
export const loadDev = () => getJson<Dev>('focus.dev', { unlocked: false, offsetDays: 0 });
export const saveDev = (d: Dev) => setJson('focus.dev', d);

// safety copy of the real data while developer mode is on
export const devBackup = {
  load: () => loadBackup(AsyncStorage),
  ensure: (stats: Stats, game: Game, now: number) => ensureBackup(AsyncStorage, stats, game, now),
  clear: () => clearBackup(AsyncStorage),
};

// game (coins, ice cubes, garden)
export const loadGame = () => getJson<Game>('focus.game', emptyGame());
export const saveGame = (g: Game) => setJson('focus.game', g);
