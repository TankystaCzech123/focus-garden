# Privacy

Focus Garden is built to be private by design.

- **No accounts, no analytics, no ads, no tracking.**
- **No personal data leaves your phone.** The only network request is the optional update check (see below); it sends no data about you. Everything (chosen apps,
  focus minutes, streak, coins, garden, settings) is stored locally on your device and is deleted when you uninstall the app.
- **Permissions and why they exist**

| Permission / capability | Platform | Purpose |
| --- | --- | --- |
| Accessibility service | Android | Detect *which app is in the foreground* so non-allowed apps can be sent back to the app. It does **not** read screen content (`canRetrieveWindowContent=false`) and does not record anything. |
| Query installed launcher apps | Android | Show the list of apps you can allow. |
| Notification policy access (Do Not Disturb) | Android | Optional. Mute notifications during focus and restore your previous mode afterwards. |
| Family Controls / Screen Time | iOS | Choose and shield apps through Apple's system picker. Apple does not reveal which apps you picked to the app. |
| `INTERNET` | Android | Check GitHub for a newer release and download its APK (this repository only; the check can be turned off in Settings). |
| `REQUEST_INSTALL_PACKAGES` | Android | Hand the downloaded APK to Android's installer when you tap *Install update*. You must allow it once. |
| `VIBRATE`, `SYSTEM_ALERT_WINDOW` | Android | Declared by the Expo / React Native framework. |

- **Profile share card** is rendered locally as an image. It is only shared if you choose a target in the system share sheet.
- **Dev Log** is a local text log (last ~200 events) shown inside the app. It leaves the device only if you copy it yourself, for example into a bug report. It contains package names of apps you opened during focus mode, so review it before sharing.

Questions or concerns? Open an issue or see [SECURITY.md](../SECURITY.md).
