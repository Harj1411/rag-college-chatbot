import os
import sys
import asyncio

# Ensure utf-8 stdout encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.security import get_password_hash
from app.core.db import connect_db, get_users_collection, get_documents_collection
from app.rag.chunking import chunk_document
from app.rag.vector_store import vector_store

async def seed():
    print("Initializing CampusMind Demo Data...")
    await connect_db()

    users_col = get_users_collection()
    docs_col = get_documents_collection()

    # 1. Seed Demo Admin User
    admin_email = "admin@campusmind.edu"
    existing_admin = await users_col.find_one({"email": admin_email})
    if not existing_admin:
        admin_doc = {
            "id": "demo-admin-id",
            "_id": "demo-admin-id",
            "name": "Dr. Sarah Mitchell (Dean)",
            "email": admin_email,
            "password_hash": get_password_hash("admin123456"),
            "role": "admin",
            "created_at": "2026-08-01T00:00:00.000Z"
        }
        await users_col.insert_one(admin_doc)
        print(f"✅ Created Demo Admin: {admin_email} / admin123456")
    else:
        print(f"ℹ️ Demo Admin already exists: {admin_email}")

    # 2. Seed Demo Student User
    student_email = "student@campusmind.edu"
    existing_student = await users_col.find_one({"email": student_email})
    if not existing_student:
        student_doc = {
            "id": "demo-student-id",
            "_id": "demo-student-id",
            "name": "Rahul Verma",
            "email": student_email,
            "password_hash": get_password_hash("student123456"),
            "role": "student",
            "created_at": "2026-08-01T00:00:00.000Z"
        }
        await users_col.insert_one(student_doc)
        print(f"✅ Created Demo Student: {student_email} / student123456")
    else:
        print(f"ℹ️ Demo Student already exists: {student_email}")

    # 3. Seed Demo Document & ChromaDB Vectors
    demo_doc_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "demo_documents", "college_handbook_2026.txt"))
    if not os.path.exists(demo_doc_path):
        demo_doc_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "demo_documents", "college_handbook_2026.txt"))
    if os.path.exists(demo_doc_path):
        doc_id = "demo-handbook-doc-id"
        existing_doc = await docs_col.find_one({"id": doc_id})
        
        chunks = chunk_document(
            file_path=demo_doc_path,
            doc_id=doc_id,
            filename="college_handbook_2026.txt",
            category="Academic Regulations & Policies"
        )
        
        added_count = vector_store.add_chunks(chunks)
        
        if not existing_doc:
            doc_record = {
                "id": doc_id,
                "_id": doc_id,
                "filename": "college_handbook_2026.txt",
                "file_path": demo_doc_path,
                "uploaded_by": "Dr. Sarah Mitchell (Dean)",
                "category": "Academic Regulations & Policies",
                "status": "processed",
                "chunk_count": added_count,
                "file_size_bytes": os.path.getsize(demo_doc_path),
                "uploaded_at": "2026-08-01T00:00:00.000Z"
            }
            await docs_col.insert_one(doc_record)
            print(f"✅ Ingested Demo Handbook into ChromaDB: {added_count} vector chunks.")
        else:
            print(f"ℹ️ Demo Document already registered: {added_count} chunks indexed in ChromaDB.")
    else:
        print(f"⚠️ Demo file not found at: {demo_doc_path}")

    print("🎉 Seeding complete! You can now start the server and log in immediately.")

async def seed_if_empty():
    if vector_store.count() == 0:
        print("Vector store is empty. Auto-seeding college handbook...")
        await seed()

if __name__ == "__main__":
    asyncio.run(seed())
