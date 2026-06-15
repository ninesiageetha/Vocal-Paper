package com.vocalpaper.app.presentation

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
}
