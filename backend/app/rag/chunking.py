import os
import re
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page-by-page from a PDF file.
    Returns a list of dicts: [{"page": 1, "text": "..."}]
    """
    pages_data = []
    
    # Try pypdf first
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text = clean_text(text)
            if text.strip():
                pages_data.append({"page": idx + 1, "text": text})
        if pages_data:
            return pages_data
    except Exception as e:
        pass

    # Fallback to pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for idx, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                text = clean_text(text)
                if text.strip():
                    pages_data.append({"page": idx + 1, "text": text})
    except Exception as e:
        pass

    return pages_data

def extract_text_from_docx(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text from a DOCX file.
    Returns a list of dicts with sections/paragraphs.
    """
    import docx
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text.strip())
    
    joined = "\n\n".join(full_text)
    cleaned = clean_text(joined)
    return [{"page": 1, "text": cleaned}] if cleaned else []

def extract_text_from_txt(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text from plain text/markdown."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    cleaned = clean_text(text)
    return [{"page": 1, "text": cleaned}] if cleaned else []

def clean_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def chunk_document(
    file_path: str,
    doc_id: str,
    filename: str,
    category: str = "general"
) -> List[Dict[str, Any]]:
    """
    Extracts text and breaks it down into chunks (~800 characters, ~100 overlap)
    with attached metadata for vector database indexing.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        pages = extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        pages = extract_text_from_docx(file_path)
    else:
        pages = extract_text_from_txt(file_path)

    if not pages:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""]
    )

    chunks = []
    chunk_global_idx = 0

    for page_info in pages:
        page_num = page_info["page"]
        page_text = page_info["text"]
        
        split_texts = splitter.split_text(page_text)
        for piece in split_texts:
            if not piece.strip():
                continue
            chunk_global_idx += 1
            chunks.append({
                "chunk_id": f"{doc_id}_{chunk_global_idx}",
                "doc_id": doc_id,
                "filename": filename,
                "category": category,
                "page": page_num,
                "chunk_index": chunk_global_idx,
                "text": piece.strip()
            })

    return chunks
