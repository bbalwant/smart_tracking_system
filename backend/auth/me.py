"""
Protected route to get current user info
"""
from fastapi import APIRouter, Depends
from models.user import UserResponse
from auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_active_user)):
    """
    Get current authenticated user information
    Requires valid JWT token in Authorization header
    """
    return current_user

