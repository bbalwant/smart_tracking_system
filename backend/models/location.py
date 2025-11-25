"""
Location update model and Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


# Pydantic Schemas
class LocationUpdateCreate(BaseModel):
    """Schema for creating a location update"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    timestamp: Optional[datetime] = Field(default=None, description="Timestamp of location (defaults to now)")


class LocationUpdateResponse(BaseModel):
    """Schema for location update response"""
    id: str
    package_id: str
    latitude: float
    longitude: float
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}


class RouteHistoryResponse(BaseModel):
    """Schema for route history response"""
    package_id: str
    tracking_id: str
    locations: list[LocationUpdateResponse]
    total: int

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}

