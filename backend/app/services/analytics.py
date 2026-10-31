"""
Advanced analytics: horizon analysis, hourly errors, error distribution, rolling accuracy.
"""
import logging
from typing import List, Dict, Any

import numpy as np
import pandas as pd

try:
    from scipy import stats as scipy_stats
    def calc_skew(arr):
        return float(scipy_stats.skew(arr))
    def calc_kurt(arr):
        return float(scipy_stats.kurtosis(arr))
except ImportError:
    def calc_skew(arr):
        if len(arr) < 3: return 0.0
        m = np.mean(arr)
        s = np.std(arr)
        return float(np.mean(((arr - m) / s) ** 3)) if s > 0 else 0.0
    def calc_kurt(arr):
        if len(arr) < 4: return 0.0
        m = np.mean(arr)
        s = np.std(arr)
        return float(np.mean(((arr - m) / s) ** 4) - 3.0) if s > 0 else 0.0

from app.services.data_processor import (
    normalize_actuals,
    normalize_forecasts,
    merge_forecast_actual,
)

logger = logging.getLogger(__name__)


def compute_horizon_analysis(
    actuals_df: pd.DataFrame,
    forecasts_df: pd.DataFrame,
) -> List[Dict[str, Any]]:
    """
    Compute RMSE and MAE vs forecast lead time (hours ahead).

    The horizon is calculated as the difference between the target startTime
    and the forecast publishTime.

    Returns:
        List of dicts with horizon_hours, rmse, mae, sample_count.
    """
    if actuals_df.empty or forecasts_df.empty:
        return []

    # Merge actuals with ALL forecasts (not just latest) to get horizon info
    actuals_renamed = actuals_df[["startTime", "generation"]].rename(
        columns={"generation": "actual"}
    )
    forecasts_renamed = forecasts_df[["startTime", "publishTime", "generation"]].rename(
        columns={"generation": "forecast"}
    )

    merged = pd.merge(actuals_renamed, forecasts_renamed, on="startTime", how="inner")

    if merged.empty:
        return []

    # Calculate horizon in hours
    merged["horizon_hours"] = (
        merged["startTime"] - merged["publishTime"]
    ).dt.total_seconds() / 3600.0

    # Only keep positive horizons (forecast was made before the target period)
    merged = merged[merged["horizon_hours"] > 0].copy()

    if merged.empty:
        return []

    # Compute error
    merged["error"] = merged["forecast"] - merged["actual"]

    # Bin horizons into integer hours
    merged["horizon_bin"] = merged["horizon_hours"].round().astype(int)

    # Group by horizon bin and compute metrics
    results = []
    grouped = merged.groupby("horizon_bin")
    for horizon, group in sorted(grouped):
        errors = group["error"].values
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mae = float(np.mean(np.abs(errors)))
        results.append({
            "horizon_hours": float(horizon),
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "sample_count": len(group),
        })

    logger.info(f"Computed horizon analysis for {len(results)} horizon bins")
    return results


