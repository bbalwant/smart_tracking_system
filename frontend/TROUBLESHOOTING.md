# Troubleshooting: Cannot Connect to Backend

## Issue
Frontend cannot connect to backend at `http://localhost:8000`

## Backend Status ✅
- Backend is running (verified)
- Port 8000 is listening (verified)
- Health check works: `curl http://localhost:8000/health` returns OK

## Solution Steps

### 1. Restart Frontend Dev Server
The `.env.local` file needs to be loaded. **You MUST restart the dev server** after creating/updating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
cd frontend
npm run dev
```

### 2. Verify .env.local File
Make sure `frontend/.env.local` exists and contains:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Check Browser Console
Open browser DevTools (F12) and check:
- Console tab for errors
- Network tab to see if requests are being made
- Check the request URL (should be `http://localhost:8000/api/auth/...`)

### 4. Test Backend Directly
In browser console, test the connection:

```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If this fails, there's a network/CORS issue.

### 5. Check CORS Configuration
Verify `backend/.env` has:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Then restart the backend server.

### 6. Verify Ports
- Backend should be on: `http://localhost:8000`
- Frontend should be on: `http://localhost:3000`

### 7. Clear Browser Cache
Sometimes browser caches can cause issues:
- Hard refresh: `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:8000/health

# Test backend login endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Check if ports are listening
netstat -tln | grep -E "(3000|8000)"
```

## Most Common Fix

**Restart the frontend dev server** - This is the #1 cause of this issue. The `.env.local` file is only loaded when the dev server starts.

