# Contributing to Focus Garden

Thanks for helping! This project follows **KISS** – keep changes small, simple and easy to review.

## Ways to contribute

- Report a bug or suggest a feature via [issues](../../issues/new/choose).
- Pick a [`good first issue`](../../labels/good%20first%20issue) or something from the roadmap in the README.
- Improve docs and translations.
- Test on more devices (especially iOS and other Android brands) and tell us what you find – the in-app **Dev Log** helps.

## Development setup

```bash
git clone https://github.com/<you>/focus-garden.git
cd focus-garden
npm install
npm run typecheck && npm test
npm run android     # needs the Android SDK + JDK 17 and a phone/emulator
```

See [docs/SETUP.md](docs/SETUP.md) for details. The app uses a custom native module, so Expo Go does not work.

## Workflow

1. Fork the repo and create a branch from `main` (`feat/daily-goal`, `fix/game-turbo`, ...).
2. Make your change. Put game logic in `src/rules.ts` (pure, no React) and add tests in `tests/`.
3. Run `npm run typecheck` and `npm test`.
4. Open a pull request using the template. CI must be green.

## Commit messages – Conventional Commits

Please use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `ci:`). They keep the history readable and the generated release notes tidy. Squash-merged PR titles should follow the same format.

## How releases work

Every push to `main` that changes the app (`src/`, `modules/`, `assets/`, `App.tsx`, `app.json`, `package*.json`) automatically builds the Android APK and publishes a GitHub release `v0.1.<run number>` with generated notes. Nobody has to merge anything. The in-app **Settings → Check for updates** button installs the newest release. Docs-only pushes do not create a release.


## Code style

- TypeScript strict mode. Keep components small; styles via `useStyles`.
- Native code: Kotlin (Android), Swift (iOS) in `modules/focus-native`. Keep the JS API identical on both platforms.
- User-facing text is currently Czech; new strings should be easy to translate (no concatenated sentences).
- Do not commit secrets, keystores or personal data.

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

