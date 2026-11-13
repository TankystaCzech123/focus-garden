import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOG, EXPANSIONS, buyPlots, buySeed, collectPassive, emptyGame, focusCoins, gardenBonus, growPlots, isGrown, itemById,
  migrateGame, nextExpansion, plantSeed, plotEmoji, rewardForStreak,
} from '../src/rules.ts';
import { COSMETICS, buyCosmetic, equip, isOwned, resolveLook } from '../src/cosmetics.ts';
import { dayKey } from '../src/days.ts';

const NOW = new Date(2026, 5, 15, 12).getTime();
const day = (n: number) => new Date(2026, 5, 15 + n, 12).getTime();

test('catalog ids are unique, plants have growth time and one bonus, decorations none', () => {
  assert.equal(new Set(CATALOG.map((i) => i.id)).size, CATALOG.length);
  const plants = CATALOG.filter((i) => i.minutes > 0);
  const decor = CATALOG.filter((i) => i.minutes === 0);
  assert.equal(plants.length, 10);
  assert.ok(decor.length >= 7);
  for (const p of plants) assert.equal(Object.keys(p.bonus ?? {}).length, 1, p.id);
  for (const d of decor) assert.equal(d.bonus, undefined, d.id);
  assert.equal(new Set(COSMETICS.map((c) => `${c.slot}:${c.id}`)).size, COSMETICS.length);
});

test('shop: buy a seed, plant it from stock, plot rules', () => {
  const g = { ...emptyGame(), coins: 60 };
  assert.equal(buySeed(g, 'tree'), null); // too expensive
  const bought = buySeed(g, 'tulip')!;
  assert.equal(bought.coins, 10);
  assert.equal(bought.seeds.tulip, 1);
  assert.equal(plantSeed(g, 0, 'tulip'), null); // none in stock
  const planted = plantSeed(bought, 0, 'tulip')!;
  assert.deepEqual(planted.plots[0], { id: 'tulip', grown: 0 });
  assert.equal(planted.seeds.tulip, undefined);
  assert.equal(plantSeed({ ...planted, seeds: { rose: 1 } }, 0, 'rose'), null); // plot taken
  assert.equal(plantSeed(bought, 99, 'tulip'), null);
});

test('growth is driven by focus minutes and capped; decorations never grow', () => {
  let plots = plantSeed({ ...emptyGame(), seeds: { tulip: 1, bee: 1 } }, 0, 'tulip')!.plots;
  assert.equal(plotEmoji(plots[0]!), '🌱');
  plots = growPlots(plots, 15);
  assert.equal(plotEmoji(plots[0]!), '🌿');
  plots = growPlots(plots, 15);
  assert.equal(plotEmoji(plots[0]!), '🌷');
  assert.ok(isGrown(plots[0]!));
  assert.equal(growPlots(plots, 500)[0]!.grown, 30);
  assert.equal(growPlots(plots, -5)[0]!.grown, 30);
  const bee = plantSeed({ ...emptyGame(), seeds: { bee: 1 } }, 0, 'bee')!.plots;
  assert.equal(growPlots(bee, 100)[0]!.grown, 0);
});

test('coins from focus: 1 per 2 minutes, first 4 hours of the day', () => {
  assert.equal(focusCoins(0, 1), 0);
  assert.equal(focusCoins(0, 2), 1);
  assert.equal(focusCoins(1, 3), 1);
  assert.equal(focusCoins(0, 60), 30);
  assert.equal(focusCoins(230, 300), 5); // 115 -> 120, capped at 240 minutes
  assert.equal(focusCoins(240, 400), 0);
});

test('bonuses only come from fully grown plants', () => {
  const g = { ...emptyGame(), seeds: { tulip: 1, palm: 1, tree: 1 } };
  let x = plantSeed(plantSeed(plantSeed(g, 0, 'tulip')!, 1, 'palm')!, 2, 'tree')!;
  assert.deepEqual(gardenBonus(x.plots), { coins: 0, xp: 0, cubeRate: 0 });
  x = { ...x, plots: growPlots(x.plots, 30) }; // only the tulip is grown
  assert.deepEqual(gardenBonus(x.plots), { coins: 2, xp: 0, cubeRate: 0 });
  x = { ...x, plots: growPlots(x.plots, 1000) };
  const b = gardenBonus(x.plots);
  assert.equal(b.coins, 2);
  assert.equal(b.xp, 12);
  assert.ok(Math.abs(b.cubeRate - 1 / 7) < 1e-9);
});

