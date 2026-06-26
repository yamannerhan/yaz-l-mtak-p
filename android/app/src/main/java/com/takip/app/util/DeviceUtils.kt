package com.takip.app.util

import android.annotation.SuppressLint
import android.content.Context
import android.provider.Settings

object DeviceUtils {
    @SuppressLint("HardwareIds")
    fun getAndroidId(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown"
    }
}
