"""
Router for overall accuracy metrics endpoint.
"""
import logging

from fastapi import APIRouter, HTTPException

from app.config import ACTUALS_CACHE_FILE, FORECASTS_CACHE_FILE
from app.services.cache import read_cache
from app.services.data_processor import (
    normalize_actuals,
    normalize_forecasts,
    merge_forecast_actual,
    compute_metrics,
)
from app.models.schemas import MetricsResponse, OverallMetrics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Metrics"])


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """
    Get overall accuracy metrics for forecasts vs actuals.

    Returns MAE, RMSE, MAPE, Bias, Max Absolute Error, and Correlation.
    """
    actuals_raw = read_cache(ACTUALS_CACHE_FILE)
    forecasts_raw = read_cache(FORECASTS_CACHE_FILE)

    if actuals_raw is None or forecasts_raw is None:
        raise HTTPException(
            status_code=503,
            detail="Data not yet available. Cache may still be loading.",
        )

    actuals_df = normalize_actuals(actuals_raw)
    forecasts_df = normalize_forecasts(forecasts_raw)

    if actuals_df.empty or forecasts_df.empty:
        raise HTTPException(
            status_code=404,
            detail="No data available to compute metrics.",
        )

    merged_df = merge_forecast_actual(actuals_df, forecasts_df)

    if merged_df.empty:
        raise HTTPException(
            status_code=404,
            detail="No matching forecast-actual pairs found.",
        )

    metrics_dict = compute_metrics(merged_df)

    return MetricsResponse(
        metrics=OverallMetrics(**metrics_dict)
    )
