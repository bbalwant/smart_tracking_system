"""
Unit tests for tracking endpoints
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from bson import ObjectId

client = TestClient(app)


@pytest.fixture
def delivery_token():
    """Create a delivery staff user and return auth token"""
    user_data = {
        "name": "Delivery Staff",
        "email": f"delivery_{ObjectId()}@example.com",
        "password": "testpassword123",
        "role": "delivery_staff"
    }
    client.post("/api/auth/register", json=user_data)
    
    login_response = client.post("/api/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    return login_response.json()["access_token"]


@pytest.fixture
def customer_token():
    """Create a customer user and return auth token"""
    user_data = {
        "name": "Customer",
        "email": f"customer_{ObjectId()}@example.com",
        "password": "testpassword123",
        "role": "customer"
    }
    client.post("/api/auth/register", json=user_data)
    
    login_response = client.post("/api/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    return login_response.json()["access_token"]


@pytest.fixture
def test_package(customer_token):
    """Create a test package and return tracking ID"""
    package_data = {
        "sender": {
            "name": "Sender",
            "address": "123 Main St",
            "phone": "1234567890",
            "latitude": 28.6139,
            "longitude": 77.2090
        },
        "recipient": {
            "name": "Recipient",
            "address": "456 Oak Ave",
            "phone": "0987654321",
            "latitude": 28.7041,
            "longitude": 77.1025
        },
        "status": "registered"
    }
    
    response = client.post(
        "/api/packages",
        json=package_data,
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    return response.json()["tracking_id"]


def test_update_location(delivery_token, test_package):
    """Test updating package location"""
    response = client.post(
        f"/api/tracking/{test_package}/update",
        json={"latitude": 28.6500, "longitude": 77.2000},
        headers={"Authorization": f"Bearer {delivery_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["latitude"] == 28.6500
    assert data["longitude"] == 77.2000


def test_update_location_invalid_coordinates(delivery_token, test_package):
    """Test updating location with invalid coordinates"""
    response = client.post(
        f"/api/tracking/{test_package}/update",
        json={"latitude": 100.0, "longitude": 200.0},  # Invalid coordinates
        headers={"Authorization": f"Bearer {delivery_token}"}
    )
    assert response.status_code == 422  # Validation error


def test_update_location_customer_unauthorized(customer_token, test_package):
    """Test that customers cannot update locations"""
    response = client.post(
        f"/api/tracking/{test_package}/update",
        json={"latitude": 28.6500, "longitude": 77.2000},
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 403  # Forbidden


def test_get_route_history(customer_token, test_package, delivery_token):
    """Test getting route history"""
    # Update location first
    client.post(
        f"/api/tracking/{test_package}/update",
        json={"latitude": 28.6500, "longitude": 77.2000},
        headers={"Authorization": f"Bearer {delivery_token}"}
    )
    
    # Get route history
    response = client.get(
        f"/api/tracking/{test_package}/history",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "locations" in data
    assert "total" in data
    assert len(data["locations"]) > 0


def test_get_eta(customer_token, test_package, delivery_token):
    """Test getting ETA for a package"""
    # Update location first
    client.post(
        f"/api/tracking/{test_package}/update",
        json={"latitude": 28.6500, "longitude": 77.2000},
        headers={"Authorization": f"Bearer {delivery_token}"}
    )
    
    # Get ETA
    response = client.get(
        f"/api/tracking/{test_package}/eta",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "eta" in data
    assert "formatted_eta" in data
    assert "time_remaining_minutes" in data

