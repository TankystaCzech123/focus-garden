import test from 'node:test';
import assert from 'node:assert/strict';
import { activity, badges, emptyGame, emptyStats, levelInfo, longestStreak, xp, dayKey } from '../src/rules.ts';

const day = (n: number) => dayKey(new Date(2026, 0, 10 + n, 12).getTime());
const NOW = new Date(2026, 0, 20, 12).getTime();

test('xp = minutes + 10 per done day', () => {
  const s = { ...emptyStats(), days: { [day(0)]: 20, [day(1)]: 5, [day(2)]: 0 } };
  assert.equal(xp(s), 25 + 20);
});

test('levels', () => {
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(49).level, 1);
  assert.equal(levelInfo(50).name, 'Klíček');
  assert.equal(levelInfo(50).next, 100);
  const max = levelInfo(99999);
  assert.equal(max.level, 10);
  assert.equal(max.next, 0);
  assert.equal(max.progress, 1);
});

test('longestStreak with gap and frozen day', () => {
  const s = { ...emptyStats(), days: { [day(0)]: 5, [day(1)]: 5, [day(3)]: 5, [day(4)]: 5, [day(5)]: 5 }, frozen: { [day(2)]: true as const } };
  assert.equal(longestStreak(s), 5);
  const t = { ...emptyStats(), days: { [day(0)]: 5, [day(1)]: 5, [day(3)]: 5 } };
  assert.equal(longestStreak(t), 2);
  assert.equal(longestStreak(emptyStats()), 0);
});

test('activity grid shape', () => {
  const a = activity({ ...emptyStats(), days: { [dayKey(NOW)]: 7 } }, NOW, 12);
  assert.equal(a.length, 12);
  assert.ok(a.every((c) => c.length === 7));
  const flat = a.flat();
  assert.equal(flat.find((c) => c.key === dayKey(NOW))?.minutes, 7);
  assert.ok(flat.some((c) => c.minutes === null) || new Date(NOW).getDay() === 0);
});

test('badges', () => {
  const none = badges(emptyStats(), emptyGame());
  assert.ok(none.every((b) => !b.earned));
  const s = { ...emptyStats(), days: { [day(0)]: 70, [day(1)]: 1, [day(2)]: 1 }, frozen: { [day(3)]: true as const } };
  const g = { ...emptyGame(), plots: [{ id: 'tree', grown: 600 }, ...emptyGame().plots.slice(1)] };
  const earned = badges(s, g).filter((b) => b.earned).map((b) => b.id);
  for (const id of ['first', 's3', 'h1', 'plant', 'tree', 'ice']) assert.ok(earned.includes(id), id);
  assert.ok(!earned.includes('s7'));
});
