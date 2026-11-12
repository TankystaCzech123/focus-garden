// Pure game rules (no React / storage imports) so they can be tested with plain node.

export type Stats = {
  days: Record<string, number>;
  frozen: Record<string, true>;
  startedAt: number | null;
  sessions: number; // finished sessions
  bestSession: number; // longest session in minutes
};
export type Plot = { id: string; grown: number };
export type Game = { coins: number; cubes: number; plots: (Plot | null)[] };
export type Item = { id: string; name: string; price: number; days: number; stages: string[] };

export const PLOTS = 12;
export const emptyStats = (): Stats => ({ days: {}, frozen: {}, startedAt: null, sessions: 0, bestSession: 0 });
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

// ---- profile: XP, levels, records, badges -----------------------------------

export const totalMinutes = (s: Stats) => Object.values(s.days).reduce((a, b) => a + b, 0);
export const doneDays = (s: Stats) => Object.values(s.days).filter((m) => m > 0).length;

/** XP = focused minutes + 10 per completed day. */
export const xp = (s: Stats) => totalMinutes(s) + 10 * doneDays(s);

export const LEVELS = [
  { min: 0, name: 'Semínko', emoji: '🌰' },
  { min: 50, name: 'Klíček', emoji: '🌱' },
  { min: 150, name: 'Sazenice', emoji: '🌿' },
  { min: 300, name: 'Rostlinka', emoji: '🪴' },
  { min: 600, name: 'Keřík', emoji: '🌼' },
  { min: 1000, name: 'Strom', emoji: '🌳' },
  { min: 1600, name: 'Hájek', emoji: '🌲' },
  { min: 2500, name: 'Les', emoji: '🏞️' },
];

export function levelInfo(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return {
    level: i + 1,
    name: cur.name,
    emoji: cur.emoji,
    next: next ? next.min - points : 0, // XP missing for the next level (0 = max)
    progress: next ? (points - cur.min) / (next.min - cur.min) : 1,
  };
}

/** Longest run of consecutive days with focus; frozen days keep the run alive without adding to it. */
export function longestStreak(s: Stats): number {
  const keys = [...new Set([...Object.keys(s.days).filter((k) => s.days[k] > 0), ...Object.keys(s.frozen)])].sort();
  if (!keys.length) return 0;
  const toT = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12).getTime(); };
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    const consecutive = prev !== null && dayKey(toT(prev) + 86_400_000) === k;
    run = consecutive ? run : 0;
    if ((s.days[k] ?? 0) > 0) run++;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

export const bestDay = (s: Stats) => Math.max(0, ...Object.values(s.days));

/** Last `weeks` weeks as columns (Mon..Sun), oldest first; minutes = null for future days. */
export function activity(s: Stats, now: number, weeks = 12) {
  const dow = (new Date(now).getDay() + 6) % 7;
  const cols: { key: string; minutes: number | null }[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const t = at(now, -dow - w * 7 + d);
      col.push({ key: dayKey(t), minutes: t > now && dayKey(t) !== dayKey(now) ? null : s.days[dayKey(t)] ?? 0 });
    }
    cols.push(col);
  }
  return cols;
}

export type Badge = { id: string; emoji: string; name: string; hint: string; earned: boolean };

export function badges(s: Stats, g: Game): Badge[] {
  const best = longestStreak(s);
  const hours = totalMinutes(s) / 60;
  const planted = g.plots.filter(Boolean) as Plot[];
  const defs: [string, string, string, string, boolean][] = [
    ['first', '🎯', 'První focus', 'Dokonči první focus', doneDays(s) >= 1],
    ['s3', '🔥', 'Série 3', 'Série 3 dny', best >= 3],
    ['s7', '🔥', 'Série 7', 'Série 7 dní', best >= 7],
    ['s14', '🔥', 'Série 14', 'Série 14 dní', best >= 14],
    ['s30', '🏆', 'Série 30', 'Série 30 dní', best >= 30],
    ['s100', '👑', 'Série 100', 'Série 100 dní', best >= 100],
    ['h1', '⏱️', '1 hodina', 'Celkem 1 hodina focusu', hours >= 1],
    ['h10', '⌛', '10 hodin', 'Celkem 10 hodin focusu', hours >= 10],
    ['h100', '🧘', '100 hodin', 'Celkem 100 hodin focusu', hours >= 100],
    ['plant', '🌱', 'První rostlina', 'Zasaď cokoli do zahrádky', planted.length >= 1],
    ['tree', '🌳', 'Dospělý strom', 'Dopěstuj strom', planted.some((p) => p.id === 'tree' && plotStage(p) === 2)],
    ['full', '🏡', 'Plná zahrádka', 'Obsaď všech 12 polí', planted.length >= PLOTS],
    ['ice', '❄️', 'Zachráněno ledem', 'Ledová kostka zachrání sérii', Object.keys(s.frozen).length >= 1],
  ];
  return defs.map(([id, emoji, name, hint, earned]) => ({ id, emoji, name, hint, earned }));
}
