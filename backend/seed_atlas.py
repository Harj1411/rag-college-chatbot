import os
import sys
import asyncio

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.core.config import settings
from app.core.security import get_password_hash
from app.core.db import connect_db, db_instance, get_users_collection, get_documents_collection

async def setup_mongodb_atlas():
    print("==================================================")
    print("🌐 MONGODB ATLAS DATABASE INITIALIZATION & SEEDER")
    print("==================================================")
    
    mongo_uri = os.getenv("MONGO_URI", settings.MONGO_URI)
    print(f"Connecting to MongoDB Atlas endpoint: {mongo_uri[:30]}...")

    await connect_db()

    if not db_instance.is_mongo_connected:
        print("❌ Could not establish live connection to MongoDB Atlas.")
        print("Please ensure your MONGO_URI environment variable is set to a valid mongodb+srv:// connection string.")
        print("Example: MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campusmind?retryWrites=true&w=majority")
        return

    db = db_instance.db
    print(f"✅ Successfully connected to MongoDB Atlas Database: '{settings.DB_NAME}'")

    # 1. Create Collection Indexes
    print("\n📦 Setting up database collection indexes...")
    await db["users"].create_index("email", unique=True)
    await db["users"].create_index("id", unique=True)
    await db["documents"].create_index("id", unique=True)
    await db["chat_sessions"].create_index("id", unique=True)
    await db["chat_sessions"].create_index("user_id")
    await db["chat_messages"].create_index("id", unique=True)
    await db["chat_messages"].create_index("session_id")
    print("✅ Collection indexes created successfully.")

    # 2. Seed Admin User
    users_col = get_users_collection()
    admin_email = "admin@campusmind.edu"
    admin_user = await users_col.find_one({"email": admin_email})
    if not admin_user:
        await users_col.insert_one({
            "id": "atlas-admin-id",
            "_id": "atlas-admin-id",
            "name": "Dr. Sarah Mitchell (Dean)",
            "email": admin_email,
            "password_hash": get_password_hash("admin123456"),
            "role": "admin",
            "created_at": "2026-08-01T00:00:00.000Z"
        })
        print(f"✅ Created Demo Admin in MongoDB Atlas: {admin_email} / admin123456")
    else:
        print(f"ℹ️ Admin user already exists in Atlas: {admin_email}")

    # 3. Seed Student User
    student_email = "student@campusmind.edu"
    student_user = await users_col.find_one({"email": student_email})
    if not student_user:
        await users_col.insert_one({
            "id": "atlas-student-id",
            "_id": "atlas-student-id",
            "name": "Rahul Verma",
            "email": student_email,
            "password_hash": get_password_hash("student123456"),
            "role": "student",
            "created_at": "2026-08-01T00:00:00.000Z"
        })
        print(f"✅ Created Demo Student in MongoDB Atlas: {student_email} / student123456")
    else:
        print(f"ℹ️ Student user already exists in Atlas: {student_email}")

    print("\n🎉 MongoDB Atlas initialization & seeding complete!")

if __name__ == "__main__":
    asyncio.run(setup_mongodb_atlas())
