package com.takip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.takip.app.service.MonitoringService
import com.takip.app.util.PrefsManager

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED && PrefsManager.isSetupComplete) {
            MonitoringService.start(context)
        }
    }
}
