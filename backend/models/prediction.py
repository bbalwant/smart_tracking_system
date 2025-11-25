"""
Prediction model for ETA calculations
"""
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from typing import Optional


class PredictionCreate(BaseModel):
    """Schema for creating a prediction"""
    package_id: str
    eta: datetime
    calculated_at: Optional[datetime] = Field(default=None, description="When ETA was calculated (defaults to now)")


class PredictionResponse(BaseModel):
    """Schema for prediction response"""
    id: str
    package_id: str
    tracking_id: str
    eta: datetime
    calculated_at: datetime
    time_remaining_minutes: int
    formatted_eta: str

    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}

