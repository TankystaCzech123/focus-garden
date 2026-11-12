package expo.modules.focusnative

import android.content.Context
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Tiny human-readable event log for developers (shown on the Dev Log screen in the app). */
object DevLog {
  private const val MAX_LINES = 200
  private var last = ""
  private fun file(c: Context) = File(c.filesDir, "devlog.txt")

  @Synchronized
  fun add(c: Context, msg: String) {
    if (msg == last) return // skip consecutive duplicates
    last = msg
    val time = SimpleDateFormat("HH:mm:ss", Locale.US).format(Date())
    val f = file(c)
    f.appendText("$time  $msg\n")
    val lines = f.readLines()
    if (lines.size > MAX_LINES * 2) f.writeText(lines.takeLast(MAX_LINES).joinToString("\n") + "\n")
  }

  @Synchronized fun read(c: Context): String = file(c).takeIf { it.exists() }?.readText() ?: ""
  @Synchronized fun clear(c: Context) { file(c).delete(); last = "" }
}
