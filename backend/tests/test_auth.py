"""
Unit tests for authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from db.connection import get_database
from bson import ObjectId
import asyncio

client = TestClient(app)


@pytest.fixture
def test_user_data():
    """Test user data for registration"""
    return {
        "name": "Test User",
        "email": f"test_{ObjectId()}@example.com",
        "password": "testpassword123",
        "role": "customer"
    }


def test_register_user(test_user_data):
    """Test user registration"""
    response = client.post("/api/auth/register", json=test_user_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["email"] == test_user_data["email"]
    assert "password" not in data  # Password should not be in response


def test_register_duplicate_email(test_user_data):
    """Test registration with duplicate email"""
    # Register first time
    client.post("/api/auth/register", json=test_user_data)
    
    # Try to register again with same email
    response = client.post("/api/auth/register", json=test_user_data)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_register_invalid_email():
    """Test registration with invalid email"""
    response = client.post("/api/auth/register", json={
        "name": "Test",
        "email": "invalid-email",
        "password": "test123",
        "role": "customer"
    })
    assert response.status_code == 422  # Validation error


def test_login_success(test_user_data):
    """Test successful login"""
    # Register user first
    client.post("/api/auth/register", json=test_user_data)
    
    # Login
    response = client.post("/api/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(test_user_data):
    """Test login with invalid credentials"""
    # Register user first
    client.post("/api/auth/register", json=test_user_data)
    
    # Try login with wrong password
    response = client.post("/api/auth/login", json={
        "email": test_user_data["email"],
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_get_me_authenticated(test_user_data):
    """Test getting current user info when authenticated"""
    # Register and login
    client.post("/api/auth/register", json=test_user_data)
    login_response = client.post("/api/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    })
    token = login_response.json()["access_token"]
    
    # Get current user
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user_data["email"]


def test_get_me_unauthenticated():
    """Test getting current user info without authentication"""
    response = client.get("/api/auth/me")
    assert response.status_code == 401

