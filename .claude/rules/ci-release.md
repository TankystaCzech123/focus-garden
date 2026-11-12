---
paths:
  - ".github/**"
  - "release-please-config.json"
---

# CI and release

- Top-level `permissions: contents: read`; widen per job only when needed.
- Pin third-party actions to a version; review Dependabot PRs instead of auto-merging.
- Never interpolate untrusted values (PR titles, branch names) into `run:`; pass via `env:`.
- Set `timeout-minutes` on jobs. Secrets only at the step that needs them.
- Versions come from release-please. Do not edit the manifest, `CHANGELOG.md` or `app.json` version by hand.
- The release APK is debug-signed with the Expo template key; updates only install over builds signed with the same key. Do not change signing without telling the user.
