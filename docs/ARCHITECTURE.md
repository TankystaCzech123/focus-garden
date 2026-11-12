# Architecture

Focus Garden is an [Expo](https://expo.dev) (React Native, TypeScript) app with one local native module.
Expo Go is not supported because of the native module – use a development build (`npm run android` / `npm run ios`).

```
App.tsx ── state, navigation, orchestration
 ├─ src/rules.ts        pure rules: streak, freezes, rewards, garden (no imports, unit-tested)
 ├─ src/storage.ts      AsyncStorage: allowed apps, settings, stats, game
 ├─ src/*Screen.tsx     Focus, Garden, Settings, Setup, DevLog screens
 ├─ src/theme.ts        light/dark palettes, useStyles()
 └─ modules/focus-native   Kotlin + Swift module, one JS API for both platforms
```

## Native module API (`modules/focus-native/src/index.ts`)

| Function | Android | iOS |
| --- | --- | --- |
| `needsPicker()` | `false` (we list apps ourselves) | `true` (system picker only) |
| `getInstalledApps()` | launcher apps with base64 icons | empty |
| `pickApps()` | – | `FamilyActivityPicker`, stores the selection |
| `start(allowed, dnd)` | Device Owner → lock task; otherwise requires the accessibility service and stores the allow-list; optionally Do Not Disturb | shields all apps except the selection |
| `stop()` | clears focus, restores Do Not Disturb | clears shields |
| `isActive()` | focus state (SharedPreferences) | shield is set |
| `launchApp(id)` | starts the app | no-op |
| `dndGranted()` / `openDndSettings()` | notification policy access | always granted / no-op |
| `getDevLog()` / `clearDevLog()` | human readable event log | empty |

## Android focus mode

Android has no public API to restrict a phone to some apps without Device Owner (screen pinning blocks *all* other apps,
including the allowed ones). Focus Garden therefore uses an **accessibility service**
(`FocusAccessibilityService`):

1. On every `TYPE_WINDOW_STATE_CHANGED` it reads the foreground package name (no content access).
2. Allowed apps and this app are left alone. Helper windows without a launcher icon, system UI and **Xiaomi Game Turbo**
   (`com.miui.securitycenter`, `com.miui.gamebooster`, `com.xiaomi.joyose`, `miui.systemui.plugin`) are ignored –
   otherwise games kick you out right after starting.
3. Any other launcher app (and the home screen) is answered by bringing Focus Garden back to the front.

When the app is set up as **Device Owner**, real lock task mode (`setLockTaskPackages`) is used instead.

## iOS focus mode

Apple only allows *shielding* apps through the Screen Time API: `FamilyActivityPicker` lets the user select apps,
`ManagedSettingsStore.shield.applicationCategories = .all(except:)` blocks the rest. This needs the
`com.apple.developer.family-controls` entitlement and a real device (not the simulator).

## Data

Everything is stored locally with AsyncStorage (`focus.allowed`, `focus.settings`, `focus.stats`, `focus.game`) plus
SharedPreferences on Android for the state the accessibility service needs in the background.
