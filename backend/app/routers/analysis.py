"""
Router for advanced analysis endpoints.
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.config import ACTUALS_CACHE_FILE, FORECASTS_CACHE_FILE
from app.services.cache import read_cache
from app.services.data_processor import (
    normalize_actuals,
    normalize_forecasts,
    merge_forecast_actual,
)
from app.services.analytics import (
    compute_horizon_analysis,
    compute_hourly_errors,
    compute_error_distribution,
    compute_daily_metrics,
    compute_rolling_accuracy,
)
from app.models.schemas import (
    ForecastVsActualResponse,
    ForecastVsActualRecord,
    HorizonResponse,
    HorizonRecord,
    HourlyErrorsResponse,
    HourlyErrorRecord,
    ErrorDistributionResponse,
    ErrorDistributionStats,
    HistogramBin,
    DailyMetricsResponse,
    DailyMetricRecord,
    RollingAccuracyResponse,
    RollingAccuracyRecord,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


def _load_and_merge():
    """Helper to load cached data, normalize, and merge."""
    actuals_raw = read_cache(ACTUALS_CACHE_FILE)
    forecasts_raw = read_cache(FORECASTS_CACHE_FILE)

    if actuals_raw is None or forecasts_raw is None:
        raise HTTPException(
            status_code=503,
            detail="Data not yet available. Cache may still be loading.",
        )

    actuals_df = normalize_actuals(actuals_raw)
    forecasts_df = normalize_forecasts(forecasts_raw)

    return actuals_df, forecasts_df


@router.get("/forecast-vs-actual", response_model=ForecastVsActualResponse)
async def get_forecast_vs_actual():
    """
    Get merged forecast vs actual time-series.

    For each settlement period, returns the actual generation, the latest
    forecast, and the error (forecast - actual).
    """
    actuals_df, forecasts_df = _load_and_merge()
    merged_df = merge_forecast_actual(actuals_df, forecasts_df)

    if merged_df.empty:
        return ForecastVsActualResponse(count=0, data=[])

    records = []
    for _, row in merged_df.iterrows():
        records.append(ForecastVsActualRecord(
            startTime=row["startTime"].isoformat() if hasattr(row["startTime"], "isoformat") else str(row["startTime"]),
            actual=round(float(row["actual"]), 2),
            forecast=round(float(row["forecast"]), 2),
            error=round(float(row["error"]), 2),
        ))

    return ForecastVsActualResponse(count=len(records), data=records)


@router.get("/horizon", response_model=HorizonResponse)
async def get_horizon_analysis():
    """
    Get RMSE and MAE vs forecast lead time (hours ahead).

    Shows how forecast accuracy degrades as the lead time increases.
    """
    actuals_df, forecasts_df = _load_and_merge()
    results = compute_horizon_analysis(actuals_df, forecasts_df)

    return HorizonResponse(
        data=[HorizonRecord(**r) for r in results]
    )


@router.get("/hourly-errors", response_model=HourlyErrorsResponse)
async def get_hourly_errors():
    """
    Get mean error and RMSE by hour of day.

    Reveals systematic time-of-day biases in the forecasts.
    """
    actuals_df, forecasts_df = _load_and_merge()
    merged_df = merge_forecast_actual(actuals_df, forecasts_df)

    if merged_df.empty:
        return HourlyErrorsResponse(data=[])

    results = compute_hourly_errors(merged_df)

    return HourlyErrorsResponse(
        data=[HourlyErrorRecord(**r) for r in results]
    )


@router.get("/error-distribution", response_model=ErrorDistributionResponse)
async def get_error_distribution():
    """
    Get histogram of forecast errors and distribution statistics.

    Returns bins and stats including mean, std, skewness, and kurtosis.
    """
    actuals_df, forecasts_df = _load_and_merge()
    merged_df = merge_forecast_actual(actuals_df, forecasts_df)

    if merged_df.empty:
        return ErrorDistributionResponse(
            bins=[],
            stats=ErrorDistributionStats(
                mean=0, std=0, skewness=0, kurtosis=0, min=0, max=0, median=0
            ),
        )

    result = compute_error_distribution(merged_df)

    return ErrorDistributionResponse(
        bins=[HistogramBin(**b) for b in result["bins"]],
        stats=ErrorDistributionStats(**result["stats"]),
    )


@router.get("/daily-metrics", response_model=DailyMetricsResponse)
async def get_daily_metrics():
    """
    Get day-by-day MAE, RMSE, and MAPE.

    Shows how forecast accuracy varies across different days.
    """
    actuals_df, forecasts_df = _load_and_merge()
    merged_df = merge_forecast_actual(actuals_df, forecasts_df)

    if merged_df.empty:
        return DailyMetricsResponse(data=[])

    results = compute_daily_metrics(merged_df)

    return DailyMetricsResponse(
        data=[DailyMetricRecord(**r) for r in results]
    )


@router.get("/rolling-accuracy", response_model=RollingAccuracyResponse)
async def get_rolling_accuracy(
    window: int = Query(7, ge=1, le=31, description="Rolling window size in days"),
):
    """
    Get rolling window RMSE over time.

    Shows how forecast accuracy evolves over the period using a sliding window.
    """
    actuals_df, forecasts_df = _load_and_merge()
    merged_df = merge_forecast_actual(actuals_df, forecasts_df)

    if merged_df.empty:
        return RollingAccuracyResponse(window_days=window, data=[])

    result = compute_rolling_accuracy(merged_df, window_days=window)

    return RollingAccuracyResponse(
        window_days=result["window_days"],
        data=[RollingAccuracyRecord(**r) for r in result["data"]],
    )
