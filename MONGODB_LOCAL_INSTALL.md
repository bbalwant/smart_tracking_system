# MongoDB Local Installation - Manual Steps

Since you're on Linux Mint 22.1 (based on Ubuntu 22.04), follow these steps:

## Step 1: Import MongoDB GPG Key

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

## Step 2: Add MongoDB Repository

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

## Step 3: Update Package List

```bash
sudo apt update
```

## Step 4: Install MongoDB

```bash
sudo apt install -y mongodb-org
```

## Step 5: Start MongoDB Service

```bash
sudo systemctl start mongod
```

## Step 6: Enable MongoDB to Start on Boot

```bash
sudo systemctl enable mongod
```

## Step 7: Verify Installation

```bash
sudo systemctl status mongod
```

You should see "Active: active (running)".

## Step 8: Test MongoDB Connection

```bash
mongosh --eval "db.version()"
```

If `mongosh` is not installed, you can install it separately:
```bash
sudo apt install -y mongodb-mongosh
```

## Step 9: Update backend/.env

Edit `/home/balwants/Desktop/Projects/Track_order/backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=track_order
JWT_SECRET_KEY=LK85WrFa9RVemgVK5kC1cN75Fh5IyMlfHUFvCH6B5jU
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ENVIRONMENT=development
PORT=8000
```

## Step 10: Restart Backend Server

After updating `.env`, restart your backend:

```bash
cd /home/balwants/Desktop/Projects/Track_order/backend
source venv/bin/activate
python3 main.py
```

## Troubleshooting

### If mongosh command not found:
```bash
sudo apt install -y mongodb-mongosh
```

### If MongoDB fails to start:
```bash
# Check logs
sudo journalctl -u mongod -n 50

# Check if MongoDB is listening
sudo netstat -tlnp | grep 27017
```

### If you get permission errors:
```bash
# Check MongoDB data directory permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

## Quick Copy-Paste Commands

Run these commands one by one in your terminal:

```bash
# 1. Import GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# 2. Add repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 3. Update and install
sudo apt update
sudo apt install -y mongodb-org

# 4. Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod

# 5. Check status
sudo systemctl status mongod
```

