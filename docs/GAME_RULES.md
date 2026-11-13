# Game rules

All rules live in [`src/rules.ts`](../src/rules.ts) as pure functions and are covered by `tests/rules.test.ts`.

## Focus day and streak
- A day is **completed** when you have at least **1 minute** of focus (summed over sessions, credited to the day the session ends).
- The **streak** is the number of consecutive completed days. If today is not completed yet, the streak is counted up to yesterday.
- **Frozen days** (see ice cubes) keep the chain alive but do not increase the streak.

## Ice cubes ❄️ (streak freeze)
- Earned when the streak reaches a multiple of **3** (+1) and a multiple of **7** (+2). One week of streak = 1 + 1 + 2 = **4 cubes**.
- **One cube is spent per missed day**, applied when you open the app. It is *all or nothing*: if you do not have enough
  cubes for the whole gap, no cube is spent and the streak breaks.

## Coins 🪙
- **From focus:** 1 coin per 2 focused minutes, for the first 4 hours of each day (so at most 120 coins a day).
- **Streak bonus:** 5 coins for the first completed focus of a day, **+25** when the streak reaches a multiple of 7.
- **From the garden:** fully grown plants pay a small daily bonus (see below), even on days you do not use the app.
- Coins are spent in the **shop** on seeds, decorations, avatar items, frames, card colours, backgrounds and extra plots.

## Garden 🌷 and shop 🛒
- **Seeds are bought in the shop** into a stock and planted for free from the Garden tab on an empty plot (12 plots; four paid expansions add two plots each: 400, 800, 1200, 1600 coins, up to 20).
- **Plants grow from focus minutes**, all planted plants at once: every focused minute is added to every growing plant until it is fully grown.
- **Only fully grown plants give a bonus, once per day, even when idle.** The garden pays out when the app starts (or the day changes) for the days since the last payout, at most 7 days.
  Each plant has exactly one bonus:

| Plant | Price | Grows in | Daily bonus |
| --- | --- | --- | --- |
| Tulip 🌷 | 50 | 30 min | +2 🪙 |
| Clover 🍀 | 70 | 45 min | +2 XP |
| Sunflower 🌻 | 120 | 90 min | +4 🪙 |
| Cactus 🌵 | 150 | 2 h | +4 XP |
| Rose 🌹 | 260 | 3 h | +7 🪙 |
| Sakura 🌸 | 350 | 4 h | +8 XP |
| Hibiscus 🌺 | 450 | 5 h | +10 🪙 |
| Palm 🌴 | 550 | 6 h | 1 ❄️ every 7 days |
| Apple tree 🍎 | 650 | 8 h | +12 🪙 |
| Tree 🌳 | 900 | 10 h | +12 XP |

- **Decorations** (look only, no bonus): mushroom 30, bee 90, butterfly 90, rabbit 140, lantern 180, owl 240, fountain 300.
- **Balance** (simulated in `tests/garden.test.ts`): focusing 60 min a day buys the first plant on day 2 and all ten plants in about two months; 30 min a day takes about three months. The passive income always stays below the active income.
- **Migration:** gardens from older versions (growth in days) are converted to minutes proportionally, so nothing is lost. Face items (removed in version 3) are refunded at their purchase price.

## Profile customisation
Avatar (emoji), hat, frame (the rainbow frame is a gradient), card colour and profile background are bought in the shop (free defaults are always owned) and worn on the profile and the share card. Prices range from 100 to 1200 coins.

## Known trade-offs
- A day with 1 minute of focus still counts as a completed day for the streak; coins, however, scale with minutes.
- Passive income depends on the phone date; the developer mode can shift it for testing.

## Profile

- **XP** = total focused minutes + 10 per completed day (+ XP paid by the garden (`passiveXp`) + `xpBonus` changed only by developer mode; total never below 0).
- **Levels** (XP needed): Seedling 0 · Sprout 50 · Sapling 150 · Plant 300 · Bush 600 · Tree 1000 · Grove 1600 · Forest 2500 · Jungle 4000 · Legend 7000 (shown with Czech names in the app).
- **Records**: current and longest streak (frozen days keep a run alive without adding to it), total time, number of sessions, longest session, best day, and a 12-week activity heatmap.
- **Badges** are derived from your data (first focus, streaks of 3/7/14/30/100, 1/10/100 hours, first plant, grown tree, full garden, streak saved by an ice cube). Nothing extra is stored, so they cannot be lost or faked locally.
- **Share card**: a picture generated on the device from nickname, level, streak, total time, badge count and garden. It leaves the phone only when you pick a target in the system share sheet.
