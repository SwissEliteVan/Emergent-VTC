#!/usr/bin/env python3
"""
Test MongoDB connectivity for Romuo.ch VTC Backend
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

async def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    
    # Load environment variables
    backend_dir = Path("/app/backend")
    load_dotenv(backend_dir / '.env')
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"🔗 Testing MongoDB connection...")
    print(f"📍 MongoDB URL: {mongo_url}")
    print(f"🗄️  Database: {db_name}")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection with a simple ping
        await client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Test database operations
        test_collection = db.test_connection
        
        # Insert a test document
        test_doc = {"test": "connection", "timestamp": "2024-01-01"}
        result = await test_collection.insert_one(test_doc)
        print(f"✅ Document inserted with ID: {result.inserted_id}")
        
        # Find the document
        found_doc = await test_collection.find_one({"test": "connection"})
        if found_doc:
            print("✅ Document retrieval successful")
        else:
            print("❌ Document retrieval failed")
            
        # Clean up test document
        await test_collection.delete_one({"test": "connection"})
        print("✅ Test document cleaned up")
        
        # Test collections that the VTC app uses
        collections_to_check = ["users", "user_sessions", "rides"]
        for collection_name in collections_to_check:
            collection = db[collection_name]
            count = await collection.count_documents({})
            print(f"📊 Collection '{collection_name}': {count} documents")
            
        client.close()
        print("✅ All MongoDB tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        return False

async def main():
    success = await test_mongodb_connection()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())