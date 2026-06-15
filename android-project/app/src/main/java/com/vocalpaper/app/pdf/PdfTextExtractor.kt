package com.vocalpaper.app.pdf

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
}
