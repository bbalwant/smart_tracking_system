"""
Unit tests for ETA calculation logic
"""
import pytest
from datetime import datetime, timedelta
from tracking.eta import calculate_distance, calculate_eta, format_eta


def test_calculate_distance_same_location():
    """Test distance calculation for same location"""
    distance = calculate_distance(28.6139, 77.2090, 28.6139, 77.2090)
    assert distance == 0.0


def test_calculate_distance_delhi_to_gurgaon():
    """Test distance calculation between Delhi and Gurgaon (known distance ~30km)"""
    # Delhi coordinates
    delhi_lat, delhi_lon = 28.6139, 77.2090
    # Gurgaon coordinates
    gurgaon_lat, gurgaon_lon = 28.4089, 77.0418
    
    distance = calculate_distance(delhi_lat, delhi_lon, gurgaon_lat, gurgaon_lon)
    # Should be approximately 30-35 km
    assert 25 < distance < 40


def test_calculate_eta_valid():
    """Test ETA calculation with valid coordinates"""
    # Current location (Delhi)
    current_lat, current_lon = 28.6139, 77.2090
    # Destination (Gurgaon)
    dest_lat, dest_lon = 28.4089, 77.0418
    
    eta = calculate_eta(current_lat, current_lon, dest_lat, dest_lon)
    assert eta is not None
    assert isinstance(eta, datetime)
    # ETA should be in the future
    assert eta > datetime.utcnow()


def test_calculate_eta_very_close():
    """Test ETA calculation when very close to destination"""
    # Same location (should return ~5 minutes)
    lat, lon = 28.6139, 77.2090
    eta = calculate_eta(lat, lon, lat, lon)
    assert eta is not None
    # Should be very close (within 10 minutes)
    time_diff = (eta - datetime.utcnow()).total_seconds() / 60
    assert 0 < time_diff < 10


def test_format_eta_future():
    """Test ETA formatting for future time"""
    future_eta = datetime.utcnow() + timedelta(hours=2, minutes=30)
    formatted = format_eta(future_eta)
    
    assert "eta" in formatted
    assert "formatted" in formatted
    assert "time_remaining_minutes" in formatted
    assert formatted["time_remaining_minutes"] > 0
    assert not formatted["is_overdue"]


def test_format_eta_past():
    """Test ETA formatting for past time (overdue)"""
    past_eta = datetime.utcnow() - timedelta(hours=1)
    formatted = format_eta(past_eta)
    
    assert formatted["is_overdue"]
    assert formatted["time_remaining_minutes"] == 0
    assert "Arrived" in formatted["formatted"] or formatted["formatted"] == "Arrived"


def test_format_eta_hours_minutes():
    """Test ETA formatting shows hours and minutes correctly"""
    future_eta = datetime.utcnow() + timedelta(hours=1, minutes=45)
    formatted = format_eta(future_eta)
    
    assert "h" in formatted["formatted"] or "m" in formatted["formatted"]

