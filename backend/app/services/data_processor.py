"""
Data processor: merges actuals and forecasts, computes accuracy metrics.
"""
import logging
from typing import List, Dict, Any, Tuple, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def normalize_actuals(raw_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Normalize raw actuals data into a clean DataFrame.

    Expected Elexon FUELHH fields: startTime, settlementPeriod, generation (or similar).
    """
    if not raw_data:
        return pd.DataFrame(columns=["startTime", "generation"])

    df = pd.DataFrame(raw_data)

    # The Elexon FUELHH dataset uses 'startTime' and 'generation'
    # Handle possible column name variations
    col_map = {}
    for col in df.columns:
        col_lower = col.lower()
        if col_lower in ("starttime", "start_time"):
            col_map[col] = "startTime"
        elif col_lower in ("generation", "quantity"):
            col_map[col] = "generation"
        elif col_lower in ("settlementperiod", "settlement_period"):
            col_map[col] = "settlementPeriod"

    if col_map:
        df = df.rename(columns=col_map)

    if "startTime" not in df.columns:
        logger.error(f"Cannot find startTime column. Available columns: {list(df.columns)}")
        return pd.DataFrame(columns=["startTime", "generation"])

    if "generation" not in df.columns:
        logger.error(f"Cannot find generation column. Available columns: {list(df.columns)}")
        return pd.DataFrame(columns=["startTime", "generation"])

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=["startTime", "generation"])
    df = df.sort_values("startTime").reset_index(drop=True)

    logger.info(f"Normalized {len(df)} actual records")
    return df


def normalize_forecasts(raw_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Normalize raw forecast data into a clean DataFrame.

    Expected Elexon WINDFOR fields: startTime, publishTime, generation.
    """
    if not raw_data:
        return pd.DataFrame(columns=["startTime", "publishTime", "generation"])

    df = pd.DataFrame(raw_data)

    # Handle possible column name variations
    col_map = {}
    for col in df.columns:
        col_lower = col.lower()
        if col_lower in ("starttime", "start_time"):
            col_map[col] = "startTime"
        elif col_lower in ("publishtime", "publish_time"):
            col_map[col] = "publishTime"
        elif col_lower in ("generation", "quantity"):
            col_map[col] = "generation"

    if col_map:
        df = df.rename(columns=col_map)

    required_cols = ["startTime", "publishTime", "generation"]
    for col in required_cols:
        if col not in df.columns:
            logger.error(f"Cannot find {col} column. Available columns: {list(df.columns)}")
            return pd.DataFrame(columns=required_cols)

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=required_cols)
    df = df.sort_values(["startTime", "publishTime"]).reset_index(drop=True)

    logger.info(f"Normalized {len(df)} forecast records")
    return df


def get_latest_forecasts(forecasts_df: pd.DataFrame) -> pd.DataFrame:
    """
    For each startTime, select the forecast with the latest publishTime.

    Args:
        forecasts_df: Normalized forecasts DataFrame.

    Returns:
        DataFrame with one row per startTime (the latest forecast).
    """
    if forecasts_df.empty:
        return forecasts_df

    # For each startTime, keep the row with the maximum publishTime
    idx = forecasts_df.groupby("startTime")["publishTime"].idxmax()
    latest = forecasts_df.loc[idx].reset_index(drop=True)
    latest = latest.sort_values("startTime").reset_index(drop=True)

    logger.info(f"Selected {len(latest)} latest forecasts from {len(forecasts_df)} total")
    return latest


def merge_forecast_actual(
    actuals_df: pd.DataFrame,
    forecasts_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Merge actuals with the latest forecast for each startTime.

    For each startTime in actuals, find the latest forecast (most recent publishTime)
    with the same startTime.

    Returns:
        DataFrame with columns: startTime, actual, forecast, error, publishTime
    """
    if actuals_df.empty or forecasts_df.empty:
        return pd.DataFrame(columns=["startTime", "actual", "forecast", "error", "publishTime"])

    # Get latest forecast per startTime
    latest_forecasts = get_latest_forecasts(forecasts_df)

    # Merge on startTime
    merged = pd.merge(
        actuals_df[["startTime", "generation"]].rename(columns={"generation": "actual"}),
        latest_forecasts[["startTime", "generation", "publishTime"]].rename(
            columns={"generation": "forecast"}
        ),
        on="startTime",
        how="inner",
    )

    # Compute error = forecast - actual
    merged["error"] = merged["forecast"] - merged["actual"]
    merged = merged.sort_values("startTime").reset_index(drop=True)

    logger.info(f"Merged {len(merged)} forecast-actual pairs")
    return merged


def compute_metrics(merged_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute overall accuracy metrics from merged forecast-actual data.

    Metrics:
        - MAE: Mean Absolute Error
        - RMSE: Root Mean Square Error
        - MAPE: Mean Absolute Percentage Error (excludes zero actuals)
        - Bias: Mean error (Forecast - Actual)
        - Max Absolute Error
        - Correlation: Pearson correlation coefficient

    Args:
        merged_df: DataFrame with 'actual', 'forecast', 'error' columns.

    Returns:
        Dictionary of metrics.
    """
    if merged_df.empty or len(merged_df) < 2:
        return {
            "mae": 0.0,
            "rmse": 0.0,
            "mape": 0.0,
            "bias": 0.0,
            "max_absolute_error": 0.0,
            "correlation": 0.0,
            "sample_count": len(merged_df),
        }

    actuals = merged_df["actual"].values
    forecasts = merged_df["forecast"].values
    errors = merged_df["error"].values
    abs_errors = np.abs(errors)

    # MAE
    mae = float(np.mean(abs_errors))

    # RMSE
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    # MAPE (exclude zero actuals)
    nonzero_mask = actuals != 0
    if nonzero_mask.any():
        mape = float(np.mean(np.abs(errors[nonzero_mask]) / np.abs(actuals[nonzero_mask])) * 100)
    else:
        mape = 0.0

    # Bias
    bias = float(np.mean(errors))

    # Max Absolute Error
    max_abs_error = float(np.max(abs_errors))

    # Correlation
    if np.std(actuals) > 0 and np.std(forecasts) > 0:
        correlation = float(np.corrcoef(actuals, forecasts)[0, 1])
    else:
        correlation = 0.0

    metrics = {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2),
        "bias": round(bias, 2),
        "max_absolute_error": round(max_abs_error, 2),
        "correlation": round(correlation, 4),
        "sample_count": len(merged_df),
    }

    logger.info(f"Computed metrics: MAE={mae:.2f}, RMSE={rmse:.2f}, MAPE={mape:.2f}%")
    return metrics
