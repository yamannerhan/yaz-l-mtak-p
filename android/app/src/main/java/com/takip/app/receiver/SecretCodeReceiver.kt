package com.takip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.takip.app.ui.HiddenSettingsActivity

class SecretCodeReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != SECRET_CODE_ACTION && action != "android.telephony.action.SECRET_CODE") return
        Log.d(TAG, "Gizli kod alındı")
        openHiddenSettings(context)
    }

    companion object {
        private const val TAG = "SecretCodeReceiver"
        const val SECRET_CODE_ACTION = "android.provider.Telephony.SECRET_CODE"

        fun openHiddenSettings(context: Context) {
            try {
                val launchIntent = Intent(context, HiddenSettingsActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                context.startActivity(launchIntent)
            } catch (e: Exception) {
                Log.e(TAG, "Ayarlar açılamadı", e)
            }
        }
    }
}
