# Setup Instructions for Sprint 1 Testing

## Issue Found
The backend `.env` file was missing, which caused the MongoDB connection to fail.

## ✅ What I've Done
1. Created `backend/.env` file from the example template

## 🔧 What You Need to Do

### Step 1: Configure MongoDB

You have two options:

#### Option A: MongoDB Atlas (Cloud - Recommended for Development)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/track_order?retryWrites=true&w=majority
   ```

#### Option B: Local MongoDB
1. Install MongoDB:
   ```bash
   sudo apt install mongodb
   ```
2. Start MongoDB:
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```
3. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   ```

### Step 2: Configure JWT Secret

Generate a secure secret key and update `backend/.env`:

```bash
# Generate a secure key (already done for you)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Then update `backend/.env`:
```env
JWT_SECRET_KEY=your-generated-secret-key-here
```

### Step 3: Verify .env File

Your `backend/.env` should look like this:

```env
# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string-here
DATABASE_NAME=track_order

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Server Configuration
ENVIRONMENT=development
PORT=8000
```

### Step 4: Restart Backend Server

After updating `.env`, restart your backend server:

```bash
# Stop the current server (Ctrl+C in the terminal running it)
# Then restart:
cd backend
source venv/bin/activate
python3 main.py
```

### Step 5: Test Registration

Once the backend is running with the correct configuration, test the registration:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Balwant singh",
    "email":"bbalwant000@gmail.com",
    "password":"123456789",
    "role":"manager"
  }'
```

Expected response:
```json
{
  "id": "...",
  "name": "Balwant singh",
  "email": "bbalwant000@gmail.com",
  "role": "manager",
  "created_at": "2024-..."
}
```

## Troubleshooting

### Error: "Database connection error"
- Check that `MONGODB_URI` is correct in `.env`
- Verify MongoDB is running (if local) or accessible (if Atlas)
- Make sure you restarted the backend after updating `.env`

### Error: "Email already registered"
- This means the user was created successfully!
- Try with a different email or test the login endpoint

### Error: Connection timeout
- Check your internet connection (for MongoDB Atlas)
- Verify firewall settings
- Check MongoDB Atlas IP whitelist (should allow 0.0.0.0/0 for development)

## Next Steps

After successful registration:
1. Test login endpoint
2. Test protected `/api/auth/me` endpoint
3. Test frontend registration/login flow

