package com.takip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.takip.app.ui.HiddenSettingsActivity

class SecretCodeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val launchIntent = Intent(context, HiddenSettingsActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(launchIntent)
    }
}
