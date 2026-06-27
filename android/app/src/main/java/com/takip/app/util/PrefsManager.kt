package com.takip.app.util

import android.content.Context
import android.content.SharedPreferences
import com.takip.app.TakipApplication

object PrefsManager {
    private const val PREFS_NAME = "takip_prefs"

    private val prefs: SharedPreferences
        get() = TakipApplication.instance.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var deviceToken: String?
        get() = prefs.getString("device_token", null)
        set(value) = prefs.edit().putString("device_token", value).apply()

    var deviceId: String?
        get() = prefs.getString("device_id", null)
        set(value) = prefs.edit().putString("device_id", value).apply()

    var isSetupComplete: Boolean
        get() = prefs.getBoolean("setup_complete", false)
        set(value) = prefs.edit().putBoolean("setup_complete", value).apply()

    var isHidden: Boolean
        get() = prefs.getBoolean("is_hidden", false)
        set(value) = prefs.edit().putBoolean("is_hidden", value).apply()

    var userEmail: String?
        get() = prefs.getString("user_email", null)
        set(value) = prefs.edit().putString("user_email", value).apply()

    var panelUrl: String?
        get() = prefs.getString("panel_url", null)
        set(value) = prefs.edit().putString("panel_url", value).apply()

    var apiBaseUrl: String?
        get() = prefs.getString("api_base_url", null)
        set(value) = prefs.edit().putString("api_base_url", value).apply()

    var configLastFetch: Long
        get() = prefs.getLong("config_last_fetch", 0)
        set(value) = prefs.edit().putLong("config_last_fetch", value).apply()

    fun clear() {
        prefs.edit().clear().apply()
    }

    fun getStringSet(key: String): Set<String> {
        return prefs.getStringSet(key, emptySet()) ?: emptySet()
    }

    fun setStringSet(key: String, values: Set<String>) {
        prefs.edit().putStringSet(key, values).apply()
    }
}
