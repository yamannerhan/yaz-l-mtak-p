package com.takip.app

import android.app.Application
import com.takip.app.service.MonitoringService
import com.takip.app.util.PrefsManager

class TakipApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
        if (PrefsManager.isSetupComplete) {
            MonitoringService.start(this)
        }
    }

    companion object {
        lateinit var instance: TakipApplication
            private set
    }
}
