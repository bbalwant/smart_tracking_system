"""
ETA calculation logic using rule-based approach
"""
import math
from datetime import datetime, timedelta
from typing import Optional, Tuple


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    # Radius of Earth in kilometers
    R = 6371.0
    
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


def calculate_eta(
    current_lat: float,
    current_lon: float,
    destination_lat: float,
    destination_lon: float,
    average_speed_kmh: float = 30.0
) -> Optional[datetime]:
    """
    Calculate Estimated Time of Arrival (ETA) based on:
    - Current location
    - Destination location
    - Average delivery vehicle speed (default: 30 km/h)
    
    Returns ETA as datetime, or None if calculation fails
    """
    try:
        # Calculate distance in kilometers
        distance_km = calculate_distance(
            current_lat, current_lon,
            destination_lat, destination_lon
        )
        
        # If distance is very small (< 100 meters), consider it arrived
        if distance_km < 0.1:
            return datetime.utcnow() + timedelta(minutes=5)
        
        # Calculate time in hours: distance / speed
        time_hours = distance_km / average_speed_kmh
        
        # Add buffer time (10% of calculated time, minimum 5 minutes)
        buffer_hours = max(time_hours * 0.1, 5 / 60)
        total_time_hours = time_hours + buffer_hours
        
        # Convert to timedelta and add to current time
        eta = datetime.utcnow() + timedelta(hours=total_time_hours)
        
        return eta
    except Exception as e:
        print(f"Error calculating ETA: {e}")
        return None


def format_eta(eta: datetime) -> dict:
    """
    Format ETA for display
    Returns dict with formatted strings and time remaining
    """
    now = datetime.utcnow()
    time_remaining = eta - now
    
    if time_remaining.total_seconds() < 0:
        return {
            "eta": eta,
            "formatted": "Arrived",
            "time_remaining_minutes": 0,
            "time_remaining_hours": 0,
            "is_overdue": True
        }
    
    total_minutes = int(time_remaining.total_seconds() / 60)
    hours = total_minutes // 60
    minutes = total_minutes % 60
    
    if hours > 0:
        formatted = f"{hours}h {minutes}m"
    else:
        formatted = f"{minutes}m"
    
    return {
        "eta": eta,
        "formatted": formatted,
        "time_remaining_minutes": total_minutes,
        "time_remaining_hours": hours,
        "is_overdue": False
    }

