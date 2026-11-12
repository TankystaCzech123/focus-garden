package expo.modules.focusnative

import android.content.Context

/** Focus on/off + allowed packages. Persisted so it survives process death. */
object FocusState {
  private fun prefs(c: Context) = c.getSharedPreferences("focus", Context.MODE_PRIVATE)

  fun set(c: Context, active: Boolean, allowed: Set<String> = emptySet()) {
    prefs(c).edit().putBoolean("active", active).putStringSet("allowed", allowed).apply()
  }

  fun isActive(c: Context) = prefs(c).getBoolean("active", false)
  fun allowed(c: Context): Set<String> = prefs(c).getStringSet("allowed", emptySet()) ?: emptySet()

  fun savePrevFilter(c: Context, filter: Int) = prefs(c).edit().putInt("prevFilter", filter).apply()

  /** Returns the saved Do Not Disturb filter (and forgets it), or -1 if none. */
  fun popPrevFilter(c: Context): Int {
    val v = prefs(c).getInt("prevFilter", -1)
    prefs(c).edit().remove("prevFilter").apply()
    return v
  }
}
