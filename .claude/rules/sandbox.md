---
paths:
  - "src/sandbox.ts"
  - "src/SandboxSection.tsx"
  - "dev-data/**"
---

# Developer sandbox

- Data goes only to the private repo `focus-garden-devdata`, never to the public repo, issues, PRs or external services.
- `dev-data/` is a local clone of that private repo and is gitignored. Never commit, copy or paste its contents into public places; summarise findings with file paths.
- Network only to `github.com` / `api.github.com` (`assertAllowed`). The sign-in token lives in the Android Keystore (`expo-secure-store`), never in AsyncStorage, logs, reports or commits.
- A report is built field by field in `buildReport`; adding a field needs a test and an update of `docs/SANDBOX.md` and `docs/PRIVACY.md`.
- Sending is always opt-in: signed in, previewed, confirmed by the user.
