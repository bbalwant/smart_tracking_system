"""
Package management routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from db.connection import get_database
from models.package import PackageCreate, PackageUpdate, PackageResponse, PackageListResponse
from models.user import UserResponse
from auth.dependencies import get_current_active_user, require_role
from packages.utils import generate_tracking_id
from datetime import datetime
from bson import ObjectId
from typing import Optional

router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.post("", response_model=PackageResponse, status_code=status.HTTP_201_CREATED)
async def create_package(
    package_data: PackageCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Create a new package
    
    - **sender**: Sender information (name, address, phone)
    - **recipient**: Recipient information (name, address, phone)
    - **status**: Package status (default: registered)
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    
    # Generate unique tracking ID
    tracking_id = generate_tracking_id()
    
    # Check if tracking ID already exists (very unlikely, but check anyway)
    existing = await packages_collection.find_one({"tracking_id": tracking_id})
    max_attempts = 10
    attempts = 0
    while existing and attempts < max_attempts:
        tracking_id = generate_tracking_id()
        existing = await packages_collection.find_one({"tracking_id": tracking_id})
        attempts += 1
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate unique tracking ID"
        )
    
    # Create package document
    package_doc = {
        "tracking_id": tracking_id,
        "sender": package_data.sender.model_dump(),
        "recipient": package_data.recipient.model_dump(),
        "status": package_data.status,
        "user_id": ObjectId(current_user.id),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert package into database
    result = await packages_collection.insert_one(package_doc)
    
    # Create indexes if they don't exist
    try:
        await packages_collection.create_index("tracking_id", unique=True)
        await packages_collection.create_index("user_id")
        await packages_collection.create_index("status")
    except Exception:
        pass  # Indexes might already exist
    
    # Fetch created package
    created_package = await packages_collection.find_one({"_id": result.inserted_id})
    
    # Ensure latitude/longitude exist (should already be there from new packages)
    sender = created_package["sender"].copy() if isinstance(created_package["sender"], dict) else created_package["sender"]
    recipient = created_package["recipient"].copy() if isinstance(created_package["recipient"], dict) else created_package["recipient"]
    
    if isinstance(sender, dict):
        sender.setdefault("latitude", 0.0)
        sender.setdefault("longitude", 0.0)
    if isinstance(recipient, dict):
        recipient.setdefault("latitude", 0.0)
        recipient.setdefault("longitude", 0.0)
    
    return PackageResponse(
        id=str(created_package["_id"]),
        tracking_id=created_package["tracking_id"],
        sender=sender,
        recipient=recipient,
        status=created_package["status"],
        user_id=str(created_package["user_id"]),
        created_at=created_package["created_at"],
        updated_at=created_package["updated_at"]
    )


@router.get("/{tracking_id}", response_model=PackageResponse)
async def get_package_by_tracking_id(tracking_id: str):
    """
    Get package by tracking ID (public endpoint - no auth required for lookup)
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    package = await packages_collection.find_one({"tracking_id": tracking_id})
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # Handle missing latitude/longitude in old packages
    sender = package["sender"].copy() if isinstance(package["sender"], dict) else package["sender"]
    recipient = package["recipient"].copy() if isinstance(package["recipient"], dict) else package["recipient"]
    
    if isinstance(sender, dict):
        sender.setdefault("latitude", 0.0)
        sender.setdefault("longitude", 0.0)
    if isinstance(recipient, dict):
        recipient.setdefault("latitude", 0.0)
        recipient.setdefault("longitude", 0.0)
    
    return PackageResponse(
        id=str(package["_id"]),
        tracking_id=package["tracking_id"],
        sender=sender,
        recipient=recipient,
        status=package["status"],
        user_id=str(package["user_id"]),
        created_at=package["created_at"],
        updated_at=package["updated_at"]
    )


