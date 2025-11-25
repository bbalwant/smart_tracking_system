"""
User login endpoint
"""
from fastapi import APIRouter, HTTPException, status
from db.connection import get_database
from models.user import UserLogin, TokenResponse, UserResponse
from auth.utils import verify_password, create_access_token
from datetime import timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login user and return JWT token
    
    - **email**: User's email
    - **password**: User's password
    """
    db = get_database()
    users_collection = db.users
    
    # Find user by email
    user = await users_collection.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user["role"]
        },
        expires_delta=access_token_expires
    )
    
    # Return token and user data
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"]
        )
    )

