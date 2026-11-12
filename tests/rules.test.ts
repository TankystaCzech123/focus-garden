import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CATALOG, applyFreezes, dayKey, emptyGame, emptyStats, growPlots, plantItem, plotEmoji, rewardForStreak, streak, weekDays,
} from '../src/rules.ts';

// Wednesday 2026-11-11, noon. day(-1) is yesterday.
const now = new Date(2026, 10, 11, 12).getTime();
const day = (offset: number) => new Date(2026, 10, 11 + offset, 12).getTime();
const withDays = (offsets: number[]) => {
  const s = emptyStats();
  for (const o of offsets) s.days[dayKey(day(o))] = 5;
  return s;
};

test('a 7-day streak earns 50 coins and 4 ice cubes in total', () => {
  let coins = 0;
  let cubes = 0;
  for (let n = 1; n <= 7; n++) {
    const r = rewardForStreak(n);
    coins += r.coins;
    cubes += r.cubes;
  }
  assert.equal(coins, 50);
  assert.equal(cubes, 4);
});

test('day 21 gives 20 coins and 3 cubes (every 3rd and 7th day)', () => {
  assert.deepEqual(rewardForStreak(21), { coins: 20, cubes: 3 });
});

test('streak counts consecutive days', () => {
  assert.equal(streak(withDays([0, -1, -2]), now), 3);
  assert.equal(streak(withDays([-1, -2]), now), 2); // today not done yet
  assert.equal(streak(withDays([0, -2]), now), 1); // gap breaks it
  assert.equal(streak(emptyStats(), now), 0);
});

test('ice cubes cover missed days, one cube per day', () => {
  const r = applyFreezes(withDays([-3, -4]), 2, now);
  assert.equal(r.used, 2);
  assert.equal(r.cubes, 0);
  assert.equal(streak(r.stats, now), 2);
});

test('not enough cubes: nothing is spent and the streak breaks', () => {
  const r = applyFreezes(withDays([-3, -4]), 1, now);
  assert.equal(r.used, 0);
  assert.equal(r.cubes, 1);
  assert.equal(streak(r.stats, now), 0);
});

test('no gap or no streak: no cube is spent', () => {
  assert.equal(applyFreezes(withDays([-1]), 3, now).used, 0);
  assert.equal(applyFreezes(emptyStats(), 5, now).used, 0);
});

test('frozen days bridge to today without adding to the streak', () => {
  const s = applyFreezes(withDays([-3, -4]), 2, now).stats;
  s.days[dayKey(now)] = 3;
  assert.equal(streak(s, now), 3);
});

test('garden: buying, growing and capping a plant', () => {
  const g = { ...emptyGame(), coins: 30 };
  const planted = plantItem(g, 0, 'tulip');
  assert.ok(planted);
  assert.equal(planted.coins, 20);
  assert.equal(plantItem(planted, 0, 'rose'), null); // plot taken
  assert.equal(plantItem(g, 1, 'tree'), null); // too expensive

  let plots = planted.plots;
  assert.equal(plotEmoji(plots[0]!), '🌱');
  plots = growPlots(plots);
  assert.equal(plotEmoji(plots[0]!), '🌿');
  plots = growPlots(plots);
  assert.equal(plotEmoji(plots[0]!), '🌷');
  plots = growPlots(plots);
  assert.equal(plots[0]!.grown, 2); // capped at the growth time
});

test('catalog ids are unique and decorations never grow', () => {
  assert.equal(new Set(CATALOG.map((i) => i.id)).size, CATALOG.length);
  const g = plantItem({ ...emptyGame(), coins: 100 }, 0, 'bee')!;
  assert.equal(growPlots(g.plots)[0]!.grown, 0);
});

test('week row has 7 days and flags today', () => {
  const week = weekDays(withDays([0]), now);
  assert.equal(week.length, 7);
  assert.equal(week.filter((d) => d.today).length, 1);
  assert.equal(week.find((d) => d.today)?.done, true);
});
