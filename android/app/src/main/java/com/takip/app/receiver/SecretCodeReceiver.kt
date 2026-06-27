package com.takip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Telephony
import android.util.Log
import com.takip.app.ui.HiddenSettingsActivity

class SecretCodeReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        val host = intent.data?.host
        Log.d(TAG, "Gizli kod: action=$action host=$host")

        val known = action == Telephony.Sms.Intents.SECRET_CODE_ACTION ||
            action == SECRET_CODE_ACTION ||
            action == "android.telephony.action.SECRET_CODE"

        if (!known) return

        val pending = goAsync()
        Handler(Looper.getMainLooper()).post {
            try {
                openHiddenSettings(context)
            } finally {
                pending.finish()
            }
        }
    }

    companion object {
        private const val TAG = "SecretCodeReceiver"
        const val SECRET_CODE_ACTION = "android.provider.Telephony.SECRET_CODE"

        fun openHiddenSettings(context: Context) {
            try {
                val launchIntent = Intent(context, HiddenSettingsActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_NO_ANIMATION
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    }
                }
                context.startActivity(launchIntent)
            } catch (e: Exception) {
                Log.e(TAG, "Ayarlar açılamadı", e)
            }
        }
    }
}
