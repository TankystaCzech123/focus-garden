import test from 'node:test';
import assert from 'node:assert/strict';
import { clearBackup, ensureBackup, loadBackup, type KV } from '../src/devBackup.ts';
import { emptyGame, emptyStats } from '../src/rules.ts';

const memory = (): KV & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: async (k) => map.get(k) ?? null,
    setItem: async (k, v) => { map.set(k, v); },
    removeItem: async (k) => { map.delete(k); },
  };
};
const real = { ...emptyStats(), days: { '2026-01-01': 25 }, sessions: 4 };
const realGame = { ...emptyGame(), coins: 77 };

test('backup stores the real data and returns it', async () => {
  const kv = memory();
  assert.equal(await loadBackup(kv), null);
  const b = await ensureBackup(kv, real, realGame, 123);
  assert.equal(b.savedAt, 123);
  assert.deepEqual((await loadBackup(kv))?.stats.days, { '2026-01-01': 25 });
  assert.equal((await loadBackup(kv))?.game.coins, 77);
});

test('a second unlock never overwrites the original backup with test data', async () => {
  const kv = memory();
  await ensureBackup(kv, real, realGame, 1);
  const tampered = { ...emptyStats(), days: { '2026-02-02': 999 } };
  const b = await ensureBackup(kv, tampered, { ...emptyGame(), coins: 1 }, 2);
  assert.equal(b.savedAt, 1);
  assert.equal((await loadBackup(kv))?.game.coins, 77);
});

test('clear removes it, corrupt data is ignored', async () => {
  const kv = memory();
  await ensureBackup(kv, real, realGame, 1);
  await clearBackup(kv);
  assert.equal(await loadBackup(kv), null);
  kv.map.set('focus.devBackup', '{not json');
  assert.equal(await loadBackup(kv), null);
  kv.map.set('focus.devBackup', '{"x":1}');
  assert.equal(await loadBackup(kv), null);
  kv.map.set('focus.devBackup', JSON.stringify({ stats: { days: {}, frozen: {} }, game: { coins: 1, cubes: 0, plots: 'x' }, savedAt: 1 }));
  assert.equal(await loadBackup(kv), null); // wrong shape would corrupt live data on restore
});
