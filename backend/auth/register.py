"""
User registration endpoint
"""
from fastapi import APIRouter, HTTPException, status
from db.connection import get_database
from models.user import UserCreate, UserResponse
from auth.utils import get_password_hash
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user
    
    - **name**: User's full name
    - **email**: User's email (must be unique)
    - **password**: User's password (min 6 characters)
    - **role**: User role (customer, delivery_staff, manager)
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error: {str(e)}"
        )
    
    users_collection = db.users
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hashed_password,
        "role": user_data.role,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert user into database
    result = await users_collection.insert_one(user_doc)
    
    # Create unique index on email if it doesn't exist
    try:
        await users_collection.create_index("email", unique=True)
    except Exception:
        pass  # Index might already exist
    
    # Fetch created user (without password)
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    
    return UserResponse(
        id=str(created_user["_id"]),
        name=created_user["name"],
        email=created_user["email"],
        role=created_user["role"],
        created_at=created_user["created_at"]
    )

