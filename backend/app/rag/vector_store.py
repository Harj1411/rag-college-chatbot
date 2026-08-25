import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.rag.embeddings import embedding_manager

logger = logging.getLogger("campusmind.vector_store")

class ChromaVectorStore:
    def __init__(self):
        self.persist_dir = settings.CHROMA_PERSIST_DIR
        os.makedirs(self.persist_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection_name = "campusmind_docs"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"ChromaDB initialized at {self.persist_dir} (Collection: {self.collection_name})")

    def _reset_collection(self):
        """Resets the collection if embedding dimension changes."""
        try:
            self.client.delete_collection(self.collection_name)
        except Exception:
            pass
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"Re-created ChromaDB collection '{self.collection_name}'.")

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Takes chunk dicts, generates embeddings, and saves into ChromaDB.
        """
        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        ids = [c["chunk_id"] for c in chunks]
        metadatas = [
            {
                "doc_id": c["doc_id"],
                "filename": c["filename"],
                "category": c.get("category", "general"),
                "page": int(c.get("page", 1)),
                "chunk_index": int(c.get("chunk_index", 1))
            }
            for c in chunks
        ]

        embeddings = embedding_manager.embed_documents(texts)

        try:
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas
            )
        except Exception as e:
            if "dimension" in str(e).lower() or "invalidargumenterror" in str(e).lower():
                logger.warning(f"ChromaDB dimension mismatch ({e}). Resetting collection...")
                self._reset_collection()
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )
            else:
                raise e

        logger.info(f"Added {len(chunks)} chunks to ChromaDB collection.")
        return len(chunks)

    def query_similar(
        self,
        query: str,
        top_k: int = 4,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic similarity search against indexed document chunks.
        Returns retrieved chunks with cosine similarity score in [0.0, 1.0].
        """
        if not query.strip() or self.collection.count() == 0:
            return []

        query_vec = embedding_manager.embed_query(query)
        where_clause = {"category": category} if category else None

        results = self.collection.query(
            query_embeddings=[query_vec],
            n_results=min(top_k, self.collection.count()),
            where=where_clause,
            include=["documents", "metadatas", "distances"]
        )

        retrieved = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else []
            distances = results["distances"][0] if "distances" in results else []
            ids = results["ids"][0] if "ids" in results else []

            for i in range(len(docs)):
                dist = distances[i] if i < len(distances) else 1.0
                # In cosine space, distance is 1 - similarity. Score in [0, 1]
                similarity_score = max(0.0, min(1.0, 1.0 - float(dist)))

                meta = metas[i] if i < len(metas) else {}
                retrieved.append({
                    "chunk_id": ids[i] if i < len(ids) else f"chunk_{i}",
                    "doc_id": meta.get("doc_id", ""),
                    "filename": meta.get("filename", "Unknown Document"),
                    "page": meta.get("page", 1),
                    "chunk_index": meta.get("chunk_index", 1),
                    "category": meta.get("category", "general"),
                    "text": docs[i],
                    "score": round(similarity_score, 4)
                })

        # Sort descending by score
        retrieved.sort(key=lambda x: x["score"], reverse=True)
        return retrieved

    def delete_by_doc_id(self, doc_id: str) -> int:
        """Purges all vectors for a specific document."""
        try:
            # Find IDs matching doc_id
            all_entries = self.collection.get(
                where={"doc_id": doc_id},
                include=["metadatas"]
            )
            ids_to_del = all_entries.get("ids", [])
            if ids_to_del:
                self.collection.delete(ids=ids_to_del)
                logger.info(f"Purged {len(ids_to_del)} vectors for doc_id: {doc_id}")
                return len(ids_to_del)
            return 0
        except Exception as e:
            logger.error(f"Error purging vectors for doc_id {doc_id}: {e}")
            return 0

    def count(self) -> int:
        return self.collection.count()

vector_store = ChromaVectorStore()
