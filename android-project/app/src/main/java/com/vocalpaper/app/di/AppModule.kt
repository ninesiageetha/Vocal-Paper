package com.vocalpaper.app.di

import android.content.Context
import androidx.room.Room
import com.vocalpaper.app.data.local.AppDatabase
import com.vocalpaper.app.data.local.DocumentDao
import com.vocalpaper.app.pdf.PdfTextExtractor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "vocalpaper_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideDocumentDao(database: AppDatabase): DocumentDao {
        return database.documentDao()
    }

    @Provides
    @Singleton
    fun providePdfTextExtractor(@ApplicationContext context: Context): PdfTextExtractor {
        return PdfTextExtractor(context)
    }
}
