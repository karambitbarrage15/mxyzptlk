"""
Pydantic response models for the WindSight API.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# --- Actuals ---

class ActualRecord(BaseModel):
    """A single wind power actual measurement."""
    startTime: str = Field(..., description="Start of the settlement period (ISO 8601)")
    settlementPeriod: Optional[int] = Field(None, description="Settlement period number")
    generation: float = Field(..., description="Actual wind generation in MW")


class ActualsResponse(BaseModel):
    """Response for the actuals endpoint."""
    count: int = Field(..., description="Number of records returned")
    data: List[ActualRecord]


# --- Forecasts ---

class ForecastRecord(BaseModel):
    """A single wind power forecast record."""
    startTime: str = Field(..., description="Target settlement period start (ISO 8601)")
    publishTime: str = Field(..., description="Time the forecast was published (ISO 8601)")
    generation: float = Field(..., description="Forecasted wind generation in MW")


class ForecastsResponse(BaseModel):
    """Response for the forecasts endpoint."""
    count: int = Field(..., description="Number of records returned")
    data: List[ForecastRecord]


class LatestForecastRecord(BaseModel):
    """Latest forecast for each settlement period."""
    startTime: str
    publishTime: str
    generation: float


class LatestForecastsResponse(BaseModel):
    """Response for the latest forecasts endpoint."""
    count: int
    data: List[LatestForecastRecord]


# --- Metrics ---

class OverallMetrics(BaseModel):
    """Overall accuracy metrics for forecasts vs actuals."""
    mae: float = Field(..., description="Mean Absolute Error (MW)")
    rmse: float = Field(..., description="Root Mean Square Error (MW)")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")
    bias: float = Field(..., description="Mean Bias (MW)")
    max_absolute_error: float = Field(..., description="Maximum Absolute Error (MW)")
    correlation: float = Field(..., description="Pearson correlation coefficient")
    sample_count: int = Field(..., description="Number of matched data points")


class MetricsResponse(BaseModel):
    """Response for the metrics endpoint."""
    metrics: OverallMetrics


# --- Analysis: Forecast vs Actual ---

class ForecastVsActualRecord(BaseModel):
    """A single merged forecast vs actual record."""
    startTime: str
    actual: float
    forecast: float
    error: float = Field(..., description="Forecast - Actual (MW)")


class ForecastVsActualResponse(BaseModel):
    """Response for the forecast vs actual analysis."""
    count: int
    data: List[ForecastVsActualRecord]


# --- Analysis: Horizon ---

class HorizonRecord(BaseModel):
    """Accuracy metrics for a specific forecast horizon."""
    horizon_hours: float = Field(..., description="Lead time in hours")
    rmse: float
    mae: float
    sample_count: int


class HorizonResponse(BaseModel):
    """Response for the horizon analysis."""
    data: List[HorizonRecord]


# --- Analysis: Hourly Errors ---

class HourlyErrorRecord(BaseModel):
    """Error metrics for a specific hour of the day."""
    hour: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    mean_error: float = Field(..., description="Mean error (Forecast - Actual) in MW")
    rmse: float = Field(..., description="RMSE for this hour in MW")
    sample_count: int


class HourlyErrorsResponse(BaseModel):
    """Response for the hourly errors analysis."""
    data: List[HourlyErrorRecord]


# --- Analysis: Error Distribution ---

class HistogramBin(BaseModel):
    """A single histogram bin."""
    bin_start: float
    bin_end: float
    count: int


class ErrorDistributionStats(BaseModel):
    """Statistics for the error distribution."""
    mean: float
    std: float
    skewness: float
    kurtosis: float
    min: float
    max: float
    median: float


class ErrorDistributionResponse(BaseModel):
    """Response for the error distribution analysis."""
    bins: List[HistogramBin]
    stats: ErrorDistributionStats


# --- Analysis: Daily Metrics ---

class DailyMetricRecord(BaseModel):
    """Accuracy metrics for a single day."""
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    mae: float
    rmse: float
    mape: float
    sample_count: int


class DailyMetricsResponse(BaseModel):
    """Response for the daily metrics analysis."""
    data: List[DailyMetricRecord]


# --- Analysis: Rolling Accuracy ---

class RollingAccuracyRecord(BaseModel):
    """Rolling accuracy metric for a point in time."""
    date: str
    rmse: float
    sample_count: int


class RollingAccuracyResponse(BaseModel):
    """Response for the rolling accuracy analysis."""
    window_days: int
    data: List[RollingAccuracyRecord]


# --- Health ---

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    version: str
    cache_status: dict
