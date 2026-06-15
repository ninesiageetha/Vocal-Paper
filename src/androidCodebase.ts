export interface AndroidFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'json' | 'markdown';
  category: string;
  content: string;
}

export const androidCodebase: AndroidFile[] = [
  {
    path: "app/build.gradle.kts",
    name: "build.gradle.kts (Module)",
    language: "kotlin",
    category: "Gradle",
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
}

android {
    namespace = "com.vocalpaper.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.vocalpaper.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Jetpack Compose (Material 3)
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.6")

    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    // Dagger Hilt
    val hiltVersion = "2.50"
    implementation("dagger.hilt:hilt-android:$hiltVersion")
    kapt("dagger.hilt:hilt-compiler:$hiltVersion")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // PDFBox-Android (for parsing PDFs)
    implementation("com.tom_roush:pdfbox-android:2.0.27.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.01.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}`
  },
  {
    path: "build.gradle.kts",
    name: "build.gradle.kts (Project)",
    language: "kotlin",
    category: "Gradle",
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
    id("dagger.hilt.android") version "2.50" apply false
    id("kotlin-kapt") version "1.9.22" apply false
}`
  },
  {
    path: "app/src/main/AndroidManifest.xml",
    name: "AndroidManifest.xml",
    language: "xml",
    category: "Manifest",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permissions for storage and audio tasks -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

    <application
        android:name=".VocalPaperApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.VocalPaper"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.VocalPaper">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Media Playback Service to support reading in the background -->
        <service
            android:name=".tts.TtsPlaybackService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

    </application>
</manifest>`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/VocalPaperApplication.kt",
    name: "VocalPaperApplication.kt",
    language: "kotlin",
    category: "Application",
    content: `package com.vocalpaper.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class VocalPaperApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/MainActivity.kt",
    name: "MainActivity.kt",
    language: "kotlin",
    category: "Presentation",
    content: `package com.vocalpaper.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vocalpaper.app.ui.screens.LibraryScreen
import com.vocalpaper.app.ui.screens.ReaderScreen
import com.vocalpaper.app.ui.screens.SettingsScreen
import com.vocalpaper.app.ui.theme.VocalPaperTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VocalPaperTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavHost(navController = navController, startDestination = "library") {
                        composable("library") {
                            LibraryScreen(
                                onNavigateToReader = { documentId ->
                                    navController.navigate("reader/$documentId")
                                },
                                onNavigateToSettings = {
                                    navController.navigate("settings")
                                }
                            )
                        }
                        composable("reader/{documentId}") { backStackEntry ->
                            val documentId = backStackEntry.arguments?.getString("documentId")?.toLongOrNull() ?: -1L
                            ReaderScreen(
                                documentId = documentId,
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }
                        composable("settings") {
                            SettingsScreen(
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/data/model/DocumentEntity.kt",
    name: "DocumentEntity.kt",
    language: "kotlin",
    category: "Data",
    content: `package com.vocalpaper.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable

@Entity(tableName = "documents")
data class DocumentEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val filePath: String?,
    val fileSize: Long,
    val dateAdded: Long,
    val fullText: String,
    val lastPositionParagraph: Int = 0,
    val lastPositionCharOffset: Int = 0,
    val speechRate: Float = 1.0f,
    val voiceLocale: String = "en"
) : Serializable`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/data/local/DocumentDao.kt",
    name: "DocumentDao.kt",
    language: "kotlin",
    category: "Data",
    content: `package com.vocalpaper.app.data.local

import androidx.room.*
import com.vocalpaper.app.data.model.DocumentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DocumentDao {
    @Query("SELECT * FROM documents ORDER BY dateAdded DESC")
    fun getAllDocuments(): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents WHERE id = :id LIMIT 1")
    suspend fun getDocumentById(id: Long): DocumentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDocument(document: DocumentEntity): Long

    @Update
    suspend fun updateDocument(document: DocumentEntity)

    @Delete
    suspend fun deleteDocument(document: DocumentEntity)

    @Query("UPDATE documents SET lastPositionParagraph = :paragraphIndex, lastPositionCharOffset = :charOffset WHERE id = :id")
    suspend fun updateReadingProgress(id: Long, paragraphIndex: Int, charOffset: Int)
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/data/local/AppDatabase.kt",
    name: "AppDatabase.kt",
    language: "kotlin",
    category: "Data",
    content: `package com.vocalpaper.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.vocalpaper.app.data.model.DocumentEntity

@Database(entities = [DocumentEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun documentDao(): DocumentDao
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/di/AppModule.kt",
    name: "AppModule.kt",
    language: "kotlin",
    category: "DI",
    content: `package com.vocalpaper.app.di

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
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/pdf/PdfTextExtractor.kt",
    name: "PdfTextExtractor.kt",
    language: "kotlin",
    category: "PDF",
    content: `package com.vocalpaper.app.pdf

import android.content.Context
import android.net.Uri
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream

class PdfTextExtractor(private val context: Context) {
    init {
        // Initialize PDFBox libraries for Android
        PDFBoxResourceLoader.init(context)
    }

    /**
     * Extracts all raw text from a PDF and returns it.
     * Uses background Dispatchers.IO to maintain smooth UI and prevent freezing.
     */
    suspend fun extractTextFromPdf(uri: Uri): String = withContext(Dispatchers.IO) {
        var inputStream: InputStream? = null
        var document: PDDocument? = null
        try {
            inputStream = context.contentResolver.openInputStream(uri)
                ?: throw IllegalArgumentException("Could not open input stream for current document")
            
            document = PDDocument.load(inputStream)
            val stripper = PDFTextStripper()
            stripper.startPage = 1
            stripper.endPage = document.numberOfPages
            
            val extractedText = stripper.getText(document)
            if (extractedText.isNullOrBlank()) {
                throw IllegalStateException("PDF contains no readable text content.")
            }
            extractedText
        } catch (e: Exception) {
            e.printStackTrace()
            ""
        } finally {
            try {
                document?.close()
                inputStream?.close()
            } catch (e: Exception) {
                // Secondary logging
            }
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/tts/TtsManager.kt",
    name: "TtsManager.kt",
    language: "kotlin",
    category: "TTS",
    content: `package com.vocalpaper.app.tts

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.Locale

class TtsManager(
    private val context: Context,
    private val onInitSuccess: () -> Unit
) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    var isInitialized = false
        private set

    private val _isReading = MutableStateFlow(false)
    val isReading: StateFlow<Boolean> = _isReading

    private val _currentParagraphIndex = MutableStateFlow(0)
    val currentParagraphIndex: StateFlow<Int> = _currentParagraphIndex

    private val _currentWordHighlight = MutableStateFlow<HighlightBounds?>(null)
    val currentWordHighlight: StateFlow<HighlightBounds?> = _currentWordHighlight

    // Custom Callback invoked as words or boundaries are matched
    var onHighlightUpdate: ((paragraphIndex: Int, startChar: Int, endChar: Int) -> Unit)? = null
    var onPlaybackCompleted: (() -> Unit)? = null

    data class HighlightBounds(val startChar: Int, val endChar: Int)

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true
            tts?.language = Locale.getDefault()
            setupProgressListener()
            onInitSuccess()
        }
    }

    private fun setupProgressListener() {
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                _isReading.value = true
                utteranceId?.toIntOrNull()?.let { index ->
                    _currentParagraphIndex.value = index
                }
            }

            override fun onDone(utteranceId: String?) {
                _currentWordHighlight.value = null
            }

            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                _isReading.value = false
            }

            override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) {
                super.onRangeStart(utteranceId, start, end, frame)
                val paragraphIdx = utteranceId?.toIntOrNull() ?: 0
                _currentWordHighlight.value = HighlightBounds(start, end)
                onHighlightUpdate?.invoke(paragraphIdx, start, end)
            }
        })
    }

    fun speak(paragraphs: List<String>, startIndex: Int) {
        if (!isInitialized) return
        stop()
        _isReading.value = true
        for (i in startIndex until paragraphs.size) {
            val utteranceId = i.toString()
            tts?.speak(
                paragraphs[i],
                TextToSpeech.QUEUE_ADD,
                null,
                utteranceId
            )
        }
    }

    fun pause() {
        if (isInitialized) {
            tts?.stop()
            _isReading.value = false
        }
    }

    fun stop() {
        if (isInitialized) {
            tts?.stop()
            _isReading.value = false
            _currentWordHighlight.value = null
            _currentParagraphIndex.value = 0
        }
    }

    fun setSpeed(speed: Float) {
        if (isInitialized) {
            tts?.setSpeechRate(speed)
        }
    }

    fun setVoice(voiceName: String) {
        if (!isInitialized) return
        tts?.voices?.find { it.name == voiceName }?.let { targetVoice ->
            tts?.voice = targetVoice
        }
    }

    fun getAvailableVoices(): List<Voice> {
        return if (isInitialized) {
            tts?.voices?.toList() ?: emptyList()
        } else {
            emptyList()
        }
    }

    fun release() {
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/presentation/LibraryViewModel.kt",
    name: "LibraryViewModel.kt",
    language: "kotlin",
    category: "Presentation",
    content: `package com.vocalpaper.app.presentation

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vocalpaper.app.data.local.DocumentDao
import com.vocalpaper.app.data.model.DocumentEntity
import com.vocalpaper.app.pdf.PdfTextExtractor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader
import javax.inject.Inject

@HiltViewModel
class LibraryViewModel @Inject constructor(
    private val documentDao: DocumentDao,
    private val pdfExtractor: PdfTextExtractor
) : ViewModel() {

    val documentsList: StateFlow<List<DocumentEntity>> = documentDao.getAllDocuments()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun importDecoder(context: Context, uri: Uri) {
        viewModelScope.launch {
            val contentResolver = context.contentResolver
            var fileName = "Imported_" + System.currentTimeMillis()
            var fileSize = 0L

            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (cursor.moveToFirst()) {
                    if (nameIndex != -1) fileName = cursor.getString(nameIndex)
                    if (sizeIndex != -1) fileSize = cursor.getLong(sizeIndex)
                }
            }

            val fileContent = if (fileName.endsWith(".pdf", ignoreCase = true)) {
                pdfExtractor.extractTextFromPdf(uri)
            } else {
                // Read plan text
                val stringBuilder = StringBuilder()
                contentResolver.openInputStream(uri)?.use { inputStream ->
                    BufferedReader(InputStreamReader(inputStream)).use { reader ->
                        var line: String? = reader.readLine()
                        while (line != null) {
                            stringBuilder.append(line).append("\\n")
                            line = reader.readLine()
                        }
                    }
                }
                stringBuilder.toString()
            }

            if (fileContent.isNotEmpty()) {
                val newDoc = DocumentEntity(
                    title = fileName,
                    filePath = uri.toString(),
                    fileSize = fileSize,
                    dateAdded = System.currentTimeMillis(),
                    fullText = fileContent
                )
                documentDao.insertDocument(newDoc)
            }
        }
    }

    fun deleteDocument(document: DocumentEntity) {
        viewModelScope.launch {
            documentDao.deleteDocument(document)
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/presentation/ReaderViewModel.kt",
    name: "ReaderViewModel.kt",
    language: "kotlin",
    category: "Presentation",
    content: `package com.vocalpaper.app.presentation

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vocalpaper.app.data.local.DocumentDao
import com.vocalpaper.app.data.model.DocumentEntity
import com.vocalpaper.app.tts.TtsManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReaderViewModel @Inject constructor(
    private val documentDao: DocumentDao
) : ViewModel() {

    private var ttsManager: TtsManager? = null

    private val _documentState = MutableStateFlow<DocumentEntity?>(null)
    val documentState: StateFlow<DocumentEntity?> = _documentState

    private val _paragraphs = MutableStateFlow<List<String>>(emptyList())
    val paragraphs: StateFlow<List<String>> = _paragraphs

    private val _currentActiveParagraph = MutableStateFlow(0)
    val currentActiveParagraph: StateFlow<Int> = _currentActiveParagraph

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying

    private val _currentSpeed = MutableStateFlow(1.0f)
    val currentSpeed: StateFlow<Float> = _currentSpeed

    private val _highlightRange = MutableStateFlow<TtsManager.HighlightBounds?>(null)
    val highlightRange: StateFlow<TtsManager.HighlightBounds?> = _highlightRange

    fun loadDocument(context: Context, id: Long, onTtsReady: () -> Unit) {
        viewModelScope.launch {
            val doc = documentDao.getDocumentById(id)
            if (doc != null) {
                _documentState.value = doc
                _currentSpeed.value = doc.speechRate
                _currentActiveParagraph.value = doc.lastPositionParagraph
                
                // Segment content by paragraphs or sentence sequences
                val rawParagraphs = doc.fullText.split(Regex("[\\n\\r]+"))
                    .map { it.trim() }
                    .filter { it.isNotEmpty() }
                _paragraphs.value = rawParagraphs

                // Setup local TTS
                ttsManager = TtsManager(context) {
                    ttsManager?.setSpeed(doc.speechRate)
                    onTtsReady()
                }

                // Attach progress listener
                ttsManager?.onHighlightUpdate = { paragraphIndex, startChar, endChar ->
                    _currentActiveParagraph.value = paragraphIndex
                    _highlightRange.value = TtsManager.HighlightBounds(startChar, endChar)
                    // Auto-persist reading position
                    saveProgress(id, paragraphIndex, startChar)
                }
            }
        }
    }

    fun togglePlayback() {
        val manager = ttsManager ?: return
        if (_isPlaying.value) {
            manager.pause()
            _isPlaying.value = false
        } else {
            val list = _paragraphs.value
            if (list.isNotEmpty()) {
                val startIdx = _currentActiveParagraph.value.coerceIn(0, list.size - 1)
                manager.speak(list, startIdx)
                _isPlaying.value = true
            }
        }
    }

    fun jumpToParagraph(index: Int) {
        val manager = ttsManager ?: return
        val list = _paragraphs.value
        if (index in list.indices) {
            _currentActiveParagraph.value = index
            _highlightRange.value = null
            if (_isPlaying.value) {
                manager.speak(list, index)
            } else {
                saveProgress(_documentState.value?.id ?: 0L, index, 0)
            }
        }
    }

    fun setSpeed(speed: Float) {
        _currentSpeed.value = speed
        ttsManager?.setSpeed(speed)
        viewModelScope.launch {
            _documentState.value?.let { doc ->
                val updated = doc.copy(speechRate = speed)
                documentDao.updateDocument(updated)
                _documentState.value = updated
            }
        }
    }

    fun stopPlayback() {
        ttsManager?.stop()
        _isPlaying.value = false
        _highlightRange.value = null
    }

    private fun saveProgress(docId: Long, paragraphIndex: Int, charOffset: Int) {
        if (docId == 0L) return
        viewModelScope.launch {
            documentDao.updateReadingProgress(docId, paragraphIndex, charOffset)
        }
    }

    override fun onCleared() {
        super.onCleared()
        ttsManager?.release()
        ttsManager = null
    }
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/ui/theme/Color.kt",
    name: "Color.kt",
    language: "kotlin",
    category: "Ui",
    content: `package com.vocalpaper.app.ui.theme

import androidx.compose.ui.graphics.Color

val Blue80 = Color(0xFFADC6FF)
val BlueGrey80 = Color(0xFFBAC3FF)
val Coral80 = Color(0xFFFFB4A2)

val Blue40 = Color(0xFF225FAF)
val BlueGrey40 = Color(0xFF4C5D8A)
val Coral40 = Color(0xFF9C422A)

// Custom highlighted states
val HighlightLighterGreen = Color(0x3841D888)
val HighlightDarkerYellow = Color(0x4CFFDE00)`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/ui/theme/Theme.kt",
    name: "Theme.kt",
    language: "kotlin",
    category: "Ui",
    content: `package com.vocalpaper.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = Blue80,
    secondary = BlueGrey80,
    tertiary = Coral80
)

private val LightColorScheme = lightColorScheme(
    primary = Blue40,
    secondary = BlueGrey40,
    tertiary = Coral40
)

@Composable
fun VocalPaperTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/ui/screens/LibraryScreen.kt",
    name: "LibraryScreen.kt",
    language: "kotlin",
    category: "Ui",
    content: `package com.vocalpaper.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.vocalpaper.app.data.model.DocumentEntity
import com.vocalpaper.app.presentation.LibraryViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(
    onNavigateToReader: (Long) -> Unit,
    onNavigateToSettings: () -> Unit,
    viewModel: LibraryViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val documents by viewModel.documentsList.collectAsState()

    // File selection intent launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.importDecoder(context, it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Vocal Paper", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { filePickerLauncher.launch("*/*") },
                icon = { Icon(Icons.Filled.Add, contentDescription = "Import document") },
                text = { Text("Import PDF / TXT") }
            )
        }
    ) { innerPadding ->
        if (documents.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Your library is empty",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Tap the '+' button down below to import PDF or TXT files.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 80.dp, top = 12.dp)
            ) {
                items(documents, key = { it.id }) { doc ->
                    DocumentCard(
                        doc = doc,
                        onOpen = { onNavigateToReader(doc.id) },
                        onDelete = { viewModel.deleteDocument(doc) }
                    )
                }
            }
        }
    }
}

@Composable
fun DocumentCard(
    doc: DocumentEntity,
    onOpen: () -> Unit,
    onDelete: () -> Unit
) {
    val dateString = remember(doc.dateAdded) {
        val sdf = SimpleDateFormat("MMM dd, yyyy - hh:mm a", Locale.getDefault())
        sdf.format(Date(doc.dateAdded))
    }

    val sizeText = remember(doc.fileSize) {
        val kb = doc.fileSize / 1024
        if (kb > 1024) "\${kb / 1024} MB" else "\$kb KB"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpen() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = doc.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Size: \$sizeText | Added: \$dateString",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (doc.lastPositionParagraph > 0) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Resuming to paragraph: #\${doc.lastPositionParagraph + 1}",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            Row {
                IconButton(onClick = onOpen) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Read",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/vocalpaper/app/ui/screens/ReaderScreen.kt",
    name: "ReaderScreen.kt",
    language: "kotlin",
    category: "Ui",
    content: `package com.vocalpaper.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.vocalpaper.app.presentation.ReaderViewModel
import com.vocalpaper.app.ui.theme.HighlightLighterGreen
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReaderScreen(
    documentId: Long,
    onNavigateBack: () -> Unit,
    viewModel: ReaderViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    val doc by viewModel.documentState.collectAsState()
    val paragraphs by viewModel.paragraphs.collectAsState()
    val activeIdx by viewModel.currentActiveParagraph.collectAsState()
    val isPlaying by viewModel.isPlaying.collectAsState()
    val speed by viewModel.currentSpeed.collectAsState()

    var isTtsReady by remember { mutableStateOf(false) }

    LaunchedEffect(documentId) {
        viewModel.loadDocument(context, documentId) {
            isTtsReady = true
        }
    }

    // Highlighting progress scrolls list automatically
    LaunchedEffect(activeIdx) {
        if (paragraphs.isNotEmpty()) {
            scope.launch {
                // Smooth scroll to keep the highlighted text in center-screen
                listState.animateScrollToItem(
                    index = activeIdx.coerceIn(0, paragraphs.size - 1)
                )
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(doc?.title ?: "Reading...", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = {
                        viewModel.stopPlayback()
                        onNavigateBack()
                    }) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        bottomBar = {
            Surface(
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    val progress = if (paragraphs.isNotEmpty()) {
                        (activeIdx.toFloat() / paragraphs.size.toFloat()).coerceIn(0f, 1f)
                    } else 0f
                    
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Speed selectors
                        var speedMenuOpen by remember { mutableStateOf(false) }
                        Box {
                            TextButton(onClick = { speedMenuOpen = true }) {
                                Text("\${speed}x Speed")
                            }
                            DropdownMenu(
                                expanded = speedMenuOpen,
                                onDismissRequest = { speedMenuOpen = false }
                            ) {
                                listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f).forEach { s ->
                                    DropdownMenuItem(
                                        text = { Text("\${s}x") },
                                        onClick = {
                                            viewModel.setSpeed(s)
                                            speedMenuOpen = false
                                        }
                                    )
                                }
                            }
                        }

                        // Play/Pause / Stop Panel
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                onClick = { viewModel.togglePlayback() },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isPlaying) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary
                                )
                            ) {
                                Text(if (isPlaying) "Pause" else "Play")
                            }
                            OutlinedButton(onClick = { viewModel.stopPlayback() }) {
                                Text("Stop")
                            }
                        }

                        // Completion state
                        Text(
                            text = "\${activeIdx + 1} / \${paragraphs.size}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 80.dp)
        ) {
            itemsIndexed(paragraphs) { index, para ->
                val isCurrent = index == activeIdx
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (isCurrent) HighlightLighterGreen else androidx.compose.ui.graphics.Color.Transparent)
                        .clickable { viewModel.jumpToParagraph(index) }
                        .padding(8.dp)
                ) {
                    Text(
                        text = para,
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (isCurrent) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                        fontWeight = if (isCurrent) FontWeight.Medium else FontWeight.Normal
                    )
                }
            }
        }
    }
}`
  },
  {
    path: "settings_and_build.md",
    name: "Android Studio Run Instructions",
    language: "markdown",
    category: "Guide",
    content: `# Vocal Paper Setup and Run Guide

## Prerequisites

1. **Android Studio** (Hedgehog or newer recommended)
2. **Android SDK** level 34 (Android 14) installed
3. **JDK 17** configured in your project settings

## Steps to compile and launch

1. **Import the Project:**
   - Launch Android Studio, select "Open", and pick your unzipped \`vocalpaper\` source directory.
   - Gradle will synchronize and configure the project. Make sure you are connected to the internet so dependencies resolve correctly.

2. **Dagger Hilt Plugin Configuration:**
   Dagger Hilt automates Dependency Injection. Kapt relies on JDK 17. If you receive compilation warnings post-import, check \`File -> Settings (or Preferences) -> Build, Execution, Deployment -> Build Tools -> Gradle -> Gradle JDK\` and change it to JDK 17.

3. **Required system settings (Text-To-Speech):**
   Vocal Paper utilizes high-fidelity TextToSpeech engine. Please verify your testing Android phone/emulator has TTS data installed:
   - On the device, open **Settings**.
   - Navigate to **System -> Languages & input -> Text-to-speech output**.
   - Make sure **Preferred Engine** is set to Google Text-to-speech Engine and language data for English is downloaded.

4. **Run on Device or Emulator:**
   - Connect your physical Android test device or start an Android Virtual Device (AVD).
   - Press the **Run** button (Green Play Icon) in the toolbar.
   - Enjoy synchronized, hands-free text-to-speech reading on your Android phone!
`
  }
];
