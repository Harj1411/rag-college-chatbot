from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["student", "admin"] = "student"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_verified: bool = True
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserVerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class UserResendOTPRequest(BaseModel):
    email: EmailStr

class RegisterResponse(BaseModel):
    message: str
    email: str
    requires_verification: bool = True
    access_token: Optional[str] = None
    user: Optional[UserResponse] = None
