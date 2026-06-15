package com.vocalpaper.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class VocalPaperApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
