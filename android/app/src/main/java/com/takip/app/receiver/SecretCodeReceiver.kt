package com.takip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.takip.app.ui.HiddenSettingsActivity

class SecretCodeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Telephony.SecretCode.ACTION_SECRET_CODE) return
        openHiddenSettings(context)
    }

    companion object {
        fun openHiddenSettings(context: Context) {
            val launchIntent = Intent(context, HiddenSettingsActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            context.startActivity(launchIntent)
        }
    }
}
