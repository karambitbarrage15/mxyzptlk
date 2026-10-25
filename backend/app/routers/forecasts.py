"""
Router for wind power forecast endpoints.
"""
import logging
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.config import FORECASTS_CACHE_FILE
from app.services.cache import read_cache
from app.services.data_processor import normalize_forecasts, get_latest_forecasts
from app.models.schemas import (
    ForecastsResponse,
    ForecastRecord,
    LatestForecastsResponse,
    LatestForecastRecord,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Forecasts"])


@router.get("/forecasts", response_model=ForecastsResponse)
async def get_forecasts(
    from_date: Optional[str] = Query(None, alias="from_date", description="Start date (ISO 8601)"),
    to_date: Optional[str] = Query(None, alias="to_date", description="End date (ISO 8601)"),
):
    """
    Get wind power forecast data.

    Returns all forecast records for the cached period (January 2026).
    Optionally filter by date range within the cached data.
    """
    raw_data = read_cache(FORECASTS_CACHE_FILE)
    if raw_data is None:
        raise HTTPException(
            status_code=503,
            detail="Forecasts data not yet available. Cache may still be loading.",
        )

    df = normalize_forecasts(raw_data)

    if df.empty:
        return ForecastsResponse(count=0, data=[])

    # Apply date filtering on startTime if provided
    if from_date:
        try:
            from_dt = pd.to_datetime(from_date, utc=True)
            df = df[df["startTime"] >= from_dt]
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid from_date: {from_date}")

    if to_date:
        try:
            to_dt = pd.to_datetime(to_date, utc=True)
            df = df[df["startTime"] < to_dt]
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid to_date: {to_date}")

    records = []
    for _, row in df.iterrows():
        record = ForecastRecord(
            startTime=row["startTime"].isoformat(),
            publishTime=row["publishTime"].isoformat(),
            generation=round(float(row["generation"]), 2),
        )
        records.append(record)

    return ForecastsResponse(count=len(records), data=records)


@router.get("/forecasts/latest", response_model=LatestForecastsResponse)
async def get_latest_forecasts_endpoint():
    """
    Get the latest available forecast for each upcoming settlement period.

    For each startTime, returns the forecast with the most recent publishTime.
    """
    raw_data = read_cache(FORECASTS_CACHE_FILE)
    if raw_data is None:
        raise HTTPException(
            status_code=503,
            detail="Forecasts data not yet available. Cache may still be loading.",
        )

    df = normalize_forecasts(raw_data)

    if df.empty:
        return LatestForecastsResponse(count=0, data=[])

    latest_df = get_latest_forecasts(df)

    records = []
    for _, row in latest_df.iterrows():
        record = LatestForecastRecord(
            startTime=row["startTime"].isoformat(),
            publishTime=row["publishTime"].isoformat(),
            generation=round(float(row["generation"]), 2),
        )
        records.append(record)

    return LatestForecastsResponse(count=len(records), data=records)
