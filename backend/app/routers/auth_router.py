from fastapi import APIRouter, Depends
from app.models.user import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.services.auth_service import auth_service
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(req: UserRegisterRequest):
    """Register a new student or admin account."""
    return await auth_service.register(req)

@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    """Authenticate with email & password and receive a JWT access token."""
    return await auth_service.login(req)

@router.get("/me", response_model=UserResponse)
async def get_current_user(payload: dict = Depends(get_current_user_payload)):
    """Fetch the authenticated user's profile."""
    user_id = payload.get("sub")
    return await auth_service.get_me(user_id)
