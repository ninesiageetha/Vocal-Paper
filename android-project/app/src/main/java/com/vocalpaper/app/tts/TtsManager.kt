package com.vocalpaper.app.tts

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
}