test('passive payout: first call sets the date, then pays per day, max a week, even when idle', () => {
  const grown = (n: string) => ({ id: n, grown: itemById(n)!.minutes });
  let g = { ...emptyGame(), plots: [grown('tulip'), grown('cactus'), grown('palm'), ...emptyGame().plots.slice(3)] };
  let r = collectPassive(g, NOW);
  assert.equal(r.game.lastCollect, dayKey(NOW));
  assert.deepEqual(r.gained, { coins: 0, xp: 0, cubes: 0, days: 0 });
  g = r.game;
  assert.equal(collectPassive(g, NOW).gained.days, 0); // same day: nothing twice
  r = collectPassive(g, day(3));
  assert.deepEqual(r.gained, { coins: 6, xp: 12, cubes: 0, days: 3 });
  assert.equal(r.game.coins, 6);
  r = collectPassive(r.game, day(3 + 7));
  assert.equal(r.gained.days, 7);
  assert.equal(r.gained.cubes, 0 + Math.floor(3 / 7 + 7 / 7 + 1e-9) - 0);
  const far = collectPassive({ ...g, lastCollect: dayKey(day(-100)) }, NOW);
  assert.equal(far.gained.days, 7); // capped
  const back = collectPassive({ ...g, lastCollect: dayKey(day(5)) }, NOW); // clock moved back
  assert.equal(back.gained.days, 0);
  assert.equal(back.game.lastCollect, dayKey(day(5))); // date never moves backwards
});

test('ice cubes from the garden accumulate fractionally', () => {
  const palm = { id: 'palm', grown: 360 };
  let g = { ...emptyGame(), plots: [palm, ...emptyGame().plots.slice(1)], lastCollect: dayKey(day(-4)) };
  let r = collectPassive(g, NOW); // 4 days = 4/7 cube
  assert.equal(r.gained.cubes, 0);
  r = collectPassive({ ...r.game, lastCollect: dayKey(day(-3)) }, NOW); // +3/7 => 1 cube
  assert.equal(r.gained.cubes, 1);
  assert.ok(r.game.cubeAcc < 1e-6);
});

test('expansion adds plots step by step', () => {
  let g = { ...emptyGame(), coins: 10_000 };
  assert.equal(g.plots.length, 12);
  for (const e of EXPANSIONS) {
    assert.equal(nextExpansion(g)?.to, e.to);
    g = buyPlots(g)!;
    assert.equal(g.plots.length, e.to);
  }
  assert.equal(nextExpansion(g), null);
  assert.equal(buyPlots(g), null);
  assert.equal(buyPlots({ ...emptyGame(), coins: 399 }), null);
});

test('migration: old day-based growth becomes minutes and missing fields are filled', () => {
  const old = { coins: 5, cubes: 1, plots: [{ id: 'tulip', grown: 1 }, { id: 'tree', grown: 6 }, { id: 'bee', grown: 0 }, { id: 'ghost', grown: 3 }, ...Array(8).fill(null)] };
  const g = migrateGame(old as never);
  assert.equal(g.v, 2);
  assert.equal(g.plots[0]?.grown, 15); // 1 of 2 days of a 30-minute plant
  assert.equal(g.plots[1]?.grown, 600); // fully grown stays fully grown
  assert.deepEqual(g.plots[2], { id: 'bee', grown: 0 });
  assert.deepEqual(g.plots[3], { id: 'ghost', grown: 3 }); // unknown ids are kept, never deleted
  assert.deepEqual(g.seeds, {});
  assert.equal(g.look.avatar, 'smile');
  assert.equal(migrateGame(g).plots[0]?.grown, 15); // idempotent
  assert.equal(migrateGame({}).plots.length, 12);
});

test('cosmetics: buy, own, equip, fall back', () => {
  let g = { ...emptyGame(), coins: 500 };
  assert.equal(equip(g, 'avatar', 'dragon'), null); // not owned
  assert.ok(equip(g, 'avatar', 'smile')); // free items are always owned
  assert.equal(buyCosmetic({ ...g, coins: 10 }, 'hat', 'crown'), null);
  g = buyCosmetic(g, 'hat', 'cap')!;
  assert.equal(g.coins, 400);
  assert.equal(buyCosmetic(g, 'hat', 'cap'), null); // already owned
  assert.equal(equip(g, 'hat', 'cap')!.look.hat, 'cap');
  assert.equal(buyCosmetic(g, 'hat', 'nope'), null);
  assert.ok(isOwned(g, COSMETICS.find((c) => c.slot === 'hat' && c.id === 'cap')!));
  const look = resolveLook({ ...g.look, avatar: 'removed-id' });
  assert.equal(look.avatar.id, 'smile');
});

