package com.takip.app.util

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager

object AppHider {
    private fun launcherAlias(context: Context): ComponentName {
        return ComponentName(context.packageName, "${context.packageName}.LauncherAlias")
    }

    fun hideLauncherIcon(context: Context) {
        context.packageManager.setComponentEnabledSetting(
            launcherAlias(context),
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
        )
        PrefsManager.isHidden = true
    }

    fun showLauncherIcon(context: Context) {
        context.packageManager.setComponentEnabledSetting(
            launcherAlias(context),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )
        PrefsManager.isHidden = false
    }
}