@router.get("", response_model=PackageListResponse)
async def list_packages(
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(registered|in_transit|delivered)$"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    List packages
    
    - **status**: Optional filter by status
    - Customers see only their own packages
    - Managers and Delivery Staff see all packages
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    
    # Build query - managers and delivery_staff can see all packages, customers see only their own
    if current_user.role in ["manager", "delivery_staff"]:
        query = {}
    else:
        query = {"user_id": ObjectId(current_user.id)}
    
    if status_filter:
        query["status"] = status_filter
    
    # Fetch packages
    cursor = packages_collection.find(query).sort("created_at", -1)
    packages = await cursor.to_list(length=100)
    
    package_list = []
    for pkg in packages:
        # Handle missing latitude/longitude in old packages
        sender = pkg["sender"].copy() if isinstance(pkg["sender"], dict) else pkg["sender"]
        recipient = pkg["recipient"].copy() if isinstance(pkg["recipient"], dict) else pkg["recipient"]
        
        if isinstance(sender, dict):
            sender.setdefault("latitude", 0.0)
            sender.setdefault("longitude", 0.0)
        if isinstance(recipient, dict):
            recipient.setdefault("latitude", 0.0)
            recipient.setdefault("longitude", 0.0)
        
        package_list.append(
            PackageResponse(
                id=str(pkg["_id"]),
                tracking_id=pkg["tracking_id"],
                sender=sender,
                recipient=recipient,
                status=pkg["status"],
                user_id=str(pkg["user_id"]),
                created_at=pkg["created_at"],
                updated_at=pkg["updated_at"]
            )
        )
    
    return PackageListResponse(
        packages=package_list,
        total=len(package_list)
    )


@router.put("/{tracking_id}", response_model=PackageResponse)
async def update_package(
    tracking_id: str,
    package_update: PackageUpdate,
    current_user: UserResponse = Depends(require_role(["manager", "delivery_staff"]))
):
    """
    Update a package (admin/manager/delivery_staff only)
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    
    # Find package
    package = await packages_collection.find_one({"tracking_id": tracking_id})
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # Build update document
    update_doc = {"updated_at": datetime.utcnow()}
    if package_update.sender:
        update_doc["sender"] = package_update.sender.model_dump()
    if package_update.recipient:
        update_doc["recipient"] = package_update.recipient.model_dump()
    if package_update.status:
        update_doc["status"] = package_update.status
    
    # Update package
    await packages_collection.update_one(
        {"tracking_id": tracking_id},
        {"$set": update_doc}
    )
    
    # Fetch updated package
    updated_package = await packages_collection.find_one({"tracking_id": tracking_id})
    
    # Handle missing latitude/longitude in old packages
    sender = updated_package["sender"].copy() if isinstance(updated_package["sender"], dict) else updated_package["sender"]
    recipient = updated_package["recipient"].copy() if isinstance(updated_package["recipient"], dict) else updated_package["recipient"]
    
    if isinstance(sender, dict):
        sender.setdefault("latitude", 0.0)
        sender.setdefault("longitude", 0.0)
    if isinstance(recipient, dict):
        recipient.setdefault("latitude", 0.0)
        recipient.setdefault("longitude", 0.0)
    
    return PackageResponse(
        id=str(updated_package["_id"]),
        tracking_id=updated_package["tracking_id"],
        sender=sender,
        recipient=recipient,
        status=updated_package["status"],
        user_id=str(updated_package["user_id"]),
        created_at=updated_package["created_at"],
        updated_at=updated_package["updated_at"]
    )


@router.put("/{tracking_id}/status", response_model=PackageResponse)
async def update_package_status_endpoint(
    tracking_id: str,
    new_status: str,
    current_user: UserResponse = Depends(require_role(["manager", "delivery_staff"]))
):
    """
    Update package status (manager/delivery_staff only)
    
    - **tracking_id**: Package tracking ID
    - **new_status**: New status (registered, in_transit, delivered)
    """
    from packages.status import can_transition, update_package_status
    
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    
    # Find package
    package = await packages_collection.find_one({"tracking_id": tracking_id})
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    # Validate status
    if new_status not in ["registered", "in_transit", "delivered"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be one of: registered, in_transit, delivered"
        )
    
    # Validate transition
    current_status = package["status"]
    if not can_transition(current_status, new_status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {current_status} to {new_status}"
        )
    
    # Update status
    success = await update_package_status(tracking_id, new_status, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update package status"
        )
    
    # Fetch updated package
    updated_package = await packages_collection.find_one({"tracking_id": tracking_id})
    
    # Handle missing latitude/longitude in old packages
    sender = updated_package["sender"].copy() if isinstance(updated_package["sender"], dict) else updated_package["sender"]
    recipient = updated_package["recipient"].copy() if isinstance(updated_package["recipient"], dict) else updated_package["recipient"]
    
    if isinstance(sender, dict):
        sender.setdefault("latitude", 0.0)
        sender.setdefault("longitude", 0.0)
    if isinstance(recipient, dict):
        recipient.setdefault("latitude", 0.0)
        recipient.setdefault("longitude", 0.0)
    
    return PackageResponse(
        id=str(updated_package["_id"]),
        tracking_id=updated_package["tracking_id"],
        sender=sender,
        recipient=recipient,
        status=updated_package["status"],
        user_id=str(updated_package["user_id"]),
        created_at=updated_package["created_at"],
        updated_at=updated_package["updated_at"]
    )


@router.delete("/{tracking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_package(
    tracking_id: str,
    current_user: UserResponse = Depends(require_role(["manager"]))
):
    """
    Delete a package (manager only)
    """
    try:
        db = get_database()
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    
    packages_collection = db.packages
    
    # Find and delete package
    result = await packages_collection.delete_one({"tracking_id": tracking_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )
    
    return None

