#!/bin/bash

# MongoDB Installation Script for Ubuntu
# This script installs MongoDB Community Edition

set -e

echo "🔧 MongoDB Installation Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please run this script without sudo. It will ask for sudo when needed."
   exit 1
fi

# Check Ubuntu version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
    echo "✅ Detected OS: $OS $VER"
else
    echo "❌ Cannot detect OS version"
    exit 1
fi

# Import MongoDB public GPG key
echo ""
echo "📥 Importing MongoDB GPG key..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "📦 Adding MongoDB repository..."
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
echo "🔄 Updating package list..."
sudo apt update

# Install MongoDB
echo "📥 Installing MongoDB..."
sudo apt install -y mongodb-org

# Start MongoDB service
echo "🚀 Starting MongoDB service..."
sudo systemctl start mongod

# Enable MongoDB to start on boot
echo "⚙️  Enabling MongoDB to start on boot..."
sudo systemctl enable mongod

# Check status
echo ""
echo "📊 Checking MongoDB status..."
if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB is running!"
else
    echo "❌ MongoDB failed to start. Check logs with: sudo systemctl status mongod"
    exit 1
fi

# Test connection
echo ""
echo "🧪 Testing MongoDB connection..."
if command -v mongosh &> /dev/null; then
    mongosh --eval "db.version()" --quiet
    echo "✅ MongoDB connection successful!"
else
    echo "⚠️  mongosh not found, but MongoDB is running"
fi

echo ""
echo "✅ MongoDB installation complete!"
echo ""
echo "📝 Update your backend/.env file with:"
echo "   MONGODB_URI=mongodb://localhost:27017"
echo ""
echo "🔄 Then restart your backend server"

