"""
Status transition logic for packages
"""
from typing import Optional
from datetime import datetime
from db.connection import get_database
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


# Status transition rules
VALID_TRANSITIONS = {
    "registered": ["in_transit", "delivered"],  # Can go to in_transit or directly to delivered
    "in_transit": ["delivered"],  # Can only go to delivered
    "delivered": []  # Final state, no transitions allowed
}


def can_transition(current_status: str, new_status: str) -> bool:
    """
    Check if status transition is valid
    
    Args:
        current_status: Current package status
        new_status: Desired new status
    
    Returns:
        True if transition is valid, False otherwise
    """
    allowed = VALID_TRANSITIONS.get(current_status, [])
    return new_status in allowed


def should_auto_transition_to_in_transit(
    current_lat: float,
    current_lon: float,
    sender_lat: float,
    sender_lon: float,
    distance_threshold_km: float = 0.5
) -> bool:
    """
    Check if package should automatically transition to "in_transit"
    based on distance from sender location
    
    Args:
        current_lat: Current delivery location latitude
        current_lon: Current delivery location longitude
        sender_lat: Sender location latitude
        sender_lon: Sender location longitude
        distance_threshold_km: Distance threshold in km (default: 0.5km = 500m)
    
    Returns:
        True if should transition to in_transit
    """
    from tracking.eta import calculate_distance
    
    if sender_lat == 0.0 or sender_lon == 0.0:
        return False
    
    distance = calculate_distance(current_lat, current_lon, sender_lat, sender_lon)
    return distance > distance_threshold_km


def should_auto_transition_to_delivered(
    current_lat: float,
    current_lon: float,
    recipient_lat: float,
    recipient_lon: float,
    distance_threshold_km: float = 0.1
) -> bool:
    """
    Check if package should automatically transition to "delivered"
    based on proximity to recipient location
    
    Args:
        current_lat: Current delivery location latitude
        current_lon: Current delivery location longitude
        recipient_lat: Recipient location latitude
        recipient_lon: Recipient location longitude
        distance_threshold_km: Distance threshold in km (default: 0.1km = 100m)
    
    Returns:
        True if should transition to delivered
    """
    from tracking.eta import calculate_distance
    
    if recipient_lat == 0.0 or recipient_lon == 0.0:
        return False
    
    distance = calculate_distance(current_lat, current_lon, recipient_lat, recipient_lon)
    return distance <= distance_threshold_km


async def update_package_status(
    tracking_id: str,
    new_status: str,
    user_id: Optional[str] = None
) -> bool:
    """
    Update package status with validation
    
    Args:
        tracking_id: Package tracking ID
        new_status: New status to set
        user_id: Optional user ID for logging
    
    Returns:
        True if status was updated, False otherwise
    """
    try:
        db = get_database()
        packages_collection = db.packages
        
        # Find package
        package = await packages_collection.find_one({"tracking_id": tracking_id})
        if not package:
            return False
        
        current_status = package["status"]
        
        # Validate transition
        if not can_transition(current_status, new_status):
            return False
        
        # Update status
        await packages_collection.update_one(
            {"tracking_id": tracking_id},
            {
                "$set": {
                    "status": new_status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return True
    except Exception as e:
        logger.error(f"Error updating package status: {e}")
        return False

