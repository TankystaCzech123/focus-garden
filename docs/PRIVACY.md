# Privacy

Focus Garden is built to be private by design.

- **No accounts, no analytics, no ads, no tracking.**
- **No data leaves your phone.** The app contains no code that sends your data to a server. Everything (chosen apps,
  focus minutes, streak, coins, garden, settings) is stored locally on your device and is deleted when you uninstall the app.
- **Permissions and why they exist**

| Permission / capability | Platform | Purpose |
| --- | --- | --- |
| Accessibility service | Android | Detect *which app is in the foreground* so non-allowed apps can be sent back to the app. It does **not** read screen content (`canRetrieveWindowContent=false`) and does not record anything. |
| Query installed launcher apps | Android | Show the list of apps you can allow. |
| Notification policy access (Do Not Disturb) | Android | Optional. Mute notifications during focus and restore your previous mode afterwards. |
| Family Controls / Screen Time | iOS | Choose and shield apps through Apple's system picker. Apple does not reveal which apps you picked to the app. |
| `INTERNET`, `VIBRATE`, `SYSTEM_ALERT_WINDOW` | Android | Declared by the Expo development client / React Native framework. The app itself makes no network requests. |

- **Dev Log** is a local text log (last ~200 events) shown inside the app. It never leaves the device unless you copy it yourself, for example into a bug report. It contains package names of apps you opened during focus mode, so review it before sharing.

Questions or concerns? Open an issue or see [SECURITY.md](../SECURITY.md).
