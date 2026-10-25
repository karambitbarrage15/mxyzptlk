"""
Router for wind power actuals endpoints.
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.config import ACTUALS_CACHE_FILE, DEFAULT_FROM_DATE, DEFAULT_TO_DATE
from app.services.cache import read_cache, has_cache
from app.services.data_processor import normalize_actuals
from app.models.schemas import ActualsResponse, ActualRecord

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Actuals"])


@router.get("/actuals", response_model=ActualsResponse)
async def get_actuals(
    from_date: Optional[str] = Query(None, alias="from_date", description="Start date (ISO 8601)"),
    to_date: Optional[str] = Query(None, alias="to_date", description="End date (ISO 8601)"),
):
    """
    Get wind power actual generation data.

    Returns half-hourly actual wind generation for the cached period (January 2026).
    Optionally filter by date range within the cached data.
    """
    raw_data = read_cache(ACTUALS_CACHE_FILE)
    if raw_data is None:
        raise HTTPException(
            status_code=503,
            detail="Actuals data not yet available. Cache may still be loading.",
        )

    df = normalize_actuals(raw_data)

    if df.empty:
        return ActualsResponse(count=0, data=[])

    # Apply date filtering if provided
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
        record = ActualRecord(
            startTime=row["startTime"].isoformat(),
            settlementPeriod=int(row["settlementPeriod"]) if "settlementPeriod" in row.index and pd.notna(row.get("settlementPeriod")) else None,
            generation=round(float(row["generation"]), 2),
        )
        records.append(record)

    return ActualsResponse(count=len(records), data=records)


# Need pandas for date filtering
import pandas as pd
