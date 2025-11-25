# User Guide - Smart Package Tracking System

## Table of Contents
1. [Getting Started](#getting-started)
2. [For Customers](#for-customers)
3. [For Delivery Staff](#for-delivery-staff)
4. [For Managers](#for-managers)
5. [Troubleshooting](#troubleshooting)

## Getting Started

### Creating an Account

1. Navigate to the registration page
2. Fill in your details:
   - **Name:** Your full name
   - **Email:** Your email address
   - **Password:** Choose a strong password
   - **Role:** Select your role (Customer, Delivery Staff, or Manager)
3. Click "Register"
4. You'll be automatically logged in after registration

### Logging In

1. Go to the login page
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to your dashboard

## For Customers

### Creating a Package

1. Log in to your account
2. Navigate to "Packages" → "Create New Package"
3. Fill in the package details:

   **Sender Information:**
   - Name
   - Address
   - Phone number
   - **Latitude and Longitude** (required for tracking)

   **Recipient Information:**
   - Name
   - Address
   - Phone number
   - **Latitude and Longitude** (required for tracking)

4. Click "Create Package"
5. You'll receive a tracking ID (format: `TRK-XXXXXXXX`)

### Tracking Your Package

1. Go to "Packages" in the navigation
2. Click on a package to view details
3. You'll see:
   - **Package Status:** Registered → In Transit → Delivered
   - **ETA:** Estimated time of arrival with countdown
   - **Map:** Real-time location and route visualization
   - **Route History:** All location updates

### Finding a Package by Tracking ID

1. On the Packages page, use the search bar
2. Enter the tracking ID (e.g., `TRK-XXXXXXXX`)
3. Press Enter or click "Search"
4. You'll be taken to the package details page

## For Delivery Staff

### Updating Package Location

1. Log in as delivery staff
2. Go to "Delivery" page
3. Select a package from the dropdown (only shows "registered" or "in_transit" packages)
4. Update location using one of these methods:

   **Method 1: Manual Entry**
   - Enter latitude and longitude
   - Click "Update Location"

   **Method 2: Get Current Location**
   - Click "Get Current Location"
   - Browser will request location permission
   - Click "Update Location" after coordinates are filled

   **Method 3: Live Tracking**
   - Click "Start Live Tracking"
   - Your location will update automatically every 10 seconds
   - Click "Stop Live Tracking" when done

### Understanding Status Transitions

- **Registered:** Package is created and ready for pickup
- **In Transit:** Package is being delivered (auto-updates when >500m from sender)
- **Delivered:** Package has arrived (auto-updates when <100m from recipient)

## For Managers

### Managing Packages

1. Log in as manager
2. Access all packages from "Packages" page
3. View package details, status, and tracking information
4. Manually update package status if needed:
   - Go to package details
   - Use status update endpoint (via API or UI)

### Monitoring Deliveries

- View all packages regardless of owner
- Filter by status (Registered, In Transit, Delivered)
- Monitor ETA accuracy
- Track delivery performance

## Features Explained

### Real-Time Tracking

- Location updates appear on the map within 2 seconds
- WebSocket connection shows connection status
- Route history displays all past locations

### ETA Calculation

- Based on distance and average speed (30 km/h)
- Recalculates automatically on each location update
- Shows countdown timer
- Displays formatted time (hours and minutes)

### Status Badges

- **Blue (Registered):** Package is registered
- **Yellow (In Transit):** Package is being delivered
- **Green (Delivered):** Package has been delivered

### Map Features

- **Blue 'S' Marker:** Sender location
- **Green 'R' Marker:** Recipient location
- **Red 'C' Marker:** Current delivery location (animated)
- **Grey Dots:** Route history points
- **Blue Line:** Actual route taken
- **Red Line:** Remaining path to destination
- **Grey Dashed Line:** Base route (sender to recipient)

## Troubleshooting

### Can't Connect to Backend

- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Restart both frontend and backend servers

### Location Not Updating

- Check browser location permissions
- Ensure GPS/location services are enabled
- Verify WebSocket connection status
- Check browser console for errors

### ETA Not Showing

- Ensure package has location updates
- Verify recipient coordinates are set
- Check that package status is not "delivered"
- Refresh the page

### Can't See Packages

- Verify you're logged in
- Check your user role permissions
- Ensure packages exist in the system
- Try clearing browser cache

### WebSocket Disconnected

- Check internet connection
- Refresh the page
- Verify backend WebSocket endpoint is accessible
- Check browser console for connection errors

## Tips

1. **For Accurate Tracking:** Always provide valid latitude and longitude coordinates when creating packages
2. **For Best Performance:** Use "Live Tracking" mode for continuous location updates
3. **For Quick Access:** Save tracking IDs for frequently tracked packages
4. **For Managers:** Use status filters to quickly find packages by status

## Support

For technical issues or questions:
- Check the API documentation at `/docs` endpoint
- Review the README.md for setup instructions
- Check browser console for error messages
- Verify all environment variables are set correctly

---

**Last Updated:** Sprint 5 Complete  
**Version:** 1.0.0

