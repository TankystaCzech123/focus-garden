---
paths:
  - "src/*Screen.tsx"
  - "src/*.tsx"
  - "App.tsx"
---

# UI

- Colours only from `src/theme.ts` (`useStyles` / `useTheme`); support light and dark. The only exception is the share card, which is fixed light so it looks the same everywhere.
- UI text is Czech; code, comments, docs and commits are English.
- No game logic in components: call functions from `src/rules.ts`.
- Use `Chunky` for primary buttons; keep screens simple (KISS) and readable at phone width.
- Async actions go through `run(...)` in `App.tsx` so errors reach the user.
