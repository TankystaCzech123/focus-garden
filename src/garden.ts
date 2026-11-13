// Garden economy: shop catalog, growth from focus minutes, passive bonuses, expansion. Pure, no React / storage.
import { DEFAULT_LOOK } from './cosmetics.ts';
import type { Look } from './cosmetics.ts';
import { dayKey } from './days.ts';

export type Plot = { id: string; grown: number }; // grown = focus minutes
export type Game = {
  coins: number;
  cubes: number;
  plots: (Plot | null)[];
  seeds: Record<string, number>; // bought items waiting in stock
  owned: string[]; // bought cosmetics as "slot:id"
  look: Look;
  lastCollect: string; // day (yyyy-mm-dd) the garden bonus was last paid
  cubeAcc: number; // fractional ice cubes from the garden
  v: number; // data version
};
export type Bonus = { coins?: number; xp?: number; cubeEvery?: number };
export type Item = { id: string; name: string; price: number; minutes: number; stages: string[]; bonus?: Bonus };

export const PLOTS = 12;
export const GAME_VERSION = 3;
export const MINUTES_PER_COIN = 2; // 1 coin per 2 focused minutes ...
export const COIN_MINUTES_CAP = 240; // ... for the first 4 hours of a day
export const MAX_COLLECT_DAYS = 7; // the garden pays out for at most a week of absence

export const emptyGame = (): Game => ({
  coins: 0,
  cubes: 0,
  plots: Array(PLOTS).fill(null),
  seeds: {},
  owned: [],
  look: { ...DEFAULT_LOOK },
  lastCollect: '',
  cubeAcc: 0,
  v: GAME_VERSION,
});

/** minutes = focus time until fully grown; 0 = decoration. Bonuses are paid daily, only by fully grown plants. */
export const CATALOG: Item[] = [
  { id: 'tulip', name: 'Tulipán', price: 50, minutes: 30, stages: ['🌱', '🌿', '🌷'], bonus: { coins: 2 } },
  { id: 'clover', name: 'Jetel', price: 70, minutes: 45, stages: ['🌱', '🌿', '🍀'], bonus: { xp: 2 } },
  { id: 'sunflower', name: 'Slunečnice', price: 120, minutes: 90, stages: ['🌱', '🌿', '🌻'], bonus: { coins: 4 } },
  { id: 'cactus', name: 'Kaktus', price: 150, minutes: 120, stages: ['🌱', '🌿', '🌵'], bonus: { xp: 4 } },
  { id: 'rose', name: 'Růže', price: 260, minutes: 180, stages: ['🌱', '🌿', '🌹'], bonus: { coins: 7 } },
  { id: 'sakura', name: 'Sakura', price: 350, minutes: 240, stages: ['🌱', '🌿', '🌸'], bonus: { xp: 8 } },
  { id: 'hibiscus', name: 'Ibišek', price: 450, minutes: 300, stages: ['🌱', '🌿', '🌺'], bonus: { coins: 10 } },
  { id: 'palm', name: 'Palma', price: 550, minutes: 360, stages: ['🌱', '🌿', '🌴'], bonus: { cubeEvery: 7 } },
  { id: 'apple', name: 'Jabloň', price: 650, minutes: 480, stages: ['🌱', '🌿', '🍎'], bonus: { coins: 12 } },
  { id: 'tree', name: 'Strom', price: 900, minutes: 600, stages: ['🌱', '🌿', '🌳'], bonus: { xp: 12 } },
  // decorations (look only)
  { id: 'mushroom', name: 'Houba', price: 30, minutes: 0, stages: ['🍄'] },
  { id: 'bee', name: 'Včelka', price: 90, minutes: 0, stages: ['🐝'] },
  { id: 'butterfly', name: 'Motýl', price: 90, minutes: 0, stages: ['🦋'] },
  { id: 'rabbit', name: 'Zajíc', price: 140, minutes: 0, stages: ['🐇'] },
  { id: 'lantern', name: 'Lucerna', price: 180, minutes: 0, stages: ['🏮'] },
  { id: 'owl', name: 'Sova', price: 240, minutes: 0, stages: ['🦉'] },
  { id: 'fountain', name: 'Fontána', price: 300, minutes: 0, stages: ['⛲'] },
];
export const itemById = (id: string) => CATALOG.find((i) => i.id === id);
export const isPlant = (i: Item) => i.minutes > 0;

