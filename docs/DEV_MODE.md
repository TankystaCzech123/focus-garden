# Developer mode

A hidden panel for testing the app without waiting for real days. It works offline and sends nothing anywhere.

## Unlock
Settings → *Vývojářský režim* → enter the developer code → **Odemknout**. Dashes and letter case do not matter. The unlock is stored on the phone; **Zamknout** hides the panel again.

The repo contains only the SHA-256 hash of the code (`src/devcode.ts`), never the code. To change the code, generate a new random one, replace `DEV_CODE_HASH` and release a new version. Old codes stop working in the new version only.

> This is a convenience lock, not a security boundary. The app is open source and local, so anyone can change their own data or build their own APK. The code just keeps the menu away from normal users.

## Your real data is protected
When you unlock developer mode, the current statistics, coins, ice cubes and garden are saved aside (`src/devBackup.ts`). The first backup is never overwritten, not by unlocking again and not by restarting the app, so test data can never replace it. Everything you change afterwards (including *Resetovat testovací data*) only touches the working copy.

- **Vrátit původní data** puts the saved data back and resets the clock shift; developer mode stays on.
- **Zamknout** asks what to do: *Vrátit původní data* (restores and deletes the backup) or *Ponechat testovací* (keeps the test data and deletes the backup, so the real data are gone).
- Real focus sessions you run while developer mode is on count towards the working copy and are lost when you restore. Lock developer mode before using the app for real.
- If developer mode was already unlocked before this safety copy existed, the backup is made from the data as they are at the next app start.

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
| Vrátit původní data | Restores the saved real data (see above). |
| Resetovat testovací data | Clears stats, coins, ice cubes and garden of the working copy after a confirmation. The real data stay in the backup. |

All operations are pure functions in `src/dev.ts` with tests in `tests/dev.test.ts`.

## Notes
- Shifting the clock backwards leaves "future" days in the history; they do not count for the streak. Use *Vrátit původní data* or *Resetovat testovací data* for a clean start.
- The earlier GitHub sign-in sandbox was removed. The private repo `focus-garden-devdata` and the GitHub App `Focus Garden Sandbox` are no longer used; delete them on GitHub if you want (repo: Settings → Danger zone → Delete; app: github.com/settings/apps → Advanced → Delete).
