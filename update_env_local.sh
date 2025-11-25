#!/bin/bash

# Update .env file for local MongoDB

ENV_FILE="/home/balwants/Desktop/Projects/Track_order/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

# Backup original
cp "$ENV_FILE" "${ENV_FILE}.backup"

# Update MONGODB_URI to local
sed -i 's|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017|' "$ENV_FILE"

# Update JWT_SECRET_KEY if it's still the default
if grep -q "JWT_SECRET_KEY=your-secret-key-here" "$ENV_FILE"; then
    sed -i 's|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=LK85WrFa9RVemgVK5kC1cN75Fh5IyMlfHUFvCH6B5jU|' "$ENV_FILE"
fi

echo "✅ Updated .env file for local MongoDB"
echo ""
echo "Current MONGODB_URI:"
grep "MONGODB_URI" "$ENV_FILE"
echo ""
echo "Backup saved to: ${ENV_FILE}.backup"

