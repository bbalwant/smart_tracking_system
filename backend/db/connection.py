"""
MongoDB connection module using Motor (async MongoDB driver)
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None

db = MongoDB()

async def connect_to_mongo():
    """Create database connection"""
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db.client = AsyncIOMotorClient(mongodb_uri)
    database_name = os.getenv("DATABASE_NAME", "track_order")
    return db.client[database_name]

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()

def get_database():
    """Get database instance"""
    database_name = os.getenv("DATABASE_NAME", "track_order")
    if db.client is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.client[database_name]

