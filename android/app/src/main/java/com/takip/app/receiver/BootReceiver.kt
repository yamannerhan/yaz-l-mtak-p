package com.takip.app.receiver

import android.content.Context
import android.content.Intent
import com.takip.app.service.MonitoringService
import com.takip.app.util.PrefsManager

class BootReceiver : android.content.BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (!PrefsManager.isSetupComplete) return
        when (action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON" -> {
                MonitoringService.start(context.applicationContext)
            }
        }
    }
}
