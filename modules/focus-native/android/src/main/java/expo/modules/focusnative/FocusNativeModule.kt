package expo.modules.focusnative

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import java.io.ByteArrayOutputStream
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FocusNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No context")

  private val dpm: DevicePolicyManager
    get() = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

  private val admin: ComponentName
    get() = ComponentName(context, FocusAdminReceiver::class.java)

  private fun isServiceEnabled(): Boolean {
    val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
    val me = ComponentName(context, FocusAccessibilityService::class.java).flattenToString()
    return enabled.split(':').any { it.equals(me, ignoreCase = true) }
  }

  private fun iconBase64(d: android.graphics.drawable.Drawable): String {
    val size = 96
    val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    d.setBounds(0, 0, size, size)
    d.draw(Canvas(bmp))
    val out = ByteArrayOutputStream()
    bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
    return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }

  private val nm: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  /** Do Not Disturb (alarms only) while focus is on; the previous mode is restored on STOP. */
  private fun dndOn() {
    if (!nm.isNotificationPolicyAccessGranted) {
      DevLog.add(context, "Nerušit: přístup není povolen, oznámení se neztlumí")
      return
    }
    FocusState.savePrevFilter(context, nm.currentInterruptionFilter)
    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALARMS)
    DevLog.add(context, "Nerušit zapnuto")
  }

  private fun dndOff() {
    val prev = FocusState.popPrevFilter(context)
    if (prev >= 0 && nm.isNotificationPolicyAccessGranted) {
      nm.setInterruptionFilter(prev)
      DevLog.add(context, "Nerušit vráceno do původního stavu")
    }
  }

  private fun isOwner() = dpm.isDeviceOwnerApp(context.packageName)

  override fun definition() = ModuleDefinition {
    Name("FocusNative")

    // Installed apps with a launcher icon (excluding this app).
    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      pm.queryIntentActivities(intent, 0)
        .filter { it.activityInfo.packageName != context.packageName }
        .distinctBy { it.activityInfo.packageName }
        .map {
          mapOf(
            "id" to it.activityInfo.packageName,
            "label" to it.loadLabel(pm).toString(),
            "icon" to iconBase64(it.loadIcon(pm)),
          )
        }
        .sortedBy { it["label"]?.lowercase() }
    }

    // Android lets us list apps ourselves, iOS needs a system picker.
    Function("needsPicker") { false }

    AsyncFunction("pickApps") { promise: Promise -> promise.resolve(null) }

    // Device Owner: real lock task. Otherwise: the accessibility service keeps the user in allowed apps.
    AsyncFunction("start") { allowed: List<String>, dnd: Boolean ->
      if (isOwner()) {
        val activity = appContext.currentActivity ?: throw IllegalStateException("No activity")
        dpm.setLockTaskPackages(admin, (allowed + context.packageName).toTypedArray())
        dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE)
        activity.startLockTask()
        DevLog.add(context, "START (Device Owner, lock task), povoleno: ${allowed.joinToString()}")
        if (dnd) dndOn()
        mapOf("fullKiosk" to true, "needsAccessibility" to false)
      } else if (!isServiceEnabled()) {
        val i = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(i)
        DevLog.add(context, "START odmítnut: služba usnadnění není zapnutá, otevírám nastavení")
        mapOf("fullKiosk" to false, "needsAccessibility" to true)
      } else {
        FocusState.set(context, true, allowed.toSet())
        DevLog.add(context, "START, povoleno: ${allowed.joinToString()}")
        if (dnd) dndOn()
        mapOf("fullKiosk" to false, "needsAccessibility" to false)
      }
    }

    AsyncFunction("stop") {
      FocusState.set(context, false)
      DevLog.add(context, "STOP")
      dndOff()
      if (isOwner()) {
        appContext.currentActivity?.stopLockTask()
        dpm.setLockTaskPackages(admin, emptyArray())
      }
    }

    Function("isActive") { FocusState.isActive(context) }
    Function("dndGranted") { nm.isNotificationPolicyAccessGranted }
    AsyncFunction("openDndSettings") {
      context.startActivity(
        Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    Function("getDeviceInfo") {
      mapOf("model" to "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}", "android" to android.os.Build.VERSION.RELEASE)
    }

    Function("getVersion") {
      context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "0.0.0"
    }

    // Downloads an APK from this project's GitHub releases and opens the system installer.
    // Android verifies the signature, so only an update signed with the same key can be installed.
    AsyncFunction("downloadAndInstall") { url: String ->
      require(url.startsWith("https://github.com/")) { "Untrusted update URL" }
      if (!context.packageManager.canRequestPackageInstalls()) {
        DevLog.add(context, "Aktualizace: chybí povolení instalace z této aplikace, otevírám nastavení")
        context.startActivity(
          Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
        "needsPermission"
      } else {
        DevLog.add(context, "Aktualizace: stahuji $url")
        val dir = File(context.cacheDir, "updates").apply { deleteRecursively(); mkdirs() }
        val apk = File(dir, "update.apk")
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 15_000
        conn.readTimeout = 30_000
        conn.setRequestProperty("User-Agent", "focus-garden-updater")
        try {
          if (conn.responseCode !in 200..299) throw IOException("HTTP ${conn.responseCode}")
          conn.inputStream.use { input -> apk.outputStream().use { input.copyTo(it) } }
        } finally {
          conn.disconnect()
        }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.focusfileprovider", apk)
        context.startActivity(
          Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        )
        DevLog.add(context, "Aktualizace: stažena (${apk.length() / 1024} kB), spouštím instalátor")
        "started"
      }
    }

    AsyncFunction("getDevLog") { DevLog.read(context) }
    AsyncFunction("clearDevLog") { DevLog.clear(context) }

    AsyncFunction("launchApp") { packageName: String ->
      DevLog.add(context, "Spouštím z dlaždice: $packageName")
      val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        ?: throw IllegalArgumentException("Cannot launch $packageName")
      appContext.currentActivity?.startActivity(intent)
    }
  }
}
