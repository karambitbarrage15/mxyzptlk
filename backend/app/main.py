"""
FastAPI application entry point for the WindSight backend.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    APP_TITLE,
    APP_DESCRIPTION,
    APP_VERSION,
    ACTUALS_CACHE_FILE,
    FORECASTS_CACHE_FILE,
)
from app.services.cache import has_cache, write_cache, read_cache, get_cache_status
from app.services.elexon_client import fetch_actuals, fetch_forecasts
from app.routers import actuals, forecasts, metrics, analysis
from app.models.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    On startup: fetch and cache actuals and forecasts if not already cached.
    """
    logger.info("WindSight backend starting up...")

    # Fetch and cache actuals if not already cached
    if not has_cache(ACTUALS_CACHE_FILE):
        logger.info("Actuals cache not found. Fetching from Elexon...")
        try:
            actuals_data = await fetch_actuals()
            if actuals_data:
                write_cache(ACTUALS_CACHE_FILE, actuals_data)
                logger.info(f"Cached {len(actuals_data)} actual records")
            else:
                logger.warning("No actuals data received from Elexon")
        except Exception as e:
            logger.error(f"Failed to fetch actuals on startup: {e}")
    else:
        logger.info("Actuals cache already exists, skipping fetch")

    # Fetch and cache forecasts if not already cached
    if not has_cache(FORECASTS_CACHE_FILE):
        logger.info("Forecasts cache not found. Fetching from Elexon...")
        try:
            forecasts_data = await fetch_forecasts()
            if forecasts_data:
                write_cache(FORECASTS_CACHE_FILE, forecasts_data)
                logger.info(f"Cached {len(forecasts_data)} forecast records")
            else:
                logger.warning("No forecasts data received from Elexon")
        except Exception as e:
            logger.error(f"Failed to fetch forecasts on startup: {e}")
    else:
        logger.info("Forecasts cache already exists, skipping fetch")

    logger.info("WindSight backend startup complete")
    yield
    logger.info("WindSight backend shutting down...")


# Create FastAPI application
app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

# Add CORS middleware - allow all origins for frontend on different domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(actuals.router)
app.include_router(forecasts.router)
app.include_router(metrics.router)
app.include_router(analysis.router)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.

    Returns the application status, version, and cache status.
    """
    cache_status = get_cache_status()
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        cache_status=cache_status,
    )
