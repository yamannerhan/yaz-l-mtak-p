package com.takip.app.util

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object ConfigManager {
    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private const val REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000L // 6 saat

    fun discoverApiUrl(panelUrl: String): Result<String> = runCatching {
        val base = normalizeUrl(panelUrl)
        val paths = listOf("/config.json", "/config")

        var lastError: Exception? = null
        for (path in paths) {
            try {
                val url = "$base$path"
                val request = Request.Builder().url(url).get().build()
                val response = client.newCall(request).execute()
                val body = response.body?.string() ?: throw Exception("Boş yanıt")
        if (!response.isSuccessful) {
                    throw Exception("HTTP ${response.code} — $url")
                }
                val json = JSONObject(body)
                val apiUrl = normalizeUrl(json.getString("apiBaseUrl"))
                PrefsManager.panelUrl = base
                PrefsManager.apiBaseUrl = apiUrl
                PrefsManager.configLastFetch = System.currentTimeMillis()
                return@runCatching apiUrl
            } catch (e: Exception) {
                lastError = e
            }
        }
        throw lastError ?: Exception("Sunucu bulunamadı. Panel adresini kontrol edin.")
    }

    fun getApiBaseUrl(): String {
        refreshIfStale()
        return PrefsManager.apiBaseUrl
            ?: throw IllegalStateException("API adresi ayarlanmamış. Kurulumu tamamlayın.")
    }

    fun refreshIfStale() {
        val panelUrl = PrefsManager.panelUrl ?: return
        val lastFetch = PrefsManager.configLastFetch
        if (System.currentTimeMillis() - lastFetch < REFRESH_INTERVAL_MS) return
        try {
            discoverApiUrl(panelUrl)
        } catch (_: Exception) {
            // Eski adresle devam et
        }
    }

    private fun normalizeUrl(url: String): String {
        var normalized = url.trim()
        if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
            normalized = "https://$normalized"
        }
        return normalized.removeSuffix("/")
    }
}
