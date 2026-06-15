package com.vocalpaper.app.data.local

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
}
