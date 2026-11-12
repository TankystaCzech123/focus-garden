---
paths:
  - "modules/focus-native/android/**"
---

# Android native module

- The accessibility service reads only the foreground package name (`canRetrieveWindowContent=false`). Never read screen content.
- Every new permission needs a reason in `docs/PRIVACY.md` in the same commit.
- Network only to the `github.com` / `api.github.com` allowlist; reject any other host before opening a connection.
- Never swallow exceptions silently: log to DevLog and return a clear error to JS.
- Xiaomi Game Turbo packages stay in the ignored set; verify focus changes against live logcat on a device.
- Downloaded files go to the app cache, are opened via FileProvider, and are never executed by other means.
