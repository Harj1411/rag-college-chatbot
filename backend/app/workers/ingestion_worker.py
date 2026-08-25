import os
import logging
from datetime import datetime
from app.core.db import get_documents_collection
from app.rag.chunking import chunk_document
from app.rag.vector_store import vector_store

logger = logging.getLogger("campusmind.ingestion_worker")

async def process_document_ingestion(doc_id: str, file_path: str, filename: str, category: str):
    """
    Background worker task that extracts text, splits into chunks,
    generates embeddings, and stores in ChromaDB.
    """
    docs_col = get_documents_collection()
    logger.info(f"Starting background ingestion for doc_id: {doc_id} ({filename})")

    try:
        # Update status to processing
        await docs_col.update_one(
            {"id": doc_id},
            {"$set": {"status": "processing", "error_message": None}}
        )

        # 1. Chunk document
        chunks = chunk_document(
            file_path=file_path,
            doc_id=doc_id,
            filename=filename,
            category=category
        )

        if not chunks:
            raise ValueError("No readable text content could be extracted from this document.")

        # 2. Add to ChromaDB vector store
        added_count = vector_store.add_chunks(chunks)

        # 3. Update status to processed
        await docs_col.update_one(
            {"id": doc_id},
            {
                "$set": {
                    "status": "processed",
                    "chunk_count": added_count,
                    "processed_at": datetime.utcnow().isoformat()
                }
            }
        )
        logger.info(f"Successfully processed {filename}: {added_count} chunks indexed.")

    except Exception as e:
        logger.error(f"Ingestion failed for doc_id {doc_id}: {e}", exc_info=True)
        await docs_col.update_one(
            {"id": doc_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(e),
                    "failed_at": datetime.utcnow().isoformat()
                }
            }
        )
