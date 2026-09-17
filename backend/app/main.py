import sys
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.core.config import settings, UPLOADS_DIR, SAMPLE_IMAGES_DIR
from app.routers import auth, profile, notifications, screening, doctors, appointments, chat, reports, trends, admin, abdm

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Netra AI - Advanced AI-Powered Eye-Health Screening & Care-Navigation Platform"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts for uploads and sample retinal scans
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/sample_images", StaticFiles(directory=str(SAMPLE_IMAGES_DIR)), name="sample_images")

# Health Check Endpoints (for Cloud Orchestrators, Docker, Render, Kubernetes)
@app.get("/health")
@app.get("/api/health")
def health_check():
    from app.core.database import db
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {
            "status": "connected",
            "users_count": len(db.data.get("users", [])),
            "screenings_count": len(db.data.get("screenings", [])),
            "appointments_count": len(db.data.get("appointments", []))
        }
    }

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(screening.router, prefix=settings.API_V1_STR)
app.include_router(doctors.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(trends.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(abdm.router, prefix=settings.API_V1_STR)

# Production Unified Single-Page Application (SPA) Serving
# If frontend build output (dist/) is present, serve it directly to eliminate CORS in production
dist_assets_dir = settings.FRONTEND_DIST_DIR / "assets"
if dist_assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_assets_dir)), name="frontend_assets")

@app.get("/{full_path:path}")
async def serve_spa_or_root(full_path: str):
    # If the request points to a static file in frontend/dist (e.g. logo, favicon, manifest)
    if settings.FRONTEND_DIST_DIR.exists():
        candidate_file = settings.FRONTEND_DIST_DIR / full_path
        if full_path and candidate_file.is_file():
            return FileResponse(str(candidate_file))
        
        index_file = settings.FRONTEND_DIST_DIR / "index.html"
        if index_file.is_file():
            return FileResponse(str(index_file))

    # Fallback to API status JSON if dist has not been built
    return JSONResponse({
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "message": "Welcome to Netra AI API. Frontend dist not built or running in decoupled development mode."
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=settings.RELOAD, 
        app_dir=str(BACKEND_DIR)
    )

