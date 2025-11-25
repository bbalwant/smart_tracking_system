# Debug: Cannot Connect to Backend

## ✅ Backend Status
- Backend is running on port 8000
- Health endpoint works: `curl http://localhost:8000/health` ✅
- CORS is configured correctly ✅

## 🔍 Debug Steps

### Step 1: Test Connection in Browser Console

Open your browser console (F12) and run:

```javascript
// Test 1: Simple health check
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend is reachable:', data))
  .catch(err => {
    console.error('❌ Cannot reach backend');
    console.error('Error:', err);
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
  })

// Test 2: Check API URL
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

// Test 3: Full connection test (if available)
if (window.testBackendConnection) {
  window.testBackendConnection()
}
```

### Step 2: Check What You See

**If you see `✅ Backend is reachable`:**
- The connection works from browser
- The issue is in the frontend code
- Check the Network tab for the actual request

**If you see `❌ Cannot reach backend`:**
- Browser can't connect to backend
- Possible causes:
  1. Firewall blocking localhost
  2. Browser extension blocking requests
  3. Network security policy
  4. Backend actually not running (unlikely, but check)

### Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try to login/register
4. Look for the request to `/api/auth/login` or `/api/auth/register`
5. Check:
   - Request URL (should be `http://localhost:8000/api/auth/...`)
   - Status code
   - Error message
   - Request headers

### Step 4: Verify Environment Variable

In browser console:
```javascript
// This should show the API URL
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
```

If it shows `undefined`, the `.env.local` file isn't loaded. **You MUST restart the frontend dev server.**

## 🔧 Most Common Fix

**Restart Frontend Dev Server:**

```bash
# 1. Stop current server (Ctrl+C)
# 2. Start again:
cd /home/balwants/Desktop/Projects/Track_order/frontend
npm run dev
```

**Why?** Next.js only loads `.env.local` when the server starts.

## 🧪 Alternative: Test Page

Visit: `http://localhost:3000/test-backend.html`

This will test the backend connection directly from the browser.

## 📋 Checklist

- [ ] Backend is running (`python3 main.py` in backend directory)
- [ ] Frontend dev server restarted after creating `.env.local`
- [ ] `.env.local` exists in `frontend/` directory
- [ ] `.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [ ] Browser console shows `🔗 Backend API URL: http://localhost:8000`
- [ ] Test connection in browser console works

## 🆘 Still Not Working?

Share the output from:
1. Browser console test (Step 1)
2. Network tab screenshot/error
3. Backend terminal output (any errors?)

