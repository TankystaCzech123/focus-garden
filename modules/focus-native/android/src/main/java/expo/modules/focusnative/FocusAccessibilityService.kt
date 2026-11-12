package expo.modules.focusnative

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * While focus is on, sends the user back to this app when a visible (launcher) app that is not
 * allowed comes to the foreground. Helper packages (Xiaomi Game Turbo, system UI, keyboards,
 * services without a launcher icon) are never touched, so allowed apps/games run normally.
 */
class FocusAccessibilityService : AccessibilityService() {
  private var launcherApps: Set<String> = emptySet()
  private var homeApps: Set<String> = emptySet()

  override fun onServiceConnected() {
    refreshApps()
    DevLog.add(this, "Služba usnadnění připojena")
  }

  private fun refreshApps() {
    val pm = packageManager
    launcherApps = pm.queryIntentActivities(
      Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0
    ).map { it.activityInfo.packageName }.toSet()
    homeApps = pm.queryIntentActivities(
      Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0
    ).map { it.activityInfo.packageName }.toSet()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    if (!FocusState.isActive(this)) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName) return

    if (pkg in FocusState.allowed(this)) {
      DevLog.add(this, "Povolená aplikace v popředí: $pkg")
      return
    }
    if (pkg in GAME_TURBO) {
      DevLog.add(this, "Xiaomi Game Turbo ($pkg): ve výchozím stavu povoleno, ignoruji")
      return
    }
    if (pkg !in homeApps) {
      if (pkg !in launcherApps) refreshApps() // newly installed app
      if (pkg !in launcherApps) {
        DevLog.add(this, "Pomocné okno bez ikony ($pkg): ignoruji")
        return
      }
    }

    DevLog.add(this, "Nepovolená aplikace $pkg → vracím na Focus")
    Log.d("Focus", "redirect from $pkg")
    packageManager.getLaunchIntentForPackage(packageName)?.let {
      it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
      startActivity(it)
    }
  }

  override fun onInterrupt() {}

  companion object {
    /** Xiaomi Game Turbo / game booster windows that pop up whenever any game starts. */
    val GAME_TURBO = setOf(
      "com.miui.securitycenter",
      "com.miui.gamebooster",
      "com.xiaomi.joyose",
      "miui.systemui.plugin",
    )
  }
}
