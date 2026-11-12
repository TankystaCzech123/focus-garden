import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256 } from '../src/sha256.ts';
import { DEV_CODE_HASH, normalizeCode, verifyDevCode } from '../src/devcode.ts';
import { shiftDays } from '../src/clock.ts';
import { addCoins, addCubes, addMinutes, addXp, clearGarden, growAll, setStreak } from '../src/dev.ts';
import { applyFreezes, dayKey, emptyGame, emptyStats, streak, xp } from '../src/rules.ts';

const NOW = new Date(2026, 5, 15, 12).getTime();

test('sha256 matches node:crypto', () => {
  for (const t of ['', 'abc', 'TPG8PCSS', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(200), 'ěščř 🌱'])
    assert.equal(sha256(t), createHash('sha256').update(t).digest('hex'), t.slice(0, 12));
});

test('dev code verification', () => {
  const code = 'AB12-CD34-EF56';
  const hash = createHash('sha256').update('AB12CD34EF56').digest('hex');
  assert.equal(normalizeCode(' ab12 cd34-ef56 '), 'AB12CD34EF56');
  assert.ok(verifyDevCode('AB12-CD34-EF56', hash));
  assert.ok(verifyDevCode('ab12cd34ef56', hash));
  assert.ok(!verifyDevCode('AB12-CD34-EF57', hash));
  assert.ok(!verifyDevCode('', hash));
  assert.ok(!verifyDevCode(code, DEV_CODE_HASH));
  assert.match(DEV_CODE_HASH, /^[0-9a-f]{64}$/);
});

test('shiftDays moves whole calendar days', () => {
  assert.equal(dayKey(shiftDays(NOW, 1)), '2026-06-16');
  assert.equal(dayKey(shiftDays(NOW, -15)), '2026-05-31');
  assert.equal(shiftDays(NOW, 0), NOW);
});

test('coins, cubes never negative', () => {
  assert.equal(addCoins(emptyGame(), 10).coins, 10);
  assert.equal(addCoins(emptyGame(), -5).coins, 0);
  assert.equal(addCubes({ ...emptyGame(), cubes: 2 }, -3).cubes, 0);
});

test('minutes: add, remove, floor at zero and drop empty day', () => {
  let s = addMinutes(emptyStats(), NOW, 30);
  assert.equal(s.days[dayKey(NOW)], 30);
  s = addMinutes(s, NOW, -10);
  assert.equal(s.days[dayKey(NOW)], 20);
  s = addMinutes(s, NOW, -999);
  assert.equal(dayKey(NOW) in s.days, false);
});

test('xp bonus adds and is clamped at zero; old stats without field still work', () => {
  const base = { ...emptyStats(), days: { [dayKey(NOW)]: 20 } }; // 20 + 10
  assert.equal(xp(addXp(base, 100)), 130);
  assert.equal(xp(addXp(base, -1000)), 0);
  const old = { days: base.days, frozen: {}, startedAt: null, sessions: 0, bestSession: 0 } as never;
  assert.equal(xp(old), 30);
});

test('setStreak gives exactly n days ending yesterday', () => {
  const messy = { ...emptyStats(), days: { [dayKey(shiftDays(NOW, -2))]: 5, [dayKey(shiftDays(NOW, -9))]: 5 }, frozen: { [dayKey(shiftDays(NOW, -3))]: true as const } };
  for (const n of [0, 1, 5, 12]) assert.equal(streak(setStreak(messy, n, NOW), NOW), n, `n=${n}`);
  const s = setStreak(emptyStats(), 3, NOW);
  assert.equal(dayKey(NOW) in s.days, false); // today untouched
  assert.equal(setStreak(messy, 4, NOW).days[dayKey(shiftDays(NOW, -2))], 5); // existing minutes kept
});

test('garden helpers', () => {
  const g = { ...emptyGame(), plots: [{ id: 'tree', grown: 1 }, { id: 'rabbit', grown: 0 }, ...emptyGame().plots.slice(2)] };
  const grown = growAll(g);
  assert.equal(grown.plots[0]?.grown, 6);
  assert.equal(grown.plots[1]?.grown, 0);
  assert.ok(clearGarden(grown).plots.every((p) => p === null));
});

test('ice cubes cannot bridge a streak that setStreak cut', () => {
  const old = { ...emptyStats(), days: { [dayKey(shiftDays(NOW, -9))]: 5 } };
  const s = setStreak(old, 3, NOW);
  const f = applyFreezes(s, 5, shiftDays(NOW, 1)); // next day, with cubes available
  assert.equal(streak(f.stats, shiftDays(NOW, 1)), 3 + f.used - f.used); // chain stays exactly 3 done days
  assert.equal(Object.keys(f.stats.frozen).filter((k) => k < dayKey(shiftDays(NOW, -3))).length, 0); // nothing frozen before the chain
  assert.equal(Object.keys(s.days).length, 3);
});
