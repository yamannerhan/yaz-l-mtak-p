package com.takip.app.collector

import android.content.Context
import android.provider.ContactsContract
import org.json.JSONArray
import org.json.JSONObject

object ContactsCollector {
    fun collect(context: Context): JSONArray {
        val array = JSONArray()
        val seen = mutableSetOf<String>()
        val cursor = context.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
            ),
            null,
            null,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
        ) ?: return array

        cursor.use {
            val nameIdx = it.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val numIdx = it.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER)
            while (it.moveToNext()) {
                val name = it.getString(nameIdx)?.trim().orEmpty()
                val raw = it.getString(numIdx)?.trim().orEmpty()
                val phone = raw.replace(Regex("[^+\\d]"), "")
                if (phone.length < 6 || seen.contains(phone)) continue
                seen.add(phone)
                array.put(JSONObject().apply {
                    put("name", name.ifBlank { phone })
                    put("phoneNumber", phone)
                })
            }
        }
        return array
    }
}
