---
name: device-check
description: Build the release APK, install it on the connected Android phone and check it runs, reading Dev Log and logcat. Use when the user wants a change verified on the real phone.
disable-model-invocation: true
allowed-tools: Bash(adb devices *) Bash(adb logcat *) Bash(adb install -r *) Bash(npx expo prebuild *)
---

# Device check

Requires `JAVA_HOME=/opt/homebrew/opt/openjdk@17` and `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools`.

1. `adb devices` – stop and tell the user if no device is authorised.
2. `npx expo prebuild --platform android --no-install`, then in `android/`: `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a`.
3. `adb install -r android/app/build/outputs/apk/release/app-release.apk` (keeps app data).
4. Launch the app, read `adb logcat -d` filtered to the package, and report crashes.
5. Remind the user of manual steps (re-enable the accessibility service, tap through the changed screen); `adb input tap` is blocked on the Xiaomi test phone.

**Never** run `adb uninstall`, `pm clear` or a factory reset, and never touch accounts or personal data on the phone.
