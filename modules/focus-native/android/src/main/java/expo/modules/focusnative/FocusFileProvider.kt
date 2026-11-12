package expo.modules.focusnative

import androidx.core.content.FileProvider

/** Own subclass so it never clashes with another FileProvider declared by the app. */
class FocusFileProvider : FileProvider()
