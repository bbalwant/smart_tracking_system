# Debugging 401 Unauthorized Error

## Issue
Getting `401 Unauthorized` when creating a package via the frontend.

## Common Causes

### 1. Token Not Being Sent
**Check:**
- Open browser console (F12)
- Go to Network tab
- Try creating a package
- Check the request headers - should see `Authorization: Bearer <token>`

**Fix:**
- Make sure you're logged in
- Check localStorage: `localStorage.getItem('access_token')`
- If null, log out and log back in

### 2. Token Expired
**Check:**
- JWT tokens expire after 24 hours (default)
- Check token expiration in browser console

**Fix:**
- Log out and log back in to get a new token

### 3. JWT Secret Key Mismatch
**Check:**
- Token was created with one secret key
- Backend is using a different secret key

**Fix:**
1. Check `backend/.env` has `JWT_SECRET_KEY` set
2. If you changed it, all existing tokens are invalid
3. Log out and log back in

### 4. Token Format Issue
**Check:**
- Token should start with `eyJ` (base64 encoded JWT header)
- Should be a long string

**Fix:**
- Clear localStorage and log in again

## Quick Fix Steps

1. **Clear and Re-login:**
   ```javascript
   // In browser console:
   localStorage.clear()
   // Then refresh and log in again
   ```

2. **Check Backend .env:**
   ```bash
   cd backend
   cat .env | grep JWT_SECRET_KEY
   ```

3. **Verify Token is Being Sent:**
   - Open browser DevTools (F12)
   - Network tab
   - Create package
   - Check request headers for `Authorization: Bearer ...`

4. **Test with curl:**
   ```bash
   # Get a fresh token by logging in
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   
   # Use the token from response
   curl -X POST http://localhost:8000/api/packages \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{"sender":{"name":"Test","address":"Test","phone":"123"},"recipient":{"name":"Test","address":"Test","phone":"123"},"status":"registered"}'
   ```

## Debugging in Browser Console

```javascript
// Check if token exists
localStorage.getItem('access_token')

// Check token format (should be a long string)
const token = localStorage.getItem('access_token')
console.log('Token length:', token?.length)
console.log('Token preview:', token?.substring(0, 50))

// Test API call manually
fetch('http://localhost:8000/api/packages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  body: JSON.stringify({
    sender: {name: "Test", address: "Test", phone: "123"},
    recipient: {name: "Test", address: "Test", phone: "123"},
    status: "registered"
  })
}).then(r => r.json()).then(console.log).catch(console.error)
```

## Most Likely Solution

**The token in localStorage is expired or invalid. Solution:**

1. Log out from the frontend
2. Log back in to get a fresh token
3. Try creating a package again

If that doesn't work, check the browser console Network tab to see the exact error response from the backend.

