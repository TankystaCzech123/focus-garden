// Safety copy of the real data while developer mode is on. Takes the key-value store as a parameter so it can be tested.
import type { Game, Stats } from './rules.ts';

export type KV = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
export type Backup = { stats: Stats; game: Game; savedAt: number };

const KEY = 'focus.devBackup';

export async function loadBackup(kv: KV): Promise<Backup | null> {
  const raw = await kv.getItem(KEY);
  if (!raw) return null;
  try {
    const b = JSON.parse(raw) as Backup;
    const ok =
      b && typeof b.stats?.days === 'object' && b.stats.days !== null && typeof b.stats.frozen === 'object' &&
      Array.isArray(b.game?.plots) && typeof b.game.coins === 'number' && typeof b.game.cubes === 'number';
    return ok ? b : null;
  } catch {
    return null;
  }
}

/**
 * Saves the current data as the backup, unless a backup already exists: the oldest copy is the real data,
 * so unlocking again (or restarting) must never overwrite it with test data.
 */
export async function ensureBackup(kv: KV, stats: Stats, game: Game, now: number): Promise<Backup> {
  const existing = await loadBackup(kv);
  if (existing) return existing;
  const b: Backup = { stats, game, savedAt: now };
  await kv.setItem(KEY, JSON.stringify(b));
  return b;
}

export const clearBackup = (kv: KV) => kv.removeItem(KEY);