test('economy: first plant within 2 days, all plants within ~3 months at 60 min/day, passive stays below active', () => {
  // simulate a user who focuses 60 min/day and buys the cheapest affordable plant that gives coins first
  let g = emptyGame();
  let day0 = 0;
  const order = ['tulip', 'clover', 'sunflower', 'cactus', 'rose', 'sakura', 'hibiscus', 'palm', 'apple', 'tree'];
  let firstPlant = -1;
  let allBought = -1;
  const bought: string[] = [];
  let activeCoins = 0;
  let passiveCoins = 0;
  for (let d = 0; d < 400 && allBought < 0; d++) {
    const t = day(d);
    const pay = collectPassive(g, t);
    g = pay.game;
    passiveCoins += pay.gained.coins;
    const reward = rewardForStreak(d + 1);
    const earned = focusCoins(0, 60) + reward.coins;
    activeCoins += earned;
    g = { ...g, coins: g.coins + earned, plots: growPlots(g.plots, 60), cubes: g.cubes + reward.cubes };
    for (const id of order) {
      if (bought.includes(id)) continue;
      const next = buySeed(g, id);
      if (!next) break; // buy in order
      const free = next.plots.findIndex((p) => p === null);
      g = plantSeed(next, free, id)!;
      bought.push(id);
      if (firstPlant < 0) firstPlant = d;
    }
    if (bought.length === order.length) allBought = d;
    day0 = d;
  }
  assert.ok(firstPlant >= 0 && firstPlant <= 2, `first plant on day ${firstPlant}`);
  assert.ok(allBought > 40 && allBought < 130, `all plants on day ${allBought} (day0 ${day0})`);
  assert.ok(passiveCoins < activeCoins, 'passive income must stay below active income');
});

test('real load path: an OLD save is migrated (not mistaken for the new version)', async () => {
  const { loadGameFrom } = await import('../src/gameStore.ts');
  const store = new Map<string, string>();
  const kv = { getItem: async (k: string) => store.get(k) ?? null, setItem: async (k: string, v: string) => { store.set(k, v); }, removeItem: async (k: string) => { store.delete(k); } };
  store.set('focus.game', JSON.stringify({ coins: 40, cubes: 2, plots: [{ id: 'tree', grown: 6 }, { id: 'tulip', grown: 2 }, ...Array(10).fill(null)] }));
  const g = await loadGameFrom(kv);
  assert.equal(g.plots[0]?.grown, 600); // fully grown stays fully grown
  assert.equal(g.plots[1]?.grown, 30);
  assert.equal(g.coins, 40);
  assert.equal(g.v, 2);
  assert.equal((await loadGameFrom(kv)).plots[0]?.grown, 600); // loading again does not change anything
  store.set('focus.game', '{broken');
  assert.equal((await loadGameFrom(kv)).plots.length, 12); // corrupt save does not crash
  store.delete('focus.game');
  assert.equal((await loadGameFrom(kv)).coins, 0);
});

test('clock shifted back and forth cannot be used to collect the garden bonus repeatedly', () => {
  const g0 = { ...emptyGame(), plots: [{ id: 'tulip', grown: 30 }, ...emptyGame().plots.slice(1)], lastCollect: dayKey(NOW) };
  const a = collectPassive(g0, day(7)); // forward a week: paid once
  assert.equal(a.gained.coins, 14);
  const b = collectPassive(a.game, NOW); // back to today: nothing, date stays
  assert.equal(b.gained.coins, 0);
  assert.equal(b.game.lastCollect, dayKey(day(7)));
  const c = collectPassive(b.game, day(7)); // forward again: nothing more
  assert.equal(c.gained.coins, 0);
});

test('migration keeps plants with unknown ids', () => {
  const g = migrateGame({ plots: [{ id: 'future-plant', grown: 5 }, ...Array(11).fill(null)] } as never);
  assert.deepEqual(g.plots[0], { id: 'future-plant', grown: 5 });
});
