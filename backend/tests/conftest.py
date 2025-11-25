"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from db.connection import get_database
import os

# Set test database
os.environ["MONGODB_URI"] = os.getenv("MONGODB_URI", "mongodb://localhost:27017/test_tracking")

@pytest.fixture(scope="session")
def client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture(autouse=True)
async def cleanup_database():
    """Clean up test database after each test"""
    yield
    # Cleanup can be added here if needed
    pass

