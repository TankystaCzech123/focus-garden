// Developer-mode operations. Pure functions on Stats/Game so they can be tested; never negative values.
import { dayAt, dayKey, itemById } from './rules.ts';
import type { Game, Stats } from './rules.ts';

export const addCoins = (g: Game, d: number): Game => ({ ...g, coins: Math.max(0, g.coins + d) });
export const addCubes = (g: Game, d: number): Game => ({ ...g, cubes: Math.max(0, g.cubes + d) });
export const addXp = (s: Stats, d: number): Stats => ({ ...s, xpBonus: (s.xpBonus ?? 0) + d });

/** Adds (or removes) focus minutes on the day of `t`; a day that reaches 0 is removed. */
export function addMinutes(s: Stats, t: number, d: number): Stats {
  const k = dayKey(t);
  const next = Math.max(0, (s.days[k] ?? 0) + d);
  const days = { ...s.days };
  if (next === 0) delete days[k];
  else days[k] = next;
  return { ...s, days };
}

/**
 * Makes the current streak exactly `n` days, ending yesterday (today stays untouched, so a focus today still
 * earns the reward). Marks the last n days as done (1 minute if empty) and removes all older history.
 */
export function setStreak(s: Stats, n: number, now: number): Stats {
  const days = { ...s.days };
  const frozen = { ...s.frozen };
  for (let i = 1; i <= n; i++) {
    const k = dayKey(dayAt(now, -i));
    days[k] = Math.max(days[k] ?? 0, 1);
    delete frozen[k];
  }
  // Cut the chain: drop every older entry, so ice cubes cannot bridge the gap later.
  const cut = dayKey(dayAt(now, -(n + 1)));
  for (const k of Object.keys(days)) if (k <= cut) delete days[k];
  for (const k of Object.keys(frozen)) if (k <= cut) delete frozen[k];
  return { ...s, days, frozen };
}

/** Every planted seed becomes fully grown. */
export const growAll = (g: Game): Game => ({
  ...g,
  plots: g.plots.map((p) => (p ? { ...p, grown: Math.max(p.grown, itemById(p.id)?.days ?? p.grown) } : p)),
});

export const clearGarden = (g: Game): Game => ({ ...g, plots: g.plots.map(() => null) });