/** Czech description of what a plant pays per day when fully grown. */
export const bonusText = (i: Item) => {
  const b = i.bonus;
  if (!b) return 'ozdoba';
  return [b.coins ? `+${b.coins} 🪙/den` : '', b.xp ? `+${b.xp} XP/den` : '', b.cubeEvery ? `❄️ každých ${b.cubeEvery} dní` : ''].filter(Boolean).join(' ');
};
export const minutesText = (m: number) => (m < 60 ? `${m} min` : `${m / 60 === Math.floor(m / 60) ? m / 60 : (m / 60).toFixed(1)} h`);

/** Extra plots in the shop: each step adds two plots. */
export const EXPANSIONS = [
  { to: 14, price: 400 },
  { to: 16, price: 800 },
  { to: 18, price: 1200 },
  { to: 20, price: 1600 },
];
export const nextExpansion = (g: Game) => EXPANSIONS.find((e) => e.to > g.plots.length) ?? null;
export function buyPlots(g: Game): Game | null {
  const e = nextExpansion(g);
  if (!e || g.coins < e.price) return null;
  return { ...g, coins: g.coins - e.price, plots: [...g.plots, ...Array(e.to - g.plots.length).fill(null)] };
}

// ---- plots --------------------------------------------------------------------

export const isGrown = (p: Plot) => {
  const item = itemById(p.id);
  return !!item && isPlant(item) && p.grown >= item.minutes;
};
export const plotStage = (p: Plot): number => {
  const item = itemById(p.id);
  if (!item || !isPlant(item)) return 0;
  return p.grown >= item.minutes ? 2 : p.grown >= item.minutes / 2 ? 1 : 0;
};
export const plotEmoji = (p: Plot) => itemById(p.id)?.stages[plotStage(p)] ?? '❔';

/** Every planted seed grows by the focused minutes. */
export const growPlots = (plots: (Plot | null)[], minutes: number) =>
  plots.map((p) => {
    const item = p && itemById(p.id);
    return p && item && isPlant(item) && p.grown < item.minutes ? { ...p, grown: Math.min(item.minutes, p.grown + Math.max(0, minutes)) } : p;
  });

// ---- shop ---------------------------------------------------------------------

/** Buys one seed/decoration into the stock. */
export function buySeed(g: Game, itemId: string): Game | null {
  const item = itemById(itemId);
  if (!item || g.coins < item.price) return null;
  return { ...g, coins: g.coins - item.price, seeds: { ...g.seeds, [itemId]: (g.seeds[itemId] ?? 0) + 1 } };
}

/** Plants one item from the stock on an empty plot. */
export function plantSeed(g: Game, index: number, itemId: string): Game | null {
  if (index < 0 || index >= g.plots.length || g.plots[index] || (g.seeds[itemId] ?? 0) < 1 || !itemById(itemId)) return null;
  const plots = g.plots.slice();
  plots[index] = { id: itemId, grown: 0 };
  const seeds = { ...g.seeds, [itemId]: g.seeds[itemId] - 1 };
  if (seeds[itemId] === 0) delete seeds[itemId];
  return { ...g, plots, seeds };
}

// ---- coins from focus and garden bonuses ----------------------------------------

/** Coins earned by raising a day's focus minutes from `before` to `after` (1 per 2 min, first 4 hours). */
export const focusCoins = (before: number, after: number) =>
  Math.floor(Math.min(after, COIN_MINUTES_CAP) / MINUTES_PER_COIN) - Math.floor(Math.min(before, COIN_MINUTES_CAP) / MINUTES_PER_COIN);

