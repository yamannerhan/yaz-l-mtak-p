package com.takip.app.collector

import android.content.Context
import android.content.pm.PackageManager
import com.takip.app.util.PrefsManager
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

object InstalledAppsCollector {
    private const val PREFS_KEY = "known_packages"

    fun collect(context: Context): JSONArray {
        val pm = context.packageManager
        val current = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            .mapNotNull { info ->
                if (info.packageName == context.packageName) return@mapNotNull null
                val label = try {
                    pm.getApplicationLabel(info).toString()
                } catch (_: Exception) {
                    info.packageName
                }
                info.packageName to label
            }
            .toMap()

        val saved = PrefsManager.getStringSet(PREFS_KEY)
        val array = JSONArray()
        val now = Instant.now().toString()

        if (saved.isEmpty()) {
            for ((pkg, name) in current) {
                array.put(appJson(pkg, name, "snapshot", now))
            }
        } else {
            for ((pkg, name) in current) {
                if (!saved.contains(pkg)) {
                    array.put(appJson(pkg, name, "installed", now))
                }
            }
            for (pkg in saved) {
                if (!current.containsKey(pkg)) {
                    array.put(appJson(pkg, pkg, "removed", now))
                }
            }
        }

        PrefsManager.setStringSet(PREFS_KEY, current.keys)
        return array
    }

    private fun appJson(packageName: String, appName: String, action: String, timestamp: String): JSONObject {
        return JSONObject().apply {
            put("packageName", packageName)
            put("appName", appName)
            put("action", action)
            put("timestamp", timestamp)
        }
    }
}
