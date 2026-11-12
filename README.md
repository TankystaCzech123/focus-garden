# Focus Garden 🌱🔥

[![CI](https://github.com/TankystaCzech123/focus-garden/actions/workflows/ci.yml/badge.svg)](https://github.com/TankystaCzech123/focus-garden/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/TankystaCzech123/focus-garden?include_prereleases)](https://github.com/TankystaCzech123/focus-garden/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A gamified focus app for Android and iOS.** Pick a handful of apps once, tap one button, and your whole phone
shrinks down to just those apps. Keep your daily streak, earn coins and grow a little garden while you stay focused.

> The in-app text is currently Czech. English translation is a [good first issue](../../issues) – contributions welcome!

## Features

- **One-tap focus mode** – only the apps you chose stay usable, everything else sends you back to Focus Garden.
- **First-run setup** – choose up to 5 allowed apps from an icon grid (Android) or the system picker (iOS).
- **Do Not Disturb** – optionally mutes notifications while you focus and restores your previous mode afterwards.
- **Streak** – a Duolingo-style daily streak with a weekly overview and a celebration screen.
- **Ice cubes ❄️** – streak freezes: earn 1 cube every 3 days and 2 every 7 days (4 per week); one cube is spent per missed day.
- **Coins 🪙 and garden** – 5 coins per focused day, +15 for every 7-day streak. Buy seeds and decorations and grow your garden.
- **Light / dark theme**, a built-in **Dev Log** for debugging, and everything stored **locally on your phone**.

Details of the rules are in [docs/GAME_RULES.md](docs/GAME_RULES.md).

## Platform support

| Platform | Status | How it works |
| --- | --- | --- |
| Android | ✅ Works (tested on a Xiaomi / HyperOS device, Android 16) | An accessibility service watches the foreground app and returns you to Focus Garden when a non‑allowed app opens. Xiaomi Game Turbo windows are ignored so games start normally. Optional full kiosk via *Device Owner* (lock task). |
| iOS | ⚠️ Builds, **not yet tested on a real device** | Screen Time API (`FamilyControls` / `ManagedSettings`) shields every app except the ones picked in the system picker. Needs Apple's Family Controls entitlement. |

iOS cannot offer a real kiosk mode – Apple only allows shielding apps. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Install (Android)

1. Open the [latest release](https://github.com/TankystaCzech123/focus-garden/releases/latest) and download the `.apk` file.
2. Allow installing apps from your browser/file manager when Android asks.
3. Open the app, pick your apps and tap **START**. Android sends you to *Accessibility* – turn on the **Focus** service.
   On some phones (Xiaomi, Android 13+) you must first allow *restricted settings*: Settings → Apps → Focus → ⋮ → *Allow restricted settings*.

Release APKs are signed with the Expo debug key – fine for sideloading, not for the Play Store. They are built for `arm64-v8a` (nearly all modern phones).

## Build from source

Requirements: Node.js 24+, JDK 17 and the Android SDK (Android), or Xcode + CocoaPods (iOS).

```bash
git clone https://github.com/TankystaCzech123/focus-garden.git
cd focus-garden
npm install
npm run android        # build and run on a connected Android phone / emulator
npm run ios            # build and run on a connected iPhone (needs Family Controls, see docs/SETUP.md)
npm run typecheck
npm test
```

The app uses a custom native module, so **Expo Go does not work** – use the commands above (development build).
Full instructions, including Device Owner and iOS signing: [docs/SETUP.md](docs/SETUP.md).

## Project layout

```
App.tsx                      app state and navigation
src/rules.ts                 pure game rules: streak, ice cubes, rewards, garden (unit-tested)
src/*.tsx                    screens and UI components
modules/focus-native/        native module (Kotlin + Swift): focus mode, app list, Do Not Disturb, Dev Log
tests/                       node:test unit tests
docs/                        architecture, rules, setup, privacy
```

## Roadmap

Ideas you can pick up (see also the [issues](../../issues)): daily goal, home‑screen widget, daily reminder,
English/Czech translations, focus timer, achievements, purpose-based app sets ("study", "work"), iOS verification on a device.

## Contributing

Contributions are very welcome – code, docs, translations, bug reports and ideas. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Privacy

Focus Garden has no accounts, no analytics and sends no data anywhere. See [docs/PRIVACY.md](docs/PRIVACY.md).

## License

[MIT](LICENSE)
