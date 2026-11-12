---
paths:
  - "modules/focus-native/ios/**"
---

# iOS native module

- Use the Screen Time (Family Controls) APIs only; the app never learns which apps the user picked.
- No iOS device has been available: never report iOS behaviour as verified. Say "builds in the simulator" at most.
- Functions that do not exist on iOS return an explicit `unsupported`, never fake success.
