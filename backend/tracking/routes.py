"""
Tracking routes for location updates and route history
"""
from fastapi import APIRouter, HTTPException, status, Depends, WebSocket, WebSocketDisconnect
from db.connection import get_database
from models.location import LocationUpdateCreate, LocationUpdateResponse, RouteHistoryResponse
from models.prediction import PredictionResponse
from models.user import UserResponse
from auth.dependencies import get_current_active_user, require_role
from tracking.websocket import manager
from tracking.eta import calculate_eta, format_eta
from packages.status import (
    should_auto_transition_to_in_transit,
    should_auto_transition_to_delivered,
    update_package_status
)
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tracking", tags=["tracking"])


@router.post("/{tracking_id}/update", response_model=LocationUpdateResponse, status_code=status.HTTP_201_CREATED)
async def update_location(
    tracking_id: str,
    location_data: LocationUpdateCreate,
    current_user: UserResponse = Depends(require_role(["delivery_staff", "manager"]))
):
    """
    Update package location (delivery staff only)
    
    - **tracking_id**: Package tracking ID
    - **latitude**: Latitude coordinate
    - **longitude**: Longitude coordinate
    - **timestamp**: Optional timestamp (defaults to now)
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    locations_collection = db.location_updates
    
    # Verify package exists
    package = await packages_collection.find_one({"tracking_id": tracking_id})
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # Use provided timestamp or current time
    update_timestamp = location_data.timestamp or datetime.utcnow()
    
    # Create location update document
    location_doc = {
        "package_id": package["_id"],
        "latitude": location_data.latitude,
        "longitude": location_data.longitude,
        "timestamp": update_timestamp,
        "created_at": datetime.utcnow()
    }
    
    # Insert location update
    result = await locations_collection.insert_one(location_doc)
    
    # Create indexes if they don't exist
    try:
        await locations_collection.create_index("package_id")
        await locations_collection.create_index("timestamp")
        await locations_collection.create_index([("package_id", 1), ("timestamp", 1)])
    except Exception:
        pass  # Indexes might already exist
    
    # Fetch created location update
    created_location = await locations_collection.find_one({"_id": result.inserted_id})
    
    # Prepare location data for broadcast
    location_response = LocationUpdateResponse(
        id=str(created_location["_id"]),
        package_id=str(created_location["package_id"]),
        latitude=created_location["latitude"],
        longitude=created_location["longitude"],
        timestamp=created_location["timestamp"],
        created_at=created_location["created_at"]
    )
    
    # Auto-update status based on location
    sender_lat = package["sender"].get("latitude", 0.0)
    sender_lng = package["sender"].get("longitude", 0.0)
    recipient_lat = package["recipient"].get("latitude", 0.0)
    recipient_lng = package["recipient"].get("longitude", 0.0)
    
    # Auto-transition to "in_transit" if moved away from sender
    if package["status"] == "registered":
        if should_auto_transition_to_in_transit(
            location_data.latitude,
            location_data.longitude,
            sender_lat,
            sender_lng
        ):
            await update_package_status(tracking_id, "in_transit")
            package["status"] = "in_transit"
            logger.info(f"Auto-transitioned package {tracking_id} to in_transit")
    
    # Auto-transition to "delivered" if close to recipient
    if package["status"] == "in_transit":
        if should_auto_transition_to_delivered(
            location_data.latitude,
            location_data.longitude,
            recipient_lat,
            recipient_lng
        ):
            await update_package_status(tracking_id, "delivered")
            package["status"] = "delivered"
            logger.info(f"Auto-transitioned package {tracking_id} to delivered")
    
    # Calculate and store ETA if package is not delivered
    if package["status"] != "delivered" and recipient_lat != 0.0 and recipient_lng != 0.0:
        predictions_collection = db.predictions
        eta = calculate_eta(
            location_data.latitude,
            location_data.longitude,
            recipient_lat,
            recipient_lng
        )
        
        if eta:
            # Store or update prediction
            prediction_doc = {
                "package_id": package["_id"],
                "eta": eta,
                "calculated_at": datetime.utcnow()
            }
            
            # Update existing prediction or insert new one
            await predictions_collection.update_one(
                {"package_id": package["_id"]},
                {"$set": prediction_doc},
                upsert=True
            )
    
    # Broadcast to all connected clients
    await manager.broadcast_location_update(
        tracking_id,
        location_response.model_dump()
    )
    
    return location_response


@router.get("/{tracking_id}/history", response_model=RouteHistoryResponse)
async def get_route_history(
    tracking_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get route history for a package (authenticated users can view their packages)
    
    - **tracking_id**: Package tracking ID
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    locations_collection = db.location_updates
    
    # Verify package exists
    package = await packages_collection.find_one({"tracking_id": tracking_id})
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # Check authorization: users can only view their own packages (unless manager/delivery_staff)
    if current_user.role not in ["manager", "delivery_staff"]:
        if str(package["user_id"]) != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this package"
            )
    
    # Fetch location updates for this package, sorted by timestamp
    cursor = locations_collection.find({"package_id": package["_id"]}).sort("timestamp", 1)
    locations = await cursor.to_list(length=1000)
    
    location_list = [
        LocationUpdateResponse(
            id=str(loc["_id"]),
            package_id=str(loc["package_id"]),
            latitude=loc["latitude"],
            longitude=loc["longitude"],
            timestamp=loc["timestamp"],
            created_at=loc["created_at"]
        )
        for loc in locations
    ]
    
    return RouteHistoryResponse(
        package_id=str(package["_id"]),
        tracking_id=tracking_id,
        locations=location_list,
        total=len(location_list)
    )


@router.websocket("/ws/{tracking_id}")
async def websocket_tracking(websocket: WebSocket, tracking_id: str):
    """
    WebSocket endpoint for real-time location updates
    
    - **tracking_id**: Package tracking ID to track
    """
    await manager.connect(websocket, tracking_id)
    
    try:
        # Send initial connection confirmation
        await manager.send_message(websocket, {
            "type": "connected",
            "tracking_id": tracking_id,
            "message": "Connected to real-time tracking"
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages (ping/pong for keepalive)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle ping messages
                if message.get("type") == "ping":
                    await manager.send_message(websocket, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, tracking_id)


@router.get("/{tracking_id}/eta", response_model=PredictionResponse)
async def get_eta(
    tracking_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get ETA for a package (authenticated users can view their packages)
    
    - **tracking_id**: Package tracking ID
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    predictions_collection = db.predictions
    locations_collection = db.location_updates
    
    # Verify package exists
    package = await packages_collection.find_one({"tracking_id": tracking_id})
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # Check authorization: users can only view their own packages (unless manager/delivery_staff)
    if current_user.role not in ["manager", "delivery_staff"]:
        if str(package["user_id"]) != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this package"
            )
    
    # If package is delivered, return None or indicate delivered
    if package["status"] == "delivered":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Package has already been delivered"
        )
    
    # Get the most recent location update
    latest_location = await locations_collection.find_one(
        {"package_id": package["_id"]},
        sort=[("timestamp", -1)]
    )
    
    if not latest_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location updates found for this package"
        )
    
    # Get recipient coordinates
    recipient_lat = package["recipient"].get("latitude", 0.0)
    recipient_lng = package["recipient"].get("longitude", 0.0)
    
    if recipient_lat == 0.0 or recipient_lng == 0.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient location not set"
        )
    
    # Calculate ETA
    eta = calculate_eta(
        latest_location["latitude"],
        latest_location["longitude"],
        recipient_lat,
        recipient_lng
    )
    
    if not eta:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate ETA"
        )
    
    # Format ETA
    eta_info = format_eta(eta)
    
    # Store or update prediction
    prediction_doc = {
        "package_id": package["_id"],
        "eta": eta,
        "calculated_at": datetime.utcnow()
    }
    
    await predictions_collection.update_one(
        {"package_id": package["_id"]},
        {"$set": prediction_doc},
        upsert=True
    )
    
    return PredictionResponse(
        id="",  # Not needed for response
        package_id=str(package["_id"]),
        tracking_id=tracking_id,
        eta=eta,
        calculated_at=datetime.utcnow(),
        time_remaining_minutes=eta_info["time_remaining_minutes"],
        formatted_eta=eta_info["formatted"]
    )

