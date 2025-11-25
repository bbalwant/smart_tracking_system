# Smart Package / Delivery Tracking System

A real-time package tracking system built with Next.js and FastAPI, enabling customers to track packages, delivery staff to update locations, and managers to monitor delivery performance.

## 🚀 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library
- **Radix UI** - Unstyled, accessible components

### Backend
- **FastAPI 0.116** - High-performance async API framework
- **Python 3.12** - Modern Python runtime
- **MongoDB** - Flexible document database (via Motor)
- **WebSocket** - Real-time communication
- **JWT** - Authentication and authorization

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Cloud database

## 📁 Project Structure

```
Track_order/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── db/                     # Database connection and utilities
│   ├── models/                 # Pydantic models and schemas
│   ├── auth/                   # Authentication module
│   ├── packages/               # Package management module
│   └── tracking/               # Real-time tracking module
├── frontend/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utility functions
│   ├── context/                # React context providers
│   └── package.json            # Node.js dependencies
├── SPRINT_BREAKDOWN.md         # Detailed sprint plan
├── SPRINT_CHECKLIST.md         # Quick reference checklist
└── README.md                   # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** 18.x or higher
- **Python** 3.12 or higher
- **MongoDB Atlas** account (or local MongoDB instance)
- **Git** for version control

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
   JWT_SECRET_KEY=your-secret-key-here-change-in-production
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_HOURS=24
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ENVIRONMENT=development
   PORT=8000
   DATABASE_NAME=track_order
   ```

5. **Run the backend server:**
   ```bash
   python3 main.py
   # Or
   uvicorn main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   NEXT_PUBLIC_MAPS_API_KEY=your-google-maps-api-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## 🧪 Testing

### Backend Testing

Run the test suite:
```bash
cd backend
pytest
```

Run with coverage:
```bash
pytest --cov=. --cov-report=html
```

### Backend Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "service": "operational"
}
```

### Frontend Health Check

Visit `http://localhost:3000` and verify the system status displays correctly.

### Manual Testing Checklist

1. **Authentication Flow:**
   - Register new user
   - Login with credentials
   - Access protected routes
   - Logout functionality

2. **Package Management:**
   - Create package with coordinates
   - View package details
   - List packages with filters
   - Search by tracking ID

3. **Real-Time Tracking:**
   - Update location as delivery staff
   - View real-time updates on map
   - Check route history
   - Verify WebSocket connection

4. **ETA & Status:**
   - Verify ETA calculation
   - Check status auto-transitions
   - Manual status updates
   - ETA countdown timer

## 📦 Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `DATABASE_NAME` | Database name | Yes |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Yes |
| `JWT_ALGORITHM` | JWT algorithm (default: HS256) | No |
| `JWT_EXPIRATION_HOURS` | Token expiration time | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | Yes |
| `ENVIRONMENT` | Environment (development/production) | No |
| `PORT` | Server port (default: 8000) | No |

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | Yes |
| `NEXT_PUBLIC_MAPS_API_KEY` | Google Maps API key | Yes (for Sprint 3) |

## 🚢 Deployment

### Backend (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

## 📋 Sprint Progress

- [x] **Sprint 0:** Groundwork & Scaffolding ✅
- [x] **Sprint 1:** Core User Identity & Authentication ✅
- [x] **Sprint 2:** Package Management & Lookup ✅
- [x] **Sprint 3:** Real-Time Tracking & Route History ✅
- [x] **Sprint 4:** ETA & Status Enhancements ✅
- [x] **Sprint 5:** Testing, Polish & MVP Completion ✅

See [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) for detailed sprint plans.

## 🎯 MVP Features

- ✅ Package registration and lookup by tracking ID
- ✅ Real-time location updates via WebSocket
- ✅ Route history visualization
- ✅ Rule-based ETA display
- ✅ Status updates (Registered → In Transit → Delivered)
- ✅ Role-based access (Customer, Delivery Staff, Manager)

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

#### Packages
- `POST /api/packages` - Create package (authenticated)
- `GET /api/packages` - List packages (authenticated)
- `GET /api/packages/{tracking_id}` - Get package by tracking ID
- `PUT /api/packages/{tracking_id}` - Update package (manager/delivery_staff)
- `PUT /api/packages/{tracking_id}/status` - Update package status
- `DELETE /api/packages/{tracking_id}` - Delete package (manager only)

#### Tracking
- `POST /api/tracking/{tracking_id}/update` - Update location (delivery_staff)
- `GET /api/tracking/{tracking_id}/history` - Get route history
- `GET /api/tracking/{tracking_id}/eta` - Get ETA
- `WS /api/tracking/ws/{tracking_id}` - WebSocket for real-time updates

## 🤝 Contributing

This project follows a sprint-based development approach. See [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) for detailed task breakdowns.

## 📄 License

This project is part of an MVP development process.

## 🗑️ Database Management

### Clear All Data

To clear all users, packages, and tracking data from the database:

**Option 1: Using the script (Recommended)**
```bash
./clear_db.sh
```

**Option 2: Manual Python script**
```bash
cd backend
python3 clear_database.py
```

**Option 3: Direct MongoDB command**
```bash
mongosh
use track_order
db.users.deleteMany({})
db.packages.deleteMany({})
db.location_updates.deleteMany({})
db.predictions.deleteMany({})
```

⚠️ **Warning:** This will permanently delete all data. Make sure to backup if needed.

## 🆘 Troubleshooting

### Backend Issues

- **MongoDB Connection Error:** Verify `MONGODB_URI` is correct and network allows connections
- **Port Already in Use:** Change `PORT` in `.env` or kill the process using port 8000
- **Module Not Found:** Ensure virtual environment is activated and dependencies are installed

### Frontend Issues

- **API Connection Error:** Verify `NEXT_PUBLIC_API_URL` matches backend URL
- **Build Errors:** Clear `.next` directory and reinstall dependencies
- **TypeScript Errors:** Run `npm run lint` to identify issues

## 📞 Support

For issues or questions, refer to the sprint documentation or check the API health endpoint.

## 🎥 Demo Video

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a complete demo video script and recording guide.

---

**Last Updated:** Sprint 5 Complete - MVP Ready  
**Status:** Production Ready

