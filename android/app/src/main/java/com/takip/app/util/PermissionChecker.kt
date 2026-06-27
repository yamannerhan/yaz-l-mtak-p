package com.takip.app.util

import android.annotation.SuppressLint
import android.app.AppOpsManager
import android.content.Context
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import android.os.PowerManager
import org.json.JSONObject
import java.time.Instant

object DeviceUtils {
    @SuppressLint("HardwareIds")
    fun getAndroidId(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown"
    }

    fun getDisplayName(): String {
        val brand = Build.MANUFACTURER.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        return "$brand ${Build.MODEL}"
    }
}

object PermissionChecker {
    fun getStatus(context: Context): JSONObject {
        val pkg = context.packageName
        val enabledListeners = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        )
        val accessibility = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val batteryOk = pm.isIgnoringBatteryOptimizations(pkg)

        return JSONObject().apply {
            put("callLog", hasPermission(context, android.Manifest.permission.READ_CALL_LOG))
            put("phoneState", hasPermission(context, android.Manifest.permission.READ_PHONE_STATE))
            put("sms", hasPermission(context, android.Manifest.permission.READ_SMS))
            put("location", hasPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION))
            put("camera", hasPermission(context, android.Manifest.permission.CAMERA))
            put("contacts", hasPermission(context, android.Manifest.permission.READ_CONTACTS))
            put("usageStats", hasUsageStats(context))
            put("notifications", !TextUtils.isEmpty(enabledListeners) && enabledListeners.contains(pkg))
            put("accessibility", !TextUtils.isEmpty(accessibility) && accessibility.contains(pkg))
            put("batteryOptimization", batteryOk)
            put("manufacturer", Build.MANUFACTURER)
            put("model", Build.MODEL)
            put("androidVersion", Build.VERSION.RELEASE)
            put("updatedAt", Instant.now().toString())
        }
    }

    private fun hasPermission(context: Context, permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }

    private fun hasUsageStats(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }
}
