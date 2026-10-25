"""
Async HTTP client for fetching data from the Elexon BMRS API.
"""
import httpx
import logging
from typing import List, Dict, Any

from app.config import (
    ACTUALS_ENDPOINT,
    FORECASTS_ENDPOINT,
    DEFAULT_FROM_DATE,
    DEFAULT_TO_DATE,
    DEFAULT_SETTLEMENT_DATE_FROM,
    DEFAULT_SETTLEMENT_DATE_TO,
    HTTP_TIMEOUT,
    HTTP_MAX_RETRIES,
)

logger = logging.getLogger(__name__)


async def fetch_actuals(
    settlement_date_from: str = DEFAULT_SETTLEMENT_DATE_FROM,
    settlement_date_to: str = DEFAULT_SETTLEMENT_DATE_TO,
) -> List[Dict[str, Any]]:
    """
    Fetch wind power actuals from the Elexon BMRS FUELHH dataset.

    Args:
        settlement_date_from: Start date in YYYY-MM-DD format.
        settlement_date_to: End date in YYYY-MM-DD format.

    Returns:
        List of actual generation records for WIND.
    """
    params = {
        "settlementDateFrom": settlement_date_from,
        "settlementDateTo": settlement_date_to,
    }

    logger.info(f"Fetching actuals from Elexon: {settlement_date_from} to {settlement_date_to}")

    for attempt in range(1, HTTP_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                response = await client.get(ACTUALS_ENDPOINT, params=params)
                response.raise_for_status()
                data = response.json()
                if isinstance(data, list):
                    # Filter for fuelType == 'WIND'
                    wind_records = [x for x in data if x.get("fuelType") == "WIND"]
                    logger.info(f"Fetched {len(data)} total records, filtered to {len(wind_records)} WIND records")
                    return wind_records
                return []
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error fetching actuals (attempt {attempt}/{HTTP_MAX_RETRIES}): "
                f"{e.response.status_code} - {e.response.text[:200]}"
            )
            if attempt == HTTP_MAX_RETRIES:
                raise
        except httpx.RequestError as e:
            logger.error(
                f"Request error fetching actuals (attempt {attempt}/{HTTP_MAX_RETRIES}): {e}"
            )
            if attempt == HTTP_MAX_RETRIES:
                raise
        except Exception as e:
            logger.error(
                f"Unexpected error fetching actuals (attempt {attempt}/{HTTP_MAX_RETRIES}): {e}"
            )
            if attempt == HTTP_MAX_RETRIES:
                raise

    return []


async def fetch_forecasts(
    publish_time_from: str = "2025-12-31T00:00:00Z",
    publish_time_to: str = "2026-02-01T00:00:00Z",
) -> List[Dict[str, Any]]:
    """
    Fetch wind power forecasts from the Elexon BMRS WINDFOR dataset.

    Args:
        publish_time_from: Start publish time in ISO 8601.
        publish_time_to: End publish time in ISO 8601.

    Returns:
        List of forecast records.
    """
    params = {
        "publishDateTimeFrom": publish_time_from,
        "publishDateTimeTo": publish_time_to,
    }

    logger.info(f"Fetching forecasts from Elexon: {publish_time_from} to {publish_time_to}")

    for attempt in range(1, HTTP_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                response = await client.get(FORECASTS_ENDPOINT, params=params)
                response.raise_for_status()
                data = response.json()
                if isinstance(data, list):
                    logger.info(f"Fetched {len(data)} forecast records from Elexon")
                    return data
                return []
        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error fetching forecasts (attempt {attempt}/{HTTP_MAX_RETRIES}): "
                f"{e.response.status_code} - {e.response.text[:200]}"
            )
            if attempt == HTTP_MAX_RETRIES:
                raise
        except httpx.RequestError as e:
            logger.error(
                f"Request error fetching forecasts (attempt {attempt}/{HTTP_MAX_RETRIES}): {e}"
            )
            if attempt == HTTP_MAX_RETRIES:
                raise
        except Exception as e:
            logger.error(
                f"Unexpected error fetching forecasts (attempt {attempt}/{HTTP_MAX_RETRIES}): {e}"
            )
            if attempt == HTTP_MAX_RETRIES:
                raise

    return []
