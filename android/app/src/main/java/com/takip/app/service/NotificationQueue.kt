package com.takip.app.service

import org.json.JSONArray
import org.json.JSONObject
import java.util.Collections

object NotificationQueue {
    private val queue = Collections.synchronizedList(mutableListOf<JSONObject>())

    fun add(packageName: String, appName: String?, title: String?, text: String?) {
        if (packageName == "com.takip.app") return
        val body = text?.trim().orEmpty()
        val heading = title?.trim().orEmpty()
        if (body.isEmpty() && heading.isEmpty()) return

        queue.add(JSONObject().apply {
            put("appPackage", packageName)
            put("appName", appName)
            put("title", title)
            put("text", text)
            put("timestamp", java.time.Instant.now().toString())
        })
    }

    fun snapshot(): JSONArray {
        val array = JSONArray()
        synchronized(queue) {
            queue.forEach { array.put(it) }
        }
        return array
    }

    fun clear() {
        synchronized(queue) { queue.clear() }
    }
}
