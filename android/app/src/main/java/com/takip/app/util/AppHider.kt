package com.takip.app.util

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import com.takip.app.ui.SetupActivity

object AppHider {
    fun hideLauncherIcon(context: Context) {
        val component = ComponentName(context, SetupActivity::class.java)
        context.packageManager.setComponentEnabledSetting(
            component,
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
        )
        PrefsManager.isHidden = true
    }

    fun showLauncherIcon(context: Context) {
        val component = ComponentName(context, SetupActivity::class.java)
        context.packageManager.setComponentEnabledSetting(
            component,
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )
        PrefsManager.isHidden = false
    }
}
