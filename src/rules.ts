// Pure game rules (no React / storage imports) so they can be tested with plain node.

export type Stats = { days: Record<string, number>; frozen: Record<string, true>; startedAt: number | null };
export type Plot = { id: string; grown: number };
export type Game = { coins: number; cubes: number; plots: (Plot | null)[] };
export type Item = { id: string; name: string; price: number; days: number; stages: string[] };

export const PLOTS = 12;
export const emptyStats = (): Stats => ({ days: {}, frozen: {}, startedAt: null });
export const emptyGame = (): Game => ({ coins: 0, cubes: 0, plots: Array(PLOTS).fill(null) });

/** days = how many focus days until fully grown; 0 = decoration. */
export const CATALOG: Item[] = [
  { id: 'tulip', name: 'Tulipán', price: 10, days: 2, stages: ['🌱', '🌿', '🌷'] },
  { id: 'sunflower', name: 'Slunečnice', price: 15, days: 3, stages: ['🌱', '🌿', '🌻'] },
  { id: 'cactus', name: 'Kaktus', price: 20, days: 3, stages: ['🌱', '🌿', '🌵'] },
  { id: 'rose', name: 'Růže', price: 25, days: 4, stages: ['🌱', '🌿', '🌹'] },
  { id: 'tree', name: 'Strom', price: 50, days: 6, stages: ['🌱', '🌿', '🌳'] },
  { id: 'mushroom', name: 'Houba', price: 10, days: 0, stages: ['🍄'] },
  { id: 'bee', name: 'Včelka', price: 30, days: 0, stages: ['🐝'] },
  { id: 'butterfly', name: 'Motýl', price: 30, days: 0, stages: ['🦋'] },
  { id: 'rabbit', name: 'Zajíc', price: 40, days: 0, stages: ['🐇'] },
];
export const itemById = (id: string) => CATALOG.find((i) => i.id === id);

// ---- days -----------------------------------------------------------------

export const dayKey = (t: number) => {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
/** Noon of the day `offset` days from `now` (noon avoids DST edge cases). */
const at = (now: number, offset: number) => {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset, 12).getTime();
};
const isDone = (s: Stats, t: number) => (s.days[dayKey(t)] ?? 0) > 0;
const isFrozen = (s: Stats, t: number) => !!s.frozen[dayKey(t)];

export const todayMinutes = (s: Stats, now: number) => s.days[dayKey(now)] ?? 0;

/** Consecutive focus days; frozen days keep the chain but do not add to it. */
export function streak(s: Stats, now: number): number {
  let off = isDone(s, now) ? 0 : -1;
  let n = 0;
  for (let i = 0; i < 5000; i++, off--) {
    const t = at(now, off);
    if (isDone(s, t)) n++;
    else if (!isFrozen(s, t)) break;
  }
  return n;
}

/**
 * Spends one ice cube per missed day (yesterday and back to the last focus/frozen day).
 * All or nothing: if there are not enough cubes the streak simply breaks and no cube is spent.
 */
export function applyFreezes(s: Stats, cubes: number, now: number) {
  let gap = 0;
  let anchored = false;
  for (let off = -1; off >= -60; off--) {
    const t = at(now, off);
    if (isDone(s, t) || isFrozen(s, t)) { anchored = true; break; }
    gap++;
  }
  if (!anchored || gap === 0 || cubes < gap) return { stats: s, cubes, used: 0 };
  const frozen = { ...s.frozen };
  for (let off = -1; off >= -gap; off--) frozen[dayKey(at(now, off))] = true;
  return { stats: { ...s, frozen }, cubes: cubes - gap, used: gap };
}

const WEEK = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
/** Current week Monday..Sunday. */
export function weekDays(s: Stats, now: number) {
  const dow = (new Date(now).getDay() + 6) % 7;
  return WEEK.map((label, i) => {
    const t = at(now, i - dow);
    return { label, done: isDone(s, t), frozen: isFrozen(s, t), today: dayKey(t) === dayKey(now) };
  });
}

// ---- rewards & garden -----------------------------------------------------

/** Reward when the streak reaches n: 5 coins/day (+15 every 7th), 1 cube every 3rd and 2 every 7th. */
export const rewardForStreak = (n: number) => ({
  coins: 5 + (n % 7 === 0 ? 15 : 0),
  cubes: (n % 3 === 0 ? 1 : 0) + (n % 7 === 0 ? 2 : 0),
});

export const plotStage = (p: Plot): number => {
  const item = itemById(p.id);
  if (!item || item.days === 0) return 0;
  return p.grown >= item.days ? 2 : p.grown >= Math.ceil(item.days / 2) ? 1 : 0;
};
export const plotEmoji = (p: Plot) => itemById(p.id)?.stages[plotStage(p)] ?? '❔';

/** Every planted seed grows by one day of focus. */
export const growPlots = (plots: (Plot | null)[]) =>
  plots.map((p) => {
    const item = p && itemById(p.id);
    return p && item && p.grown < item.days ? { ...p, grown: p.grown + 1 } : p;
  });

/** Buys `itemId` and plants it on an empty plot; null if impossible. */
export function plantItem(g: Game, index: number, itemId: string): Game | null {
  const item = itemById(itemId);
  if (!item || g.plots[index] || g.coins < item.price) return null;
  const plots = g.plots.slice();
  plots[index] = { id: item.id, grown: 0 };
  return { ...g, coins: g.coins - item.price, plots };
}
