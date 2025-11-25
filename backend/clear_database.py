"""
Script to clear all data from the database
WARNING: This will delete all users, packages, location updates, and predictions
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "track_order")


async def clear_database():
    """Clear all collections in the database"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        print("🔌 Connected to MongoDB")
        print(f"📊 Database: {DATABASE_NAME}")
        print()
        
        # List of collections to clear
        collections_to_clear = [
            "users",
            "packages",
            "location_updates",
            "predictions"
        ]
        
        # Get collection counts before deletion
        print("📈 Current data counts:")
        for collection_name in collections_to_clear:
            collection = db[collection_name]
            count = await collection.count_documents({})
            print(f"  - {collection_name}: {count} documents")
        print()
        
        # Confirm deletion
        print("⚠️  WARNING: This will delete ALL data from the following collections:")
        for collection_name in collections_to_clear:
            print(f"   - {collection_name}")
        print()
        
        response = input("Are you sure you want to proceed? (yes/no): ")
        if response.lower() not in ["yes", "y"]:
            print("❌ Operation cancelled")
            client.close()
            return
        
        print()
        print("🗑️  Clearing database...")
        
        # Clear each collection
        deleted_counts = {}
        for collection_name in collections_to_clear:
            collection = db[collection_name]
            result = await collection.delete_many({})
            deleted_counts[collection_name] = result.deleted_count
            print(f"  ✅ Deleted {result.deleted_count} documents from {collection_name}")
        
        print()
        print("✅ Database cleared successfully!")
        print()
        print("📊 Deleted counts:")
        for collection_name, count in deleted_counts.items():
            print(f"  - {collection_name}: {count} documents")
        
        # Verify collections are empty
        print()
        print("🔍 Verifying...")
        for collection_name in collections_to_clear:
            collection = db[collection_name]
            count = await collection.count_documents({})
            if count == 0:
                print(f"  ✅ {collection_name}: Empty")
            else:
                print(f"  ⚠️  {collection_name}: {count} documents remaining")
        
        client.close()
        print()
        print("✅ Done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("=" * 60)
    print("🗑️  Database Cleanup Script")
    print("=" * 60)
    print()
    asyncio.run(clear_database())

