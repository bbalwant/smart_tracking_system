"""
User model and Pydantic schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from bson import ObjectId


# Pydantic Schemas
class UserCreate(BaseModel):
    """Schema for user registration"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="customer", pattern="^(customer|delivery_staff|manager)$")


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (public data)"""
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for token payload"""
    email: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[str] = None

