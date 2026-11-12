---
paths:
  - "src/dev.ts"
  - "src/devcode.ts"
  - "src/clock.ts"
  - "src/DevSection.tsx"
---

# Developer mode

- Dev operations live only in `src/dev.ts` as pure functions with tests; never change production rules to make testing easier.
- The developer code is never written to the repo, logs, docs or commits; only its SHA-256 hash in `src/devcode.ts`. A new code means a new hash and a new release.
- Use `now()` from `src/clock.ts` instead of `Date.now()` in app code so the time shift applies everywhere.
- Developer mode must stay offline: no network calls.
