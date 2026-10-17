"""DabbaIQ FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.connection import connect_db, disconnect_db
from app.db.tiger_data import connect_tiger_db, disconnect_tiger_db
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle for MongoDB and Tiger Data."""
    logger.info("Starting DabbaIQ v%s", settings.APP_VERSION)
    connected = await connect_db()
    if connected:
        logger.info("MongoDB connected successfully")
        try:
            from app.db.seed import auto_seed_if_empty
            await auto_seed_if_empty()
        except Exception as e:
            logger.warning("Auto-seed error on startup: %s", e)
    else:
        logger.warning(
            "Running without MongoDB. Set MONGODB_URI in backend/.env to enable storage."
        )

    # Initialize Tiger Data if configured
    if settings.tiger_data_available:
        tiger_ok = await connect_tiger_db()
        if tiger_ok:
            logger.info("Tiger Data hypertable ready for price snapshots")
        else:
            logger.warning("Tiger Data configured but connection failed")

    yield

    await disconnect_db()
    await disconnect_tiger_db()
    logger.info("DabbaIQ shut down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Kitchen Prep & Food-Waste Planner for Indian tiffin businesses",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=settings.CORS_EXPOSE_HEADERS,
    max_age=settings.CORS_MAX_AGE,
)

# Mount API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tagline": "Cook the right amount. Waste less. Earn more.",
        "api_docs": "/docs",
    }
