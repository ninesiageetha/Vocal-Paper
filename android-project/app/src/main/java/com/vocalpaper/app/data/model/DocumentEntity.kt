package com.vocalpaper.app.data.model

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
) : Serializable
