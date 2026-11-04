import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.incidents import router as incidents_router
from app.api.analysis import router as analysis_router
from app.api.rescue import router as rescue_router
from app.api.contacts import router as contacts_router
from app.models.emergency_contact import EmergencyContact, DispatchLog  # noqa: F401
from app.services.seed_data import seed_synthetic_incidents

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("crisislens")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed synthetic scenario data
    logger.info("Initializing CrisisLens database and tables...")
    Base.metadata.create_all(bind=engine)
    
    with SessionLocal() as db:
        seed_synthetic_incidents(db)
    logger.info("CrisisLens initialized with synthetic disaster intelligence data.")
    yield
    logger.info("Shutting down CrisisLens backend.")

app = FastAPI(
    title="CrisisLens - Multimodal Evidence-Aware Disaster Intelligence API",
    description=(
        "CrisisLens organises multi-source disaster reports, analyses heterogeneous evidence, "
        "reconstructs chronological timelines without losing historical submission latency, "
        "and provides decision support powered by Meta Muse Spark."
    ),
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory safely
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include API routes
app.include_router(incidents.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")

@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "CrisisLens API",
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "safety_guardrails_active": True
    }

@app.get("/", tags=["System Health"])
def root():
    return {
        "name": "CrisisLens Disaster Intelligence Platform",
        "description": "Multimodal evidence-aware disaster analysis",
        "documentation": "/docs",
        "health": "/health"
    }
