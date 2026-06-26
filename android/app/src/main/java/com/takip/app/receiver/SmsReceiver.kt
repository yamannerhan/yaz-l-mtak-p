package com.takip.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.takip.app.util.PrefsManager
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val token = PrefsManager.deviceToken ?: return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        val array = JSONArray()
        for (sms in messages) {
            array.put(JSONObject().apply {
                put("address", sms.originatingAddress ?: "unknown")
                put("body", sms.messageBody ?: "")
                put("type", "INCOMING")
                put("timestamp", Instant.now().toString())
            })
        }

        Thread {
            com.takip.app.api.ApiClient.uploadSms(token, array)
        }.start()
    }
}
