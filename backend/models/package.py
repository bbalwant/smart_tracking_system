"""
Package model and Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


# Pydantic Schemas
class SenderRecipient(BaseModel):
    """Schema for sender/recipient information"""
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5, max_length=500)
    phone: str = Field(..., min_length=10, max_length=20)
    latitude: float = Field(default=0.0, ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(default=0.0, ge=-180, le=180, description="Longitude coordinate")


class PackageCreate(BaseModel):
    """Schema for creating a package"""
    sender: SenderRecipient
    recipient: SenderRecipient
    status: str = Field(default="registered", pattern="^(registered|in_transit|delivered)$")


class PackageUpdate(BaseModel):
    """Schema for updating a package"""
    sender: Optional[SenderRecipient] = None
    recipient: Optional[SenderRecipient] = None
    status: Optional[str] = Field(None, pattern="^(registered|in_transit|delivered)$")


class PackageResponse(BaseModel):
    """Schema for package response"""
    id: str
    tracking_id: str
    sender: SenderRecipient
    recipient: SenderRecipient
    status: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}


class PackageListResponse(BaseModel):
    """Schema for package list response"""
    packages: list[PackageResponse]
    total: int

