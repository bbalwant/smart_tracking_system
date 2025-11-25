#!/bin/bash

# Smart Package Tracking System - Setup Script
# This script helps set up the development environment

echo "🚀 Setting up Smart Package Tracking System..."
echo ""

# Backend Setup
echo "📦 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your MongoDB URI and other configuration"
fi

cd ..

# Frontend Setup
echo ""
echo "📦 Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file from example..."
    cp env.example .env.local
    echo "⚠️  Please edit frontend/.env.local with your API URLs"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your MongoDB URI and JWT secret"
echo "2. Edit frontend/.env.local with your API URLs"
echo "3. Start backend: cd backend && source venv/bin/activate && python3 main.py"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "📚 See README.md for detailed setup instructions"

