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
- **5 coins** for every completed day, **+15** when the streak reaches a multiple of 7. One week of streak = 7 × 5 + 15 = **50 coins**.
- Rewards are granted the first time a day becomes completed (when you stop focus).

## Garden 🌷
- 12 plots. Tap an empty plot to open the shop and buy a seed or decoration.
- Plants grow **one day each time you complete a day** (not in real time) and show 3 stages (🌱 → 🌿 → final form).

| Item | Price | Growth |
| --- | --- | --- |
| Tulip 🌷 | 10 | 2 days |
| Sunflower 🌻 | 15 | 3 days |
| Cactus 🌵 | 20 | 3 days |
| Rose 🌹 | 25 | 4 days |
| Tree 🌳 | 50 | 6 days |
| Mushroom 🍄, Bee 🐝, Butterfly 🦋, Rabbit 🐇 | 10 / 30 / 30 / 40 | decorations |

## Known trade-offs
- One minute is enough to complete a day, so coins can be farmed. A configurable daily goal is on the roadmap.

## Profile

- **XP** = total focused minutes + 10 per completed day.
- **Levels** (XP needed): Seedling 0 · Sprout 50 · Sapling 150 · Plant 300 · Bush 600 · Tree 1000 · Grove 1600 · Forest 2500 (shown with Czech names in the app).
- **Records**: current and longest streak (frozen days keep a run alive without adding to it), total time, number of sessions, longest session, best day, and a 12-week activity heatmap.
- **Badges** are derived from your data (first focus, streaks of 3/7/14/30/100, 1/10/100 hours, first plant, grown tree, full garden, streak saved by an ice cube). Nothing extra is stored, so they cannot be lost or faked locally.
- **Share card**: a picture generated on the device from nickname, level, streak, total time, badge count and garden. It leaves the phone only when you pick a target in the system share sheet.
