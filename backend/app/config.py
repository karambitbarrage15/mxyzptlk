"""
Application configuration and settings.
"""
import os
from pathlib import Path


# Base directory for the application
BASE_DIR = Path(__file__).resolve().parent.parent

# Cache directory for storing fetched data
CACHE_DIR = BASE_DIR / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Cache file names
ACTUALS_CACHE_FILE = "actuals_jan2026.json"
FORECASTS_CACHE_FILE = "forecasts_jan2026.json"

# Elexon BMRS API base URL
ELEXON_BASE_URL = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")

# Default date range for January 2026
DEFAULT_FROM_DATE = "2026-01-01T00:00:00Z"
DEFAULT_TO_DATE = "2026-02-01T00:00:00Z"
DEFAULT_SETTLEMENT_DATE_FROM = "2026-01-01"
DEFAULT_SETTLEMENT_DATE_TO = "2026-01-31"

# Elexon API endpoints
ACTUALS_ENDPOINT = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
FORECASTS_ENDPOINT = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

# HTTP client settings
HTTP_TIMEOUT = 120.0  # seconds
HTTP_MAX_RETRIES = 3

# API settings
API_PREFIX = "/api"
APP_TITLE = "WindSight - UK Wind Power Forecast Analytics"
APP_DESCRIPTION = "Backend API for the WindSight UK Wind Power Forecast Analytics Platform"
APP_VERSION = "1.0.0"
