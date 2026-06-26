package com.takip.app

import android.app.Application

class TakipApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: TakipApplication
            private set
    }
}
