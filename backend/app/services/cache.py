"""
File-based JSON cache for storing fetched data.
"""
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.config import CACHE_DIR, ACTUALS_CACHE_FILE, FORECASTS_CACHE_FILE

logger = logging.getLogger(__name__)


def _get_cache_path(filename: str) -> Path:
    """Get the full path for a cache file."""
    return CACHE_DIR / filename


def has_cache(filename: str) -> bool:
    """Check if a cache file exists and is non-empty."""
    path = _get_cache_path(filename)
    return path.exists() and path.stat().st_size > 0


def read_cache(filename: str) -> Optional[List[Dict[str, Any]]]:
    """
    Read data from a cache file.

    Args:
        filename: Name of the cache file.

    Returns:
        The cached data or None if not found.
    """
    path = _get_cache_path(filename)
    if not path.exists():
        logger.info(f"Cache file not found: {path}")
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        logger.info(f"Loaded {len(data)} records from cache: {filename}")
        return data
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error reading cache file {filename}: {e}")
        return None


def write_cache(filename: str, data: List[Dict[str, Any]]) -> bool:
    """
    Write data to a cache file.

    Args:
        filename: Name of the cache file.
        data: Data to cache.

    Returns:
        True if successful, False otherwise.
    """
    path = _get_cache_path(filename)
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, default=str)
        logger.info(f"Wrote {len(data)} records to cache: {filename}")
        return True
    except IOError as e:
        logger.error(f"Error writing cache file {filename}: {e}")
        return False


def get_cache_status() -> Dict[str, Any]:
    """
    Get the status of all cache files.

    Returns:
        Dictionary with cache file statuses.
    """
    status = {}
    for filename in [ACTUALS_CACHE_FILE, FORECASTS_CACHE_FILE]:
        path = _get_cache_path(filename)
        if path.exists():
            size = path.stat().st_size
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                record_count = len(data) if isinstance(data, list) else 0
            except Exception:
                record_count = 0
            status[filename] = {
                "exists": True,
                "size_bytes": size,
                "record_count": record_count,
            }
        else:
            status[filename] = {
                "exists": False,
                "size_bytes": 0,
                "record_count": 0,
            }
    return status
