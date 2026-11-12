---
paths:
  - "src/rules.ts"
  - "tests/**"
---

# Game rules

- `src/rules.ts` stays pure: no React, storage, date-now or random inside functions (pass `now` in).
- Every rule change needs a test in `tests/` and an update of `docs/GAME_RULES.md` in the same commit.
- Persisted shapes (`Stats`, `Game`, `Settings`) are backwards compatible: add fields with defaults, never rename or remove. Old installs must load.
- Tests use fixed dates (noon local time) and `node:test`; no sleeps, no real clock.
- Badges and levels are derived from data, not stored.
