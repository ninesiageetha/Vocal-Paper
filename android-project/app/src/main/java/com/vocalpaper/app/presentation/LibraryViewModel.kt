package com.vocalpaper.app.presentation

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
                            stringBuilder.append(line).append("\n")
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
}