/** What the fully grown plants pay per day. */
export function gardenBonus(plots: (Plot | null)[]) {
  const r = { coins: 0, xp: 0, cubeRate: 0 }; // cubeRate = ice cubes per day
  for (const p of plots) {
    const b = p && isGrown(p) ? itemById(p.id)?.bonus : undefined;
    if (!b) continue;
    r.coins += b.coins ?? 0;
    r.xp += b.xp ?? 0;
    r.cubeRate += b.cubeEvery ? 1 / b.cubeEvery : 0;
  }
  return r;
}

const dayNumber = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(new Date(y, m - 1, d, 12).getTime() / 86_400_000);
};

/**
 * Pays the garden for the days since the last payout (max a week), even if the app was not used.
 * The first call only sets the date. Returns the new game and what was gained (xp goes to the stats).
 */
export function collectPassive(g: Game, now: number) {
  const today = dayKey(now);
  const none = { coins: 0, xp: 0, cubes: 0, days: 0 };
  if (!g.lastCollect) return { game: { ...g, lastCollect: today }, gained: none };
  // Same day, or the clock moved back: never pay twice and never move the date backwards (no clock-shift exploit).
  if (g.lastCollect >= today) return { game: g, gained: none };
  const days = Math.min(MAX_COLLECT_DAYS, dayNumber(today) - dayNumber(g.lastCollect));
  const b = gardenBonus(g.plots);
  const acc = g.cubeAcc + b.cubeRate * days;
  const cubes = Math.floor(acc + 1e-9);
  const coins = b.coins * days;
  const xp = b.xp * days;
  return {
    game: { ...g, lastCollect: today, coins: g.coins + coins, cubes: g.cubes + cubes, cubeAcc: Math.max(0, acc - cubes) },
    gained: { coins, xp, cubes, days },
  };
}

// ---- migration ---------------------------------------------------------------

/** Old garden (growth in days) → minutes; also fills fields added later. Safe to call on any stored value. */
const OLD_DAYS: Record<string, number> = { tulip: 2, sunflower: 3, cactus: 3, rose: 4, tree: 6 };
/** Face items were removed in version 3; owners get their coins back. */
const REFUND_FACE: Record<string, number> = { 'face:shades': 120, 'face:goggles': 200, 'face:phones': 250 };

export function migrateGame(raw: Partial<Game>): Game {
  const base = emptyGame();
  // Only known look slots survive (a removed slot such as "face" is dropped).
  const look = Object.fromEntries(
    (Object.keys(DEFAULT_LOOK) as (keyof Look)[]).map((slot) => [slot, (raw.look as Partial<Look> | undefined)?.[slot] ?? DEFAULT_LOOK[slot]]),
  ) as Look;
  const g = { ...base, ...raw, look, seeds: { ...(raw.seeds ?? {}) }, owned: Array.isArray(raw.owned) ? [...raw.owned] : [] } as Game;
  if (!Number.isFinite(g.coins)) g.coins = 0;
  if (!Number.isFinite(g.cubes)) g.cubes = 0;
  if (!Array.isArray(g.plots)) g.plots = base.plots;
  const from = raw.v ?? 1;
  if (from < 2) {
    g.plots = g.plots.map((p) => {
      const item = p && itemById(p.id);
      if (!p) return null;
      if (!item) return p; // unknown id: keep it instead of deleting the player's plant
      if (!isPlant(item)) return { id: p.id, grown: 0 };
      const old = OLD_DAYS[p.id] ?? 1;
      return { id: p.id, grown: Math.min(item.minutes, Math.round((p.grown / old) * item.minutes)) };
    });
  }
  if (from < 3) {
    let refund = 0;
    g.owned = g.owned.filter((k) => {
      if (k in REFUND_FACE) { refund += REFUND_FACE[k]; return false; }
      return !k.startsWith('face:');
    });
    g.coins += refund;
  }
  g.v = Math.max(from, GAME_VERSION);
  while (g.plots.length < PLOTS) g.plots.push(null);
  return g;
}
