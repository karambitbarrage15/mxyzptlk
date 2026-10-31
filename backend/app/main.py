"""
FastAPI application entry point for the WindSight backend.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
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
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

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


@app.middleware("http")
async def vercel_path_fix(request: Request, call_next):
    """
    Middleware to restore original request path from Vercel's x-matched-path header.
    When Vercel uses rewrite rules to route requests to FastAPI, this header
    preserves the exact URL path requested by the client.
    """
    matched_path = request.headers.get("x-matched-path")
    if matched_path and not matched_path.endswith((".py", ".js")):
        clean_path = matched_path.split("?")[0]
        request.scope["path"] = clean_path
        request.scope["raw_path"] = clean_path.encode("utf-8")
    return await call_next(request)


@app.get("/debug", include_in_schema=False)
async def debug_endpoint(request: Request):
    return {
        "url_path": request.url.path,
        "scope_path": request.scope.get("path"),
        "headers": {k: v for k, v in request.headers.items() if "auth" not in k.lower() and "cookie" not in k.lower()},
        "static_dir": str(STATIC_DIR),
        "static_dir_exists": STATIC_DIR.exists(),
    }

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


# Static file serving for React SPA
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if not STATIC_DIR.exists():
    STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if STATIC_DIR.exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/plotly.min.js", include_in_schema=False)
    async def serve_plotly():
        plotly_path = STATIC_DIR / "plotly.min.js"
        if plotly_path.exists():
            return FileResponse(str(plotly_path), media_type="application/javascript")
        return FileResponse(str(STATIC_DIR / "index.html"))

    @app.get("/favicon.ico", include_in_schema=False)
    @app.get("/favicon.png", include_in_schema=False)
    async def serve_favicon():
        ico = STATIC_DIR / "favicon.ico"
        if ico.exists():
            return FileResponse(str(ico))
        return FileResponse(str(STATIC_DIR / "index.html"))


@app.get("/", include_in_schema=False)
async def serve_root():
    if STATIC_DIR.exists():
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
    return {
        "status": "ok",
        "service": "WindSight API",
        "version": APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    if STATIC_DIR.exists():
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Not Found")


