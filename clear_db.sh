#!/bin/bash

# Script to clear the database
# This will delete all users, packages, location updates, and predictions

echo "=========================================="
echo "🗑️  Database Cleanup Script"
echo "=========================================="
echo ""

cd backend

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Make sure MONGODB_URI and DATABASE_NAME are set"
    echo ""
fi

# Run the cleanup script
echo "🚀 Running database cleanup..."
python3 clear_database.py

echo ""
echo "✅ Script completed!"

