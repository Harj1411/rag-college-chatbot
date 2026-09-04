import uuid
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.db import get_users_collection
from app.models.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    UserVerifyEmailRequest,
    UserResendOTPRequest,
    RegisterResponse,
)
from app.services.email_service import email_service

class AuthService:
    def __init__(self):
        pass

    async def register(self, req: UserRegisterRequest) -> RegisterResponse:
        users_col = get_users_collection()
        email_clean = req.email.strip().lower()

        # Check existing
        existing = await users_col.find_one({"email": email_clean})
        if existing:
            if existing.get("is_verified", True):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this email address already exists."
                )
            # If exists but unverified, update password and re-issue OTP
            user_id = str(existing.get("id") or existing.get("_id"))
            hashed = get_password_hash(req.password)
            otp = f"{secrets.randbelow(900000) + 100000}"
            expires_at = (datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)).isoformat()

            await users_col.update_one(
                {"_id": existing.get("_id")},
                {"$set": {
                    "name": req.name.strip(),
                    "password_hash": hashed,
                    "role": req.role,
                    "verification_otp": otp,
                    "verification_otp_expires_at": expires_at
                }}
            )
            await email_service.send_verification_otp(email_clean, req.name.strip(), otp)
            return RegisterResponse(
                message="Verification code sent to your email. Please verify to continue.",
                email=email_clean,
                requires_verification=True
            )

        user_id = str(uuid.uuid4())
        hashed = get_password_hash(req.password)
        now_iso = datetime.utcnow().isoformat()

        requires_verification = settings.REQUIRE_EMAIL_VERIFICATION
        otp = f"{secrets.randbelow(900000) + 100000}" if requires_verification else None
        expires_at = (datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)).isoformat() if requires_verification else None

        user_doc = {
            "id": user_id,
            "_id": user_id,
            "name": req.name.strip(),
            "email": email_clean,
            "password_hash": hashed,
            "role": req.role,
            "is_verified": not requires_verification,
            "verification_otp": otp,
            "verification_otp_expires_at": expires_at,
            "created_at": now_iso
        }

        await users_col.insert_one(user_doc)

        if requires_verification and otp:
            await email_service.send_verification_otp(email_clean, req.name.strip(), otp)
            return RegisterResponse(
                message="Verification code sent to your email. Please verify your account.",
                email=email_clean,
                requires_verification=True
            )

        token = create_access_token(subject=user_id, role=req.role)
        user_res = UserResponse(
            id=user_id,
            name=user_doc["name"],
            email=user_doc["email"],
            role=user_doc["role"],
            is_verified=True,
            created_at=now_iso
        )

        return RegisterResponse(
            message="Account registered successfully.",
            email=email_clean,
            requires_verification=False,
            access_token=token,
            user=user_res
        )

    async def verify_email(self, req: UserVerifyEmailRequest) -> TokenResponse:
        users_col = get_users_collection()
        email_clean = req.email.strip().lower()
        otp_clean = req.otp.strip()

        user = await users_col.find_one({"email": email_clean})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found."
            )

        user_id = str(user.get("id") or user.get("_id"))
        role = user.get("role", "student")

        # If already verified, allow login seamlessly
        if user.get("is_verified", False):
            token = create_access_token(subject=user_id, role=role)
            user_res = UserResponse(
                id=user_id,
                name=user.get("name", "User"),
                email=user.get("email", ""),
                role=role,
                is_verified=True,
                created_at=user.get("created_at", datetime.utcnow().isoformat())
            )
            return TokenResponse(access_token=token, token_type="bearer", user=user_res)

        stored_otp = str(user.get("verification_otp", "")).strip()
        expires_at = user.get("verification_otp_expires_at")

        if not stored_otp or stored_otp != otp_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check and try again."
            )

        if expires_at:
            try:
                expiry_dt = datetime.fromisoformat(expires_at)
                if datetime.utcnow() > expiry_dt:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Verification code has expired. Please request a new code."
                    )
            except ValueError:
                pass

        # Mark user as verified and clear OTP
        await users_col.update_one(
            {"_id": user.get("_id")},
            {"$set": {"is_verified": True, "verification_otp": None, "verification_otp_expires_at": None}}
        )

        token = create_access_token(subject=user_id, role=role)
        user_res = UserResponse(
            id=user_id,
            name=user.get("name", "User"),
            email=user.get("email", ""),
            role=role,
            is_verified=True,
            created_at=user.get("created_at", datetime.utcnow().isoformat())
        )

        return TokenResponse(access_token=token, token_type="bearer", user=user_res)

    async def resend_otp(self, req: UserResendOTPRequest) -> dict:
        users_col = get_users_collection()
        email_clean = req.email.strip().lower()

        user = await users_col.find_one({"email": email_clean})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found."
            )

        if user.get("is_verified", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account has already been verified. Please log in."
            )

        otp = f"{secrets.randbelow(900000) + 100000}"
        expires_at = (datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)).isoformat()

        await users_col.update_one(
            {"_id": user.get("_id")},
            {"$set": {"verification_otp": otp, "verification_otp_expires_at": expires_at}}
        )

        await email_service.send_verification_otp(email_clean, user.get("name", "Student"), otp)
        return {
            "message": "A new verification code has been sent to your email.",
            "email": email_clean
        }

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

        # Enforce email verification
        if settings.REQUIRE_EMAIL_VERIFICATION and not user.get("is_verified", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email address before logging in."
            )

        user_id = str(user.get("id") or user.get("_id"))
        role = user.get("role", "student")
        token = create_access_token(subject=user_id, role=role)

        user_res = UserResponse(
            id=user_id,
            name=user.get("name", "User"),
            email=user.get("email", ""),
            role=role,
            is_verified=user.get("is_verified", True),
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
            is_verified=user.get("is_verified", True),
            created_at=user.get("created_at", "")
        )

auth_service = AuthService()

