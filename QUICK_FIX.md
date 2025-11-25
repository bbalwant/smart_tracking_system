# Quick Fix: Cannot Connect to Backend

## The Problem
Frontend shows: "Cannot connect to server at http://localhost:8000"

## ✅ Verified Working
- Backend is running on port 8000
- Backend health check works
- CORS is configured correctly
- Backend registration endpoint works via curl

## 🔧 Solution

### Step 1: Restart Frontend Dev Server
**This is the most important step!**

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd /home/balwants/Desktop/Projects/Track_order/frontend
npm run dev
```

**Why?** Next.js only loads `.env.local` when the dev server starts. If you created/updated `.env.local` after starting the server, it won't be loaded until you restart.

### Step 2: Verify .env.local
Make sure `frontend/.env.local` exists and contains:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 3: Test in Browser Console
After restarting, open browser console (F12) and run:

```javascript
// Test connection
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// Check API URL
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
```

### Step 4: Check Browser Console
Look for:
- `🔗 Backend API URL: http://localhost:8000` (should appear on page load)
- Any CORS errors
- Network tab showing the request URL

## Most Common Issue
**Frontend dev server wasn't restarted after creating `.env.local`**

The `.env.local` file was created, but Next.js only reads it when the server starts. You MUST restart the dev server.

## Still Not Working?

1. **Hard refresh browser**: `Ctrl+Shift+R` (Linux/Windows)
2. **Clear browser cache**
3. **Check backend logs** for incoming requests
4. **Verify ports**: 
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`

