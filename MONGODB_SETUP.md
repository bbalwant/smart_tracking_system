# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud - EASIEST & RECOMMENDED) ⭐

This is the fastest way to get started:

1. **Go to MongoDB Atlas:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account

2. **Create a Free Cluster:**
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select a cloud provider and region (closest to you)
   - Click "Create"

3. **Set Up Database Access:**
   - Go to "Database Access" in the left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `trackorder` (or any username)
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Atlas admin"
   - Click "Add User"

4. **Set Up Network Access:**
   - Go to "Network Access" in the left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your current IP: `0.0.0.0/0`
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials

6. **Update backend/.env:**
   ```env
   MONGODB_URI=mongodb+srv://trackorder:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/track_order?retryWrites=true&w=majority
   ```

**Time to set up: ~5 minutes**

---

## Option 2: Install MongoDB Locally (More Complex)

If you prefer local MongoDB, follow these steps:

### Step 1: Add MongoDB Official Repository

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt update
```

### Step 2: Install MongoDB

```bash
sudo apt install -y mongodb-org
```

### Step 3: Start MongoDB

```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

### Step 4: Verify Installation

```bash
# Test MongoDB connection
mongosh --eval "db.version()"
```

### Step 5: Update backend/.env

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=track_order
```

---

## Quick Setup Script (Local MongoDB)

I can create a script to automate the local installation. Would you like me to do that?

---

## Recommendation

**For development, I strongly recommend MongoDB Atlas (Option 1)** because:
- ✅ No installation needed
- ✅ Free tier available
- ✅ Works immediately
- ✅ No local resource usage
- ✅ Easy to share with team
- ✅ Automatic backups

**Time comparison:**
- MongoDB Atlas: ~5 minutes
- Local MongoDB: ~15-20 minutes + troubleshooting

---

## After Setup

Once MongoDB is configured:

1. **Update `backend/.env`** with your MongoDB URI
2. **Restart backend server:**
   ```bash
   cd backend
   source venv/bin/activate
   python3 main.py
   ```
3. **Test registration:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"123456","role":"customer"}'
   ```

