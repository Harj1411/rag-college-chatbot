import os
import json
import logging
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("campusmind.db")

LOCAL_DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "local_db.json")

class FilePersistedCollection:
    """
    In-memory collection fallback with automatic local JSON file persistence
    when MongoDB is not running locally.
    """
    def __init__(self, name: str, parent_db):
        self.name = name
        self.parent_db = parent_db

    @property
    def _data(self) -> Dict[str, Dict[str, Any]]:
        return self.parent_db._storage.setdefault(self.name, {})

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self._data.values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item.copy()
        return None

    async def insert_one(self, document: Dict[str, Any]):
        doc_id = str(document.get("id") or document.get("_id") or len(self._data) + 1)
        doc = document.copy()
        if "_id" not in doc:
            doc["_id"] = doc_id
        if "id" not in doc:
            doc["id"] = doc_id
        self._data[doc_id] = doc
        self.parent_db.save_to_disk()
        return type("InsertResult", (), {"inserted_id": doc_id})()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        target = await self.find_one(query)
        if target:
            doc_id = str(target.get("id") or target.get("_id"))
            if "$set" in update:
                self._data[doc_id].update(update["$set"])
            self.parent_db.save_to_disk()
            return type("UpdateResult", (), {"modified_count": 1})()
        return type("UpdateResult", (), {"modified_count": 0})()

    async def delete_one(self, query: Dict[str, Any]):
        target = await self.find_one(query)
        if target:
            doc_id = str(target.get("id") or target.get("_id"))
            if doc_id in self._data:
                del self._data[doc_id]
                self.parent_db.save_to_disk()
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    async def delete_many(self, query: Dict[str, Any]):
        to_delete = []
        for doc_id, item in self._data.items():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                to_delete.append(doc_id)
        for doc_id in to_delete:
            del self._data[doc_id]
        if to_delete:
            self.parent_db.save_to_disk()
        return type("DeleteResult", (), {"deleted_count": len(to_delete)})()

    def find(self, query: Optional[Dict[str, Any]] = None):
        query = query or {}
        matches = []
        for item in self._data.values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                matches.append(item.copy())
        
        class Cursor:
            def __init__(self, data):
                self.data = data
                self._sort_key = None
                self._sort_dir = 1

            def sort(self, key, direction=1):
                if isinstance(key, list):
                    key, direction = key[0]
                self._sort_key = key
                self._sort_dir = direction
                return self

            async def to_list(self, length: Optional[int] = None):
                res = list(self.data)
                if self._sort_key:
                    res.sort(
                        key=lambda x: str(x.get(self._sort_key, "")),
                        reverse=(self._sort_dir == -1)
                    )
                if length is not None:
                    return res[:length]
                return res

        return Cursor(matches)

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        cursor = self.find(query)
        docs = await cursor.to_list()
        return len(docs)


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None
    is_mongo_connected: bool = False
    _storage: Dict[str, Dict[str, Any]] = {}
    _collections: Dict[str, FilePersistedCollection] = {}

    def __init__(self):
        self.load_from_disk()

    def load_from_disk(self):
        if os.path.exists(LOCAL_DB_FILE):
            try:
                with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                    self._storage = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load local DB file: {e}")
                self._storage = {}
        else:
            self._storage = {}

    def save_to_disk(self):
        try:
            with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self._storage, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist local DB to file: {e}")

    def get_collection(self, name: str):
        if self.is_mongo_connected and self.db is not None:
            return self.db[name]
        if name not in self._collections:
            self._collections[name] = FilePersistedCollection(name, self)
        return self._collections[name]


db_instance = Database()

async def ensure_default_seed():
    """Auto-seeds demo admin and student accounts so login always works."""
    from app.core.security import get_password_hash
    users_col = get_users_collection()

    # Seed Admin
    admin_email = "admin@campusmind.edu"
    admin_user = await users_col.find_one({"email": admin_email})
    if not admin_user:
        await users_col.insert_one({
            "id": "demo-admin-id",
            "_id": "demo-admin-id",
            "name": "Dr. Sarah Mitchell (Dean)",
            "email": admin_email,
            "password_hash": get_password_hash("admin123456"),
            "role": "admin",
            "created_at": "2026-08-01T00:00:00.000Z"
        })
        logger.info(f"Default Admin account initialized: {admin_email} / admin123456")

    # Seed Student
    student_email = "student@campusmind.edu"
    student_user = await users_col.find_one({"email": student_email})
    if not student_user:
        await users_col.insert_one({
            "id": "demo-student-id",
            "_id": "demo-student-id",
            "name": "Rahul Verma",
            "email": student_email,
            "password_hash": get_password_hash("student123456"),
            "role": "student",
            "created_at": "2026-08-01T00:00:00.000Z"
        })
        logger.info(f"Default Student account initialized: {student_email} / student123456")

async def connect_db():
    try:
        db_instance.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=2000
        )
        # Verify connection
        await db_instance.client.admin.command('ping')
        db_instance.db = db_instance.client[settings.DB_NAME]
        db_instance.is_mongo_connected = True
        logger.info(f"Connected to MongoDB at {settings.MONGO_URI} (DB: {settings.DB_NAME})")
    except Exception as e:
        logger.warning(
            f"Could not connect to MongoDB ({e}). Using file-persisted local data store ({LOCAL_DB_FILE})."
        )
        db_instance.is_mongo_connected = False
        db_instance.load_from_disk()

    # Ensure default accounts exist in whichever database is active
    try:
        await ensure_default_seed()
    except Exception as e:
        logger.error(f"Error ensuring default seed: {e}")

async def close_db():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_users_collection():
    return db_instance.get_collection("users")

def get_documents_collection():
    return db_instance.get_collection("documents")

def get_chat_sessions_collection():
    return db_instance.get_collection("chat_sessions")

def get_chat_messages_collection():
    return db_instance.get_collection("chat_messages")

def get_feedback_collection():
    return db_instance.get_collection("feedback")
