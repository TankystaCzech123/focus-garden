# Developer mode

A hidden panel for testing the app without waiting for real days. It works offline and sends nothing anywhere.

## Unlock
Settings → *Vývojářský režim* → enter the developer code → **Odemknout**. Dashes and letter case do not matter. The unlock is stored on the phone; **Zamknout** hides the panel again.

The repo contains only the SHA-256 hash of the code (`src/devcode.ts`), never the code. To change the code, generate a new random one, replace `DEV_CODE_HASH` and release a new version. Old codes stop working in the new version only.

> This is a convenience lock, not a security boundary. The app is open source and local, so anyone can change their own data or build their own APK. The code just keeps the menu away from normal users.

## What the panel does
| Control | Effect |
| --- | --- |
| Čas: −1 / +1 / +7 dní / Reset | Shifts the app's clock by whole days (`src/clock.ts`). Streaks, plant growth and ice cubes then react as on a real day; ice cubes are applied right after each shift. Not allowed while focus runs. |
| Mince, ledové kostky | Add or remove, never below 0. |
| Minuty dnes | Add or remove focus minutes on the current app day. |
| XP | Adds or removes bonus XP (`xpBonus`). Total XP never drops below 0. |
| Série | Sets the streak to exactly N days ending yesterday, so a focus today still earns the reward. |
| Splnit dnešek | Marks today done like a finished focus: rewards, garden grows, celebration. |
| Dorůst rostliny / Vyprázdnit zahrádku | Grow all plants / empty all plots. |
| Ukázat oslavu | Shows the streak celebration screen. |
| Resetovat všechna data | Clears stats, coins, ice cubes and garden after a confirmation. |

All operations are pure functions in `src/dev.ts` with tests in `tests/dev.test.ts`.

## Notes
- Shifting the clock backwards leaves "future" days in the history; they do not count for the streak. Use *Resetovat všechna data* for a clean start.
- The earlier GitHub sign-in sandbox was removed. The private repo `focus-garden-devdata` and the GitHub App `Focus Garden Sandbox` are no longer used; delete them on GitHub if you want (repo: Settings → Danger zone → Delete; app: github.com/settings/apps → Advanced → Delete).
