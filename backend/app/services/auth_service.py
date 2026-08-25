import uuid
from datetime import datetime
from fastapi import HTTPException, status
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.db import get_users_collection
from app.models.user import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse

class AuthService:
    def __init__(self):
        pass

    async def register(self, req: UserRegisterRequest) -> TokenResponse:
        users_col = get_users_collection()
        email_clean = req.email.strip().lower()

        # Check existing
        existing = await users_col.find_one({"email": email_clean})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        user_id = str(uuid.uuid4())
        hashed = get_password_hash(req.password)
        now_iso = datetime.utcnow().isoformat()

        user_doc = {
            "id": user_id,
            "_id": user_id,
            "name": req.name.strip(),
            "email": email_clean,
            "password_hash": hashed,
            "role": req.role,
            "created_at": now_iso
        }

        await users_col.insert_one(user_doc)

        token = create_access_token(subject=user_id, role=req.role)
        user_res = UserResponse(
            id=user_id,
            name=user_doc["name"],
            email=user_doc["email"],
            role=user_doc["role"],
            created_at=now_iso
        )

        return TokenResponse(access_token=token, token_type="bearer", user=user_res)

    async def login(self, req: UserLoginRequest) -> TokenResponse:
        users_col = get_users_collection()
        email_clean = req.email.strip().lower()

        user = await users_col.find_one({"email": email_clean})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if not verify_password(req.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        user_id = str(user.get("id") or user.get("_id"))
        role = user.get("role", "student")
        token = create_access_token(subject=user_id, role=role)

        user_res = UserResponse(
            id=user_id,
            name=user.get("name", "User"),
            email=user.get("email", ""),
            role=role,
            created_at=user.get("created_at", datetime.utcnow().isoformat())
        )

        return TokenResponse(access_token=token, token_type="bearer", user=user_res)

    async def get_me(self, user_id: str) -> UserResponse:
        users_col = get_users_collection()
        user = await users_col.find_one({"id": user_id})
        if not user:
            user = await users_col.find_one({"_id": user_id})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found."
            )

        return UserResponse(
            id=str(user.get("id") or user.get("_id")),
            name=user.get("name", "User"),
            email=user.get("email", ""),
            role=user.get("role", "student"),
            created_at=user.get("created_at", "")
        )

auth_service = AuthService()
