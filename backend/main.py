"""
FastAPI application entry point
Smart Package / Delivery Tracking System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from db.connection import connect_to_mongo, close_mongo_connection
from auth.register import router as register_router
from auth.login import router as login_router
from auth.me import router as me_router
from packages.routes import router as packages_router
from tracking.routes import router as tracking_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    print("✅ Connected to MongoDB")
    yield
    # Shutdown
    await close_mongo_connection()
    print("✅ Disconnected from MongoDB")

# Initialize FastAPI app
app = FastAPI(
    title="Smart Package Tracking API",
    description="Real-time package tracking system API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(register_router)
app.include_router(login_router)
app.include_router(me_router)
app.include_router(packages_router)
app.include_router(tracking_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Smart Package Tracking API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        from db.connection import get_database
        db = get_database()
        # Test database connection
        await db.command("ping")
        return {
            "status": "ok",
            "database": "connected",
            "service": "operational"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

