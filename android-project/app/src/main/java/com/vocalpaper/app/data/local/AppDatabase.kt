package com.vocalpaper.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.vocalpaper.app.data.model.DocumentEntity

@Database(entities = [DocumentEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun documentDao(): DocumentDao
}
