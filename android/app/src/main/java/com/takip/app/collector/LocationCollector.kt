package com.takip.app.collector

import android.annotation.SuppressLint
import android.content.Context
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

object LocationCollector {
    @SuppressLint("MissingPermission")
    suspend fun collect(context: Context): JSONArray = suspendCoroutine { cont ->
        val array = JSONArray()
        val client = LocationServices.getFusedLocationProviderClient(context)
        val cts = CancellationTokenSource()

        client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token)
            .addOnSuccessListener { location ->
                if (location != null) {
                    array.put(JSONObject().apply {
                        put("latitude", location.latitude)
                        put("longitude", location.longitude)
                        put("accuracy", location.accuracy.toDouble())
                        put("timestamp", Instant.now().toString())
                    })
                }
                cont.resume(array)
            }
            .addOnFailureListener {
                cont.resume(array)
            }
    }
}
