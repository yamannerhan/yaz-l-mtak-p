package com.takip.app.collector

import android.content.Context
import android.provider.CallLog
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

object CallCollector {
    private var lastSyncTime = 0L
    private var pendingSyncTime = 0L

    fun collect(context: Context): JSONArray {
        val array = JSONArray()
        pendingSyncTime = 0L
        val since = if (lastSyncTime > 0) lastSyncTime else System.currentTimeMillis() - 24 * 60 * 60 * 1000

        val cursor = context.contentResolver.query(
            CallLog.Calls.CONTENT_URI,
            arrayOf(
                CallLog.Calls.NUMBER,
                CallLog.Calls.CACHED_NAME,
                CallLog.Calls.TYPE,
                CallLog.Calls.DURATION,
                CallLog.Calls.DATE
            ),
            "${CallLog.Calls.DATE} > ?",
            arrayOf(since.toString()),
            "${CallLog.Calls.DATE} DESC"
        ) ?: return array

        cursor.use {
            while (it.moveToNext()) {
                val type = when (it.getInt(it.getColumnIndexOrThrow(CallLog.Calls.TYPE))) {
                    CallLog.Calls.INCOMING_TYPE -> "INCOMING"
                    CallLog.Calls.OUTGOING_TYPE -> "OUTGOING"
                    CallLog.Calls.MISSED_TYPE -> "MISSED"
                    else -> "INCOMING"
                }
                val dateMs = it.getLong(it.getColumnIndexOrThrow(CallLog.Calls.DATE))
                val timestamp = Instant.ofEpochMilli(dateMs)
                    .atOffset(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_INSTANT)

                array.put(JSONObject().apply {
                    put("number", it.getString(it.getColumnIndexOrThrow(CallLog.Calls.NUMBER)) ?: "")
                    put("contactName", it.getString(it.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME)))
                    put("type", type)
                    put("durationSeconds", it.getInt(it.getColumnIndexOrThrow(CallLog.Calls.DURATION)))
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
