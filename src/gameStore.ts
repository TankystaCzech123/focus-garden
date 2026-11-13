// Loading the saved garden/game from raw storage. The stored JSON must reach migrateGame WITHOUT a default merged in
// first, otherwise an old save would inherit the new version number and skip the migration.
import type { KV } from './devBackup.ts';
import { migrateGame } from './garden.ts';
import type { Game } from './garden.ts';

export async function loadGameFrom(kv: KV, key = 'focus.game'): Promise<Game> {
  let raw: Partial<Game> = {};
  try {
    const text = await kv.getItem(key);
    const parsed = text ? JSON.parse(text) : null;
    if (parsed && typeof parsed === 'object') raw = parsed as Partial<Game>;
  } catch {
    /* corrupt save: start from an empty game rather than crash */
  }
  return migrateGame(raw);
}
