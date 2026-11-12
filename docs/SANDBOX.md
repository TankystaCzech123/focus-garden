# Developer sandbox

A way for the owner and contributors to send diagnostic data from a phone to a **private** GitHub repo, where AI tools and developers can analyse it. It is opt-in, Android only, and adds no data to the APK or to updates.

## How it works
1. Settings → *Vývojářský sandbox* → **Přihlásit přes GitHub**. The app shows a code; enter it at github.com/login/device (GitHub *device flow*, no secret in the app).
2. The app checks that your account may write to `TankystaCzech123/focus-garden-devdata`. If not, it stays locked and the token is discarded.
3. **Poslat do sandboxu** shows what will be sent and asks for confirmation, then uploads `inbox/<login>/<date>/<time>.json`.
4. On a computer, `/pull-devdata` (Claude Code) clones the private repo into the gitignored `dev-data/` folder and summarises new reports.

The token is stored in the Android Keystore (`expo-secure-store`). *Odhlásit* deletes it from the phone only. The token stays valid on GitHub until you revoke it at github.com/settings/applications, so do that if a phone is lost or sold.

## What a report contains
App version, phone model and Android version, the local Dev Log (names of apps opened during focus), focus statistics and game state, and three settings (theme, Do Not Disturb, auto-update). Never: token, nickname, e-mail, screen content. See `schema.md` in the data repo.

## One-time setup (owner)
1. GitHub → Settings → Developer settings → **New GitHub App**.
   - Homepage URL: the repo URL. Webhook: **off**.
   - **Enable Device Flow**: on.
   - Repository permissions → **Contents: Read and write**. Nothing else.
   - Expire user authorization tokens: **off** (otherwise refresh tokens would be needed).
   - Where can it be installed: only this account.
2. **Install** the app on the account, selecting **only** `focus-garden-devdata`.
3. Put the app's **Client ID** (public, like `Iv1.…`) into `CLIENT_ID` in `src/sandbox.ts`, commit and release.
4. Add contributors as collaborators of `focus-garden-devdata` (write access). They sign in with their own GitHub account.

## Notes
- Because the data lives in a separate private repo, it is never part of the app, the public repo or release assets.
- Reports accumulate in git history; delete old ones when no longer needed.
