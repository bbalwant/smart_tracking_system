# Fix: Cannot Connect to Backend

## 🔴 Current Issue
Frontend cannot connect to backend at `http://localhost:8000`

## ✅ What I've Fixed

1. **Updated `next.config.js`** - Explicitly sets `NEXT_PUBLIC_API_URL`
2. **Improved API URL handling** - Better fallback and debugging
3. **Created test API route** - `/api/test-connection` to test from server-side
4. **Enhanced error logging** - More detailed error information

## 🚀 REQUIRED ACTIONS

### Step 1: Restart Frontend Dev Server (CRITICAL)

**You MUST do this:**

```bash
# 1. Stop the current server (Ctrl+C)
# 2. Clear Next.js cache
cd /home/balwants/Desktop/Projects/Track_order/frontend
rm -rf .next

# 3. Restart the server
npm run dev
```

**Why?** 
- `.env.local` is only loaded when server starts
- `next.config.js` changes require restart
- Clearing `.next` ensures fresh build

### Step 2: Hard Refresh Browser

After restarting:
1. Open browser
2. Press `Ctrl+Shift+R` (hard refresh)
3. Or clear browser cache

### Step 3: Verify Connection

**Option A: Test API Route**
Visit: `http://localhost:3000/api/test-connection`

This will test the backend connection from Next.js server-side.

**Option B: Browser Console**
Open DevTools (F12) and run:

```javascript
// Check API URL
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

// Test connection
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Backend is reachable!', data);
  })
  .catch(err => {
    console.error('❌ Cannot reach backend:', err);
    console.error('Error details:', {
      message: err.message,
      type: err.constructor.name,
      stack: err.stack
    });
  });
```

## 🔍 What to Check

### In Browser Console (F12):
1. Look for: `🔗 Backend API URL: http://localhost:8000`
2. If you see `undefined` or wrong URL → `.env.local` not loaded
3. Check Network tab for failed requests

### Backend Terminal:
- Should show incoming requests when you try to login/register
- If no requests appear → frontend isn't reaching backend

## 🎯 Expected Behavior After Fix

1. Browser console shows: `🔗 Backend API URL: http://localhost:8000`
2. Login/Register requests appear in backend terminal
3. Network tab shows successful requests (even if 401 for wrong credentials)

## 📝 Quick Checklist

- [ ] Stopped frontend dev server
- [ ] Deleted `.next` directory
- [ ] Restarted frontend dev server
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Checked browser console for API URL
- [ ] Tested connection in browser console

## 🆘 If Still Not Working

Share:
1. Browser console output (especially the API URL log)
2. Network tab screenshot showing the failed request
3. Backend terminal output (any requests received?)
4. Output from: `http://localhost:3000/api/test-connection`

