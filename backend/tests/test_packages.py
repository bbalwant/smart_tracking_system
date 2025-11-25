"""
Unit tests for package management endpoints
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from bson import ObjectId
import json

client = TestClient(app)


@pytest.fixture
def auth_token():
    """Create a test user and return auth token"""
    # Register user
    user_data = {
        "name": "Test User",
        "email": f"test_{ObjectId()}@example.com",
        "password": "testpassword123",
        "role": "customer"
    }
    client.post("/api/auth/register", json=user_data)
    
    # Login
    login_response = client.post("/api/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    return login_response.json()["access_token"]


@pytest.fixture
def package_data():
    """Test package data"""
    return {
        "sender": {
            "name": "John Doe",
            "address": "123 Main St, City",
            "phone": "1234567890",
            "latitude": 28.6139,
            "longitude": 77.2090
        },
        "recipient": {
            "name": "Jane Smith",
            "address": "456 Oak Ave, Town",
            "phone": "0987654321",
            "latitude": 28.7041,
            "longitude": 77.1025
        },
        "status": "registered"
    }


def test_create_package(auth_token, package_data):
    """Test creating a package"""
    response = client.post(
        "/api/packages",
        json=package_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "tracking_id" in data
    assert data["tracking_id"].startswith("TRK-")
    assert data["status"] == "registered"


def test_create_package_unauthenticated(package_data):
    """Test creating package without authentication"""
    response = client.post("/api/packages", json=package_data)
    assert response.status_code == 401


def test_get_package_by_tracking_id(auth_token, package_data):
    """Test getting package by tracking ID"""
    # Create package
    create_response = client.post(
        "/api/packages",
        json=package_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    tracking_id = create_response.json()["tracking_id"]
    
    # Get package
    response = client.get(f"/api/packages/{tracking_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["tracking_id"] == tracking_id
    assert data["sender"]["name"] == package_data["sender"]["name"]


def test_get_package_invalid_tracking_id():
    """Test getting package with invalid tracking ID"""
    response = client.get("/api/packages/INVALID-ID")
    assert response.status_code == 404


def test_list_packages(auth_token, package_data):
    """Test listing packages"""
    # Create a package
    client.post(
        "/api/packages",
        json=package_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # List packages
    response = client.get(
        "/api/packages",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "packages" in data
    assert "total" in data
    assert len(data["packages"]) > 0


def test_list_packages_with_status_filter(auth_token, package_data):
    """Test listing packages with status filter"""
    # Create a package
    client.post(
        "/api/packages",
        json=package_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # List packages with status filter
    response = client.get(
        "/api/packages?status=registered",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert all(pkg["status"] == "registered" for pkg in data["packages"])

