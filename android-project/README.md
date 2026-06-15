# Vocal Paper (Android Native Codebase)

Every Page Has a Voice.

This folder contains the complete, production-ready, clean-architecture Android Studio project for Vocal Paper, implementing a high-fidelity converted audio document reader with Jetpack Compose, Hilt, Room, and Text-to-Speech synchronization.

## Structure
- `app/build.gradle.kts`: Gradle build system configuration. Just sync in Android Studio!
- `app/src/main/AndroidManifest.xml`: Standard Android application manifests with TTS services.
- `app/src/main/java/com/vocalpaper/app/...`: Codebase splitting into Clean Architecture modules:
  - `data/`: Room database, DAO and model mapping.
  - `di/`: Hilt Dependency Injection.
  - `pdf/`: Native background PDF Text Extractor using PdfBox.
  - `tts/`: Native text-to-speech engine with exact character highlighter callbacks.
  - `presentation/`: MVVM ViewModels, managing States and Playback progress.
  - `ui/`: Material 3 Jetpack Compose application screens (Library, Reader, and Settings).

## How to Compile & Run
1. Download this directory or export the workspace.
2. Open **Android Studio** (Hedgehog or newer).
3. Select **Open** and choose the directory of this project file.
4. Let Gradle synchronize all libraries.
5. Compile and run on your physical Android device or emulator!
