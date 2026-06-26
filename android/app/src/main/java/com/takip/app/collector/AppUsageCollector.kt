package com.takip.app.collector

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

object AppUsageCollector {
    fun collect(context: Context): JSONArray {
        val array = JSONArray()
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return array
        val pm = context.packageManager

        val end = System.currentTimeMillis()
        val start = end - 24 * 60 * 60 * 1000
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end) ?: return array

        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val today = dateFormat.format(Calendar.getInstance().time)

        for (stat in stats) {
            if (stat.totalTimeInForeground <= 0) continue
            val minutes = (stat.totalTimeInForeground / 60000).toInt()
            if (minutes < 1) continue

            val appName = try {
                pm.getApplicationLabel(pm.getApplicationInfo(stat.packageName, 0)).toString()
            } catch (_: PackageManager.NameNotFoundException) {
                stat.packageName
            }

            array.put(JSONObject().apply {
                put("packageName", stat.packageName)
                put("appName", appName)
                put("usageMinutes", minutes)
                put("date", today)
            })
        }
        return array
    }
}