def compute_hourly_errors(merged_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Compute mean error and RMSE by hour of day.

    Args:
        merged_df: DataFrame with startTime, actual, forecast, error columns.

    Returns:
        List of dicts with hour, mean_error, rmse, sample_count.
    """
    if merged_df.empty:
        return []

    df = merged_df.copy()
    df["hour"] = pd.to_datetime(df["startTime"]).dt.hour

    results = []
    for hour in range(24):
        hour_data = df[df["hour"] == hour]
        if hour_data.empty:
            continue
        errors = hour_data["error"].values
        mean_error = float(np.mean(errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        results.append({
            "hour": hour,
            "mean_error": round(mean_error, 2),
            "rmse": round(rmse, 2),
            "sample_count": len(hour_data),
        })

    logger.info(f"Computed hourly errors for {len(results)} hours")
    return results


def compute_error_distribution(
    merged_df: pd.DataFrame,
    num_bins: int = 50,
) -> Dict[str, Any]:
    """
    Compute histogram of forecast errors and distribution statistics.

    Args:
        merged_df: DataFrame with error column.
        num_bins: Number of histogram bins.

    Returns:
        Dict with 'bins' (list of bin dicts) and 'stats' dict.
    """
    if merged_df.empty:
        return {
            "bins": [],
            "stats": {
                "mean": 0.0,
                "std": 0.0,
                "skewness": 0.0,
                "kurtosis": 0.0,
                "min": 0.0,
                "max": 0.0,
                "median": 0.0,
            },
        }

    errors = merged_df["error"].values

    # Compute histogram
    counts, bin_edges = np.histogram(errors, bins=num_bins)
    bins = []
    for i in range(len(counts)):
        bins.append({
            "bin_start": round(float(bin_edges[i]), 2),
            "bin_end": round(float(bin_edges[i + 1]), 2),
            "count": int(counts[i]),
        })

    # Compute statistics
    stats = {
        "mean": round(float(np.mean(errors)), 2),
        "std": round(float(np.std(errors, ddof=1)) if len(errors) > 1 else 0.0, 2),
        "skewness": round(calc_skew(errors), 4),
        "kurtosis": round(calc_kurt(errors), 4),
        "min": round(float(np.min(errors)), 2),
        "max": round(float(np.max(errors)), 2),
        "median": round(float(np.median(errors)), 2),
    }

    logger.info(f"Computed error distribution: {num_bins} bins, mean={stats['mean']}")
    return {"bins": bins, "stats": stats}


def compute_daily_metrics(merged_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Compute day-by-day MAE, RMSE, MAPE.

    Args:
        merged_df: DataFrame with startTime, actual, forecast, error columns.

    Returns:
        List of dicts with date, mae, rmse, mape, sample_count.
    """
    if merged_df.empty:
        return []

    df = merged_df.copy()
    df["date"] = pd.to_datetime(df["startTime"]).dt.date

    results = []
    for date, group in sorted(df.groupby("date")):
        errors = group["error"].values
        actuals = group["actual"].values
        abs_errors = np.abs(errors)

        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))

        nonzero_mask = actuals != 0
        if nonzero_mask.any():
            mape = float(
                np.mean(np.abs(errors[nonzero_mask]) / np.abs(actuals[nonzero_mask])) * 100
            )
        else:
            mape = 0.0

        results.append({
            "date": str(date),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "sample_count": len(group),
        })

    logger.info(f"Computed daily metrics for {len(results)} days")
    return results


def compute_rolling_accuracy(
    merged_df: pd.DataFrame,
    window_days: int = 7,
) -> Dict[str, Any]:
    """
    Compute rolling window RMSE over the time period.

    Args:
        merged_df: DataFrame with startTime, error columns.
        window_days: Size of the rolling window in days.

    Returns:
        Dict with window_days and data (list of date/rmse records).
    """
    if merged_df.empty:
        return {"window_days": window_days, "data": []}

    df = merged_df.copy()
    df["date"] = pd.to_datetime(df["startTime"]).dt.date
    df["sq_error"] = df["error"] ** 2

    # Compute daily mean squared error
    daily = df.groupby("date").agg(
        mean_sq_error=("sq_error", "mean"),
        sample_count=("sq_error", "count"),
    ).reset_index()

    daily = daily.sort_values("date").reset_index(drop=True)

    if len(daily) < window_days:
        # Not enough days for a rolling window, return what we have
        results = []
        for _, row in daily.iterrows():
            results.append({
                "date": str(row["date"]),
                "rmse": round(float(np.sqrt(row["mean_sq_error"])), 2),
                "sample_count": int(row["sample_count"]),
            })
        return {"window_days": window_days, "data": results}

    # Compute rolling RMSE
    daily["rolling_mse"] = daily["mean_sq_error"].rolling(window=window_days, min_periods=1).mean()
    daily["rolling_count"] = daily["sample_count"].rolling(window=window_days, min_periods=1).sum()

    results = []
    for _, row in daily.iterrows():
        results.append({
            "date": str(row["date"]),
            "rmse": round(float(np.sqrt(row["rolling_mse"])), 2),
            "sample_count": int(row["rolling_count"]),
        })

    logger.info(f"Computed rolling accuracy: window={window_days} days, {len(results)} data points")
    return {"window_days": window_days, "data": results}
